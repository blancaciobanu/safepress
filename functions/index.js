import { defineSecret } from 'firebase-functions/params';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp();

const anthropicApiKey = defineSecret('ANTHROPIC_API_KEY');
const SUPPORT_REQUEST_TYPES = new Set(['hacked', 'source', 'doxxed', 'phishing', 'other']);
const SUPPORT_REQUEST_URGENCIES = new Set(['emergency', 'urgent', 'normal']);
const SUPPORT_CONTACT_METHODS = new Set(['email', 'phone', 'signal']);
const AI_MESSAGE_ROLES = new Set(['user', 'assistant']);
const THREAT_LEVELS = new Set(['low', 'medium', 'high', 'critical']);
const RECOMMENDATION_DESTINATIONS = new Set([
  'secure-setup',
  'resources',
  'source-protection',
  'request-support',
  'ai-advisor',
]);
const DEFAULT_AI_MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

const callerIsAdmin = (auth) =>
  auth?.token?.admin === true && auth?.token?.email_verified === true;

const callerCanUseAiDrafting = (auth) =>
  Boolean(auth?.uid && auth?.token?.email_verified === true);

const callerCanUseAiAdvisor = (auth) =>
  Boolean(auth?.uid);

const clampText = (value, maxLength) =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const extractJsonObject = (value = '') => {
  const trimmed = value.trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');
  const start = withoutFence.indexOf('{');
  const end = withoutFence.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('json-object-not-found');
  }
  return withoutFence.slice(start, end + 1);
};

const normalizeDraft = (draft = {}) => {
  const crisisType = SUPPORT_REQUEST_TYPES.has(draft.crisisType) ? draft.crisisType : 'other';
  const urgency = SUPPORT_REQUEST_URGENCIES.has(draft.urgency) ? draft.urgency : 'urgent';
  const contactMethod = SUPPORT_CONTACT_METHODS.has(draft.contactMethod)
    ? draft.contactMethod
    : 'email';
  const description = clampText(draft.description, 1200);

  if (!description) {
    throw new Error('empty-description');
  }

  return {
    crisisType,
    urgency,
    contactMethod,
    description,
  };
};

const normalizeAiMessages = (messages) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('empty-messages');
  }

  return messages
    .slice(-16)
    .map((message) => ({
      role: AI_MESSAGE_ROLES.has(message?.role) ? message.role : null,
      content: clampText(message?.content, 2400),
    }))
    .filter((message) => message.role && message.content);
};

const normalizeThreatModelInput = (input = {}) => ({
  beat: clampText(input.beat, 120),
  region: clampText(input.region, 120),
  sourceSensitivity: clampText(input.sourceSensitivity, 80),
  publicVisibility: clampText(input.publicVisibility, 80),
  travelProfile: clampText(input.travelProfile, 80),
  deviceProfile: clampText(input.deviceProfile, 240),
  communicationProfile: clampText(input.communicationProfile, 240),
  publicationTimeline: clampText(input.publicationTimeline, 120),
  recentIncidents: clampText(input.recentIncidents, 240),
  notes: clampText(input.notes, 1200),
  overallScore: Number.isFinite(input.overallScore) ? Math.max(0, Math.min(100, Math.round(input.overallScore))) : null,
  weakAreas: Array.isArray(input.weakAreas)
    ? input.weakAreas.map((entry) => clampText(entry, 80)).filter(Boolean).slice(0, 6)
    : [],
  completedTasks: Number.isFinite(input.completedTasks) ? Math.max(0, Math.min(31, Math.round(input.completedTasks))) : null,
});

const toStringList = (value, maxItems = 6) =>
  Array.isArray(value)
    ? value.map((entry) => clampText(entry, 220)).filter(Boolean).slice(0, maxItems)
    : [];

const normalizeThreatReport = (report = {}) => {
  const threatLevel = THREAT_LEVELS.has(report.threatLevel) ? report.threatLevel : 'medium';
  const summary = clampText(report.summary, 500);
  const sourceRisk = clampText(report.sourceRisk, 320);
  const adversaries = toStringList(report.adversaries);
  const attackSurfaces = toStringList(report.attackSurfaces);
  const immediateActions = toStringList(report.immediateActions);
  const longerTermActions = toStringList(report.longerTermActions);
  const fieldRecommendations = Array.isArray(report.fieldRecommendations)
    ? report.fieldRecommendations
      .map((entry) => ({
        title: clampText(entry?.title, 120),
        rationale: clampText(entry?.rationale, 220),
        destination: RECOMMENDATION_DESTINATIONS.has(entry?.destination)
          ? entry.destination
          : 'resources',
      }))
      .filter((entry) => entry.title && entry.rationale)
      .slice(0, 4)
    : [];

  if (!summary || !sourceRisk || immediateActions.length === 0) {
    throw new Error('invalid-threat-report');
  }

  return {
    threatLevel,
    summary,
    sourceRisk,
    adversaries,
    attackSurfaces,
    immediateActions,
    longerTermActions,
    fieldRecommendations,
  };
};

