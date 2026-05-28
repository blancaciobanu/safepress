import { httpsCallable } from 'firebase/functions';
import { doc, updateDoc } from 'firebase/firestore';
import { db, functions } from '../../../firebase/config';
import { COLLECTIONS } from '../../../config/firebaseCollections';

const scoreLabel = (s) => s >= 70 ? 'strong' : s >= 50 ? 'moderate' : 'needs work';

export const buildSystemPrompt = (user) => {
  const scores = user?.securityScores;
  const latest = scores?.length ? scores[scores.length - 1] : null;
  const completed = user?.setupProgress?.completedTasks?.length ?? 0;
  const setupPct = Math.round((completed / 31) * 100);

  const persona = `You are SafePress AI, a digital security specialist for journalists. You have expertise in operational security, source protection, encrypted communications, device hardening, and threat modelling for newsroom environments. Speak plainly, without jargon, in a direct editorial register — measured, authoritative, never alarmist.`;

  let profile;
  if (latest) {
    const cs = latest.categoryScores ?? {};
    const weak = Object.entries(cs)
      .filter(([, value]) => value.score < 70)
      .sort(([, left], [, right]) => left.score - right.score)
      .map(([key, value]) => `${value.name ?? key}: ${value.score}/100`)
      .join(', ');

    profile = `JOURNALIST SECURITY PROFILE:
Overall score: ${latest.score}/100 — ${latest.riskLevel ?? 'unknown'} risk
Secure setup: ${completed}/31 tasks done (${setupPct}%)

Category scores:
• Password security:       ${cs.password?.score ?? '?'}/100 (${scoreLabel(cs.password?.score)})
• Device security:         ${cs.device?.score ?? '?'}/100 (${scoreLabel(cs.device?.score)})
• Communication:           ${cs.communication?.score ?? '?'}/100 (${scoreLabel(cs.communication?.score)})
• Data protection:         ${cs.data?.score ?? '?'}/100 (${scoreLabel(cs.data?.score)})
• Physical security:       ${cs.physical?.score ?? '?'}/100 (${scoreLabel(cs.physical?.score)})
• Work context / risk:     ${cs.risk?.score ?? '?'}/100 (${scoreLabel(cs.risk?.score)})

Weak areas (below 70): ${weak || 'none — all categories are strong'}`;
  } else {
    profile = `JOURNALIST SECURITY PROFILE:
This journalist has not yet completed a security assessment. Provide general journalism-specific advice and encourage them to take the SafePress security quiz for personalised recommendations.`;
  }

  const rules = `RULES:
1. Every answer must be specific to journalism — source protection, byline exposure, newsroom workflows, hostile state actors. Never give generic cybersecurity advice.
2. For communication security, lead with source protection implications before anything else.
3. Keep responses concise: 3–5 sentences for most questions. For the initial brief: exactly 2 sentences, no bullets, prose only.
4. No markdown bullets or headers unless the journalist explicitly asks for a list.
5. Only recommend real, vetted tools: Signal, ProtonMail, Bitwarden, VeraCrypt, Tor Browser.
6. Reference actual scores when relevant: e.g. "Your communication score of 42 suggests…"
7. Tone: editorial, direct, sober. No "Great question!" or similar phrases.
8. If asked about something outside digital or physical security, politely redirect.`;

  return [persona, profile, rules].join('\n\n');
};

const CHIP_MAP = {
  password: 'How should I manage passwords as a journalist?',
  device: 'How do I harden my devices against targeted attacks?',
  communication: 'How do I protect my sources' + "'" + ' communications?',
  data: 'What\'s the safest way to store sensitive investigation files?',
  physical: 'What physical security habits matter most in the field?',
  risk: 'How do I assess the threat level for my beat?',
};

export const buildSuggestedPrompts = (user) => {
  const scores = user?.securityScores;
  const latest = scores?.length ? scores[scores.length - 1] : null;

  if (!latest) {
    return [
      'Where should I start with digital security?',
      'How do I protect my sources\' communications?',
      'What devices and apps should I use as a journalist?',
      'What should I do if I think I\'ve been hacked?',
    ];
  }

  const cs = latest.categoryScores ?? {};
  const weak = Object.entries(cs)
    .filter(([, value]) => value.score < 70)
    .sort(([, left], [, right]) => left.score - right.score)
    .map(([key]) => key);

  const chips = ['What are my biggest security risks right now?'];
  for (const key of weak.slice(0, 3)) {
    if (CHIP_MAP[key]) chips.push(CHIP_MAP[key]);
  }

  return chips.slice(0, 4);
};

const chunkText = (text = '') => {
  if (!text) return [];

  const words = text.split(/(\s+)/).filter(Boolean);
  const chunks = [];
  let current = '';

  for (const word of words) {
    if ((current + word).length > 32 && current) {
      chunks.push(current);
      current = word;
    } else {
      current += word;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
};

const playChunks = (text, onChunk, onDone) => {
  const chunks = chunkText(text);

  if (chunks.length === 0) {
    onDone?.();
    return () => {};
  }

  let index = 0;
  const pump = () => {
    onChunk(chunks[index]);
    index += 1;
    if (index < chunks.length) {
      timerId = window.setTimeout(pump, 18);
      return;
    }
    onDone?.();
  };

  let timerId = window.setTimeout(pump, 0);

  return () => {
    if (timerId) window.clearTimeout(timerId);
  };
};

export const BRIEF_TRIGGER = 'Write my security brief.';

export async function streamMessage(apiMessages, systemPrompt, onChunk, onDone, onError) {
  try {
    const callable = httpsCallable(functions, 'generateAiAdvisorReply');
    const result = await callable({
      systemPrompt,
      messages: apiMessages,
    });

    const { text = '', redaction = { applied: false, flags: [] } } = result.data || {};
    const finish = () => onDone?.(redaction);

    if (typeof window === 'undefined') {
      if (text) onChunk(text);
      finish();
      return;
    }

    playChunks(text, onChunk, finish);
  } catch (error) {
    onError?.(error);
  }
}

export async function requestThreatModelReport(profile) {
  const callable = httpsCallable(functions, 'generateThreatModel');
  const result = await callable({ profile });
  return result.data;
}

export async function persistLatestThreatModel(uid, payload) {
  if (!uid || !payload) return;
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
    latestThreatModel: payload,
  });
}
