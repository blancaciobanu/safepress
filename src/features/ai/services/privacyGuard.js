const REDACTION_RULES = [
  {
    label: 'email address',
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    token: 'EMAIL',
  },
  {
    label: 'phone number',
    pattern: /\+?\d[\d\s().-]{6,}\d/g,
    token: 'PHONE',
  },
  {
    label: 'link',
    pattern: /\bhttps?:\/\/\S+/gi,
    token: 'URL',
  },
  {
    label: 'IP address',
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    token: 'IP',
  },
  {
    label: 'username or social handle',
    pattern: /(^|\s)@[a-z0-9_]{2,32}\b/gi,
    token: 'HANDLE',
    preserveLeadingWhitespace: true,
  },
  {
    label: 'street address',
    pattern: /\b\d{1,5}\s+[A-Za-z0-9.'-]+\s+(?:street|st|road|rd|avenue|ave|boulevard|blvd|lane|ln|drive|dr|court|ct)\b/gi,
    token: 'ADDRESS',
  },
];

const CONTEXTUAL_REDACTION_RULES = [
  {
    label: 'person name',
    token: 'NAME',
    pattern: /\b(my name is)\s+([A-Za-z]+(?:\s+[A-Za-z]+){1,2})\b/gi,
    replace: (count, match, prefix) => `${prefix} [NAME_${count}]`,
  },
  {
    label: 'person name',
    token: 'NAME',
    pattern: /\b(i am|i'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})(?=(?:\s+(?:and|,|\.|;|who\b|from\b|at\b))|$)/g,
    replace: (count, match, prefix) => `${prefix} [NAME_${count}]`,
  },
  {
    label: 'employer or affiliation',
    token: 'ORG',
    pattern: /\b(i work at|i work for|i am at|i'm at|i am with|i'm with|journalist at|reporter at|editor at)\s+((?:the\s+)?[A-Za-z][A-Za-z0-9&'.-]*(?:\s+(?:[A-Za-z][A-Za-z0-9&'.-]*|the|of|and)){0,5})/gi,
    replace: (count, match, prefix) => `${prefix} [ORG_${count}]`,
  },
  {
    label: 'employer or affiliation',
    token: 'ORG',
    pattern: /\b((?:i am|i'm)\s+(?:an?\s+)?(?:journalist|reporter|editor|producer|staff writer|writer|correspondent|researcher|freelancer)\s+(?:at|for|with))\s+((?:the\s+)?[A-Z][A-Za-z0-9&'.-]*(?:\s+[A-Z][A-Za-z0-9&'.-]*){0,5})/gi,
    replace: (count, match, prefix) => `${prefix} [ORG_${count}]`,
  },
  {
    label: 'employer or affiliation',
    token: 'ORG',
    pattern: /\b((?:at|for|with))\s+((?:the\s+)?[A-Z][A-Za-z0-9&'.-]*(?:\s+[A-Z][A-Za-z0-9&'.-]*){0,5})(?=\s+(?:someone|somebody|they|he|she|we|i)\b|[.,;]|$)/g,
    replace: (count, match, prefix) => `${prefix} [ORG_${count}]`,
  },
  {
    label: 'family relationship',
    token: 'RELATION',
    pattern: /\b(?:my\s+)?(mother|father|mom|mum|dad|sister|brother|spouse|partner|wife|husband|daughter|son|child|children|family)\b/gi,
    replace: (count) => `[RELATION_${count}]`,
  },
];

const HEURISTIC_FLAGS = [
  {
    label: 'source reference',
    pattern: /\b(source|whistleblower|informant|confidential source)\b/i,
  },
  {
    label: 'meeting date or time',
    pattern: /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|\d{1,2}[:/.-]\d{1,2}(?:[:/.-]\d{2,4})?)\b/i,
  },
];

export const REDACTION_FLAG_LABELS = {
  'email address': 'email addresses',
  'phone number': 'phone numbers',
  link: 'links',
  'IP address': 'IP addresses',
  'username or social handle': 'usernames or social handles',
  'street address': 'street addresses',
  'person name': 'person names',
  'employer or affiliation': 'employers or affiliations',
  'family relationship': 'family relationships',
  'source reference': 'source references',
  'meeting date or time': 'meeting dates or times',
};

export const analyzeSensitiveText = (text = '') => {
  let redacted = text;
  const flags = [];

  for (const rule of REDACTION_RULES) {
    let replacements = 0;
    redacted = redacted.replace(rule.pattern, (match, ...args) => {
      replacements += 1;
      const leadingWhitespace = rule.preserveLeadingWhitespace && typeof args[0] === 'string'
        ? args[0]
        : '';
      return `${leadingWhitespace}[${rule.token}_${replacements}]`;
    });

    if (replacements > 0) {
      flags.push(rule.label);
    }
  }

  for (const rule of CONTEXTUAL_REDACTION_RULES) {
    let replacements = 0;
    redacted = redacted.replace(rule.pattern, (...args) => {
      replacements += 1;
      return rule.replace(replacements, ...args);
    });

    if (replacements > 0 && !flags.includes(rule.label)) {
      flags.push(rule.label);
    }
  }

  for (const rule of HEURISTIC_FLAGS) {
    if (rule.pattern.test(text) && !flags.includes(rule.label)) {
      flags.push(rule.label);
    }
  }

  return {
    original: text,
    redacted,
    flags,
    changed: redacted !== text,
  };
};

export const analyzePrivacyPayload = (entries = []) => {
  const analyzedEntries = entries
    .map((entry) => ({
      ...entry,
      ...(analyzeSensitiveText(entry.text ?? '')),
    }))
    .filter((entry) => typeof entry.text === 'string');

  const flags = [...new Set(analyzedEntries.flatMap((entry) => entry.flags))];

  return {
    entries: analyzedEntries,
    flags,
    hasSensitive: flags.length > 0,
    hasRedactions: analyzedEntries.some((entry) => entry.changed),
  };
};