const redactAiMessages = (messages = []) => {
  const flags = new Set();

  const redactedMessages = messages.map((message) => {
    if (message.role !== 'user') return message;

    const result = redactSensitiveDetails(message.content);
    result.flags.forEach((flag) => flags.add(flag));

    return {
      ...message,
      content: result.redacted,
    };
  });

  return {
    messages: redactedMessages,
    flags: [...flags],
  };
};

const redactSensitiveDetails = (input = '') => {
  const rules = [
    { key: 'email', label: 'email address', pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, token: 'EMAIL' },
    { key: 'phone', label: 'phone number', pattern: /\+?\d[\d\s().-]{6,}\d/g, token: 'PHONE' },
    { key: 'url', label: 'link', pattern: /\bhttps?:\/\/\S+/gi, token: 'URL' },
    { key: 'ip', label: 'IP address', pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, token: 'IP' },
    {
      key: 'handle',
      label: 'username or social handle',
      pattern: /(^|\s)@[a-z0-9_]{2,32}\b/gi,
      token: 'HANDLE',
      preserveLeadingWhitespace: true,
    },
    {
      key: 'address',
      label: 'street address',
      pattern: /\b\d{1,5}\s+[A-Za-z0-9.'-]+\s+(?:street|st|road|rd|avenue|ave|boulevard|blvd|lane|ln|drive|dr|court|ct)\b/gi,
      token: 'ADDRESS',
    },
  ];
  const contextualRules = [
    {
      key: 'name-prefix',
      label: 'person name',
      pattern: /\b(my name is)\s+([A-Za-z]+(?:\s+[A-Za-z]+){1,2})\b/gi,
      replace: (count, match, prefix) => `${prefix} [NAME_${count}]`,
    },
    {
      key: 'name-self-identification',
      label: 'person name',
      pattern: /\b(i am|i'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})(?=(?:\s+(?:and|,|\.|;|who\b|from\b|at\b))|$)/g,
      replace: (count, match, prefix) => `${prefix} [NAME_${count}]`,
    },
    {
      key: 'affiliation',
      label: 'employer or affiliation',
      pattern: /\b(i work at|i work for|i am at|i'm at|i am with|i'm with|journalist at|reporter at|editor at)\s+((?:the\s+)?[A-Za-z][A-Za-z0-9&'.-]*(?:\s+(?:[A-Za-z][A-Za-z0-9&'.-]*|the|of|and)){0,5})/gi,
      replace: (count, match, prefix) => `${prefix} [ORG_${count}]`,
    },
    {
      key: 'role-affiliation',
      label: 'employer or affiliation',
      pattern: /\b((?:i am|i'm)\s+(?:an?\s+)?(?:journalist|reporter|editor|producer|staff writer|writer|correspondent|researcher|freelancer)\s+(?:at|for|with))\s+((?:the\s+)?[A-Z][A-Za-z0-9&'.-]*(?:\s+[A-Z][A-Za-z0-9&'.-]*){0,5})/gi,
      replace: (count, match, prefix) => `${prefix} [ORG_${count}]`,
    },
    {
      key: 'trailing-affiliation',
      label: 'employer or affiliation',
      pattern: /\b((?:at|for|with))\s+((?:the\s+)?[A-Z][A-Za-z0-9&'.-]*(?:\s+[A-Z][A-Za-z0-9&'.-]*){0,5})(?=\s+(?:someone|somebody|they|he|she|we|i)\b|[.,;]|$)/g,
      replace: (count, match, prefix) => `${prefix} [ORG_${count}]`,
    },
    {
      key: 'family',
      label: 'family relationship',
      pattern: /\b(?:my\s+)?(mother|father|mom|mum|dad|sister|brother|spouse|partner|wife|husband|daughter|son|child|children|family)\b/gi,
      replace: (count) => `[RELATION_${count}]`,
    },
  ];
  const heuristicFlags = [
    {
      key: 'source-reference',
      label: 'source reference',
      pattern: /\b(source|whistleblower|informant|confidential source)\b/i,
    },
    {
      key: 'meeting-schedule',
      label: 'meeting date or time',
      pattern: /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|\d{1,2}[:/.-]\d{1,2}(?:[:/.-]\d{2,4})?)\b/i,
    },
  ];

  let redacted = input;
  const flags = [];

  for (const rule of rules) {
    let replacements = 0;
    redacted = redacted.replace(rule.pattern, (match, ...args) => {
      replacements += 1;
      const leadingWhitespace = rule.preserveLeadingWhitespace && typeof args[0] === 'string'
        ? args[0]
        : '';
      const placeholder = `${leadingWhitespace}[${rule.token}_${replacements}]`;
      return placeholder;
    });

    if (replacements > 0) {
      flags.push(rule.label);
    }
  }

  for (const rule of contextualRules) {
    let replacements = 0;
    redacted = redacted.replace(rule.pattern, (...args) => {
      replacements += 1;
      return rule.replace(replacements, ...args);
    });

    if (replacements > 0 && !flags.includes(rule.label)) {
      flags.push(rule.label);
    }
  }

  for (const rule of heuristicFlags) {
    if (rule.pattern.test(input) && !flags.includes(rule.label)) {
      flags.push(rule.label);
    }
  }

  return {
    flags,
    redacted: clampText(redacted, 3000),
  };
};

const buildSupportDraftPrompt = (roughDetails) => ({
  system: `You help journalists in crisis write calm, structured support requests.

Return valid JSON only with this exact shape:
{
  "crisisType": "hacked" | "source" | "doxxed" | "phishing" | "other",
  "urgency": "emergency" | "urgent" | "normal",
  "contactMethod": "email" | "phone" | "signal",
  "description": "100-220 words"
}

Rules:
- Write for a human specialist who needs a fast, actionable summary.
- Keep the description concise, factual, and chronological.
- Mention source risk explicitly if it appears in the notes.
- Do not invent details.
- If the safest contact method is unclear, default to "email".
- If the incident appears ongoing or source safety is at stake, prefer "urgent" or "emergency".`,
  user: `Turn these rough notes into a support request draft:\n\n${roughDetails}`,
});

const buildThreatModelPrompt = (input) => ({
  system: `You are SafePress Threat Desk. You create concise, realistic threat models for journalists.

Return valid JSON only with this exact shape:
{
  "threatLevel": "low" | "medium" | "high" | "critical",
  "summary": "120-220 words",
  "sourceRisk": "2-4 sentences",
  "adversaries": ["..."],
  "attackSurfaces": ["..."],
  "immediateActions": ["..."],
  "longerTermActions": ["..."],
  "fieldRecommendations": [
    {
      "title": "short title",
      "rationale": "1-2 sentences",
      "destination": "secure-setup" | "resources" | "source-protection" | "request-support" | "ai-advisor"
    }
  ]
}

Rules:
- Be specific to journalism, source protection, and reporting workflows.
- Do not invent facts. Work only from the supplied profile.
- Treat source exposure, hostile travel, insecure communications, and public visibility as major risk multipliers.
- Immediate actions should be concrete and time-bound.
- Longer-term actions should focus on habit changes and structural protections.
- Keep lists concise and high signal.
- If the profile suggests danger to a confidential source, say so plainly in sourceRisk.`,
  user: `Build a threat model for this journalist profile:

${JSON.stringify(input, null, 2)}`,
});

const buildJsonRepairPrompt = (rawText) => ({
  system: `You repair malformed JSON produced by another model.

Return valid JSON only.
- Preserve the original meaning.
- Do not add new facts.
- Keep the same schema that is already present in the malformed JSON.
- Remove trailing commas, broken quotes, or invalid array/object syntax as needed.`,
  user: `Repair this into valid JSON only:\n\n${rawText}`,
});

const requestAnthropicText = async ({ system, messages, maxTokens = 600 }) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': anthropicApiKey.value(),
    },
    body: JSON.stringify({
      model: DEFAULT_AI_MODEL,
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`anthropic-request-failed:${response.status}:${body.slice(0, 200)}`);
  }

  const payload = await response.json();
  const text = payload?.content?.find?.((part) => part?.type === 'text')?.text;
  if (!text) {
    throw new Error('anthropic-empty-response');
  }

  return text;
};

const requestSupportDraft = async (roughDetails) => {
  const { system, user } = buildSupportDraftPrompt(roughDetails);
  const text = await requestAnthropicText({
    system,
    messages: [{ role: 'user', content: user }],
    maxTokens: 500,
  });
  const parsed = await parseJsonWithRepair(text);
  return normalizeDraft(parsed);
};

const parseJsonWithRepair = async (text) => {
  try {
    return JSON.parse(extractJsonObject(text));
  } catch (error) {
    const { system, user } = buildJsonRepairPrompt(text);
    const repaired = await requestAnthropicText({
      system,
      messages: [{ role: 'user', content: user }],
      maxTokens: 1000,
    });
    return JSON.parse(extractJsonObject(repaired));
  }
};

const requestThreatModel = async (input) => {
  const { system, user } = buildThreatModelPrompt(input);
  const text = await requestAnthropicText({
    system,
    messages: [{ role: 'user', content: user }],
    maxTokens: 900,
  });
  const parsed = await parseJsonWithRepair(text);
  return normalizeThreatReport(parsed);
};

export const setAdminClaim = onCall({ region: 'europe-west1' }, async (request) => {
  if (!callerIsAdmin(request.auth)) {
    throw new HttpsError('permission-denied', 'caller must be an admin');
  }

  const { targetUid, admin } = request.data || {};
  if (typeof targetUid !== 'string' || targetUid.length === 0) {
    throw new HttpsError('invalid-argument', 'targetUid is required');
  }
  if (typeof admin !== 'boolean') {
    throw new HttpsError('invalid-argument', 'admin must be a boolean');
  }

  const targetUser = await getAuth().getUser(targetUid).catch(() => null);
  if (!targetUser) {
    throw new HttpsError('not-found', 'no user with that uid');
  }

  const existingClaims = targetUser.customClaims || {};
  await getAuth().setCustomUserClaims(targetUid, {
    ...existingClaims,
    admin,
  });

  await getFirestore()
    .collection('users')
    .doc(targetUid)
    .set({ claimsUpdatedAt: FieldValue.serverTimestamp() }, { merge: true });

  return { success: true, targetUid, admin };
});

export const draftSupportRequest = onCall(
  { region: 'europe-west1', secrets: [anthropicApiKey] },
  async (request) => {
    if (!callerCanUseAiDrafting(request.auth)) {
      throw new HttpsError('permission-denied', 'verified users only');
    }

    const roughDetails = clampText(request.data?.roughDetails, 3000);
    if (roughDetails.length < 20) {
      throw new HttpsError('invalid-argument', 'roughDetails must be at least 20 characters');
    }

    const { flags, redacted } = redactSensitiveDetails(roughDetails);

    try {
      const draft = await requestSupportDraft(redacted);
      return {
        draft,
        redaction: {
          applied: flags.length > 0,
          flags,
        },
      };
    } catch (error) {
      console.error('draftSupportRequest failed', error);
      throw new HttpsError('internal', 'unable to draft support request');
    }
  }
);

export const generateAiAdvisorReply = onCall(
  { region: 'europe-west1', secrets: [anthropicApiKey] },
  async (request) => {
    if (!callerCanUseAiAdvisor(request.auth)) {
      throw new HttpsError('permission-denied', 'authenticated users only');
    }

    const systemPrompt = clampText(request.data?.systemPrompt, 9000);
    const messages = normalizeAiMessages(request.data?.messages);

    if (!systemPrompt) {
      throw new HttpsError('invalid-argument', 'systemPrompt is required');
    }

    const { messages: redactedMessages, flags } = redactAiMessages(messages);

    try {
      const text = await requestAnthropicText({
        system: systemPrompt,
        messages: redactedMessages,
        maxTokens: 700,
      });

      return {
        text: clampText(text, 4000),
        redaction: {
          applied: flags.length > 0,
          flags,
        },
      };
    } catch (error) {
      console.error('generateAiAdvisorReply failed', error);
      throw new HttpsError('internal', 'unable to generate AI advisor reply');
    }
  }
);

export const generateThreatModel = onCall(
  { region: 'europe-west1', secrets: [anthropicApiKey] },
  async (request) => {
    if (!callerCanUseAiAdvisor(request.auth)) {
      throw new HttpsError('permission-denied', 'authenticated users only');
    }

    const normalizedInput = normalizeThreatModelInput(request.data?.profile);
    if (!normalizedInput.beat || !normalizedInput.region || !normalizedInput.sourceSensitivity) {
      throw new HttpsError('invalid-argument', 'beat, region, and sourceSensitivity are required');
    }

    const redactedNotes = redactSensitiveDetails(normalizedInput.notes);
    const redactedRecentIncidents = redactSensitiveDetails(normalizedInput.recentIncidents);
    const redactionFlags = [...new Set([
      ...redactedNotes.flags,
      ...redactedRecentIncidents.flags,
    ])];

    try {
      const report = await requestThreatModel({
        ...normalizedInput,
        notes: redactedNotes.redacted,
        recentIncidents: redactedRecentIncidents.redacted,
      });

      return {
        report,
        redaction: {
          applied: redactionFlags.length > 0,
          flags: redactionFlags,
        },
      };
    } catch (error) {
      console.error('generateThreatModel failed', error);
      throw new HttpsError('internal', 'unable to generate threat model');
    }
  }
);
