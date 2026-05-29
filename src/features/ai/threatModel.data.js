import { Users, Crosshair, AlertTriangle, Footprints } from 'lucide-react';

export const THREAT_LEVEL_META = {
  low: {
    label: 'Low risk',
    color: '#375E5A',
    tone: 'text-ink',
    headline: 'Low-risk posture.',
    note: 'Current routines and reporting context are not raising new pressure on this assignment. Maintain them and pressure-test as conditions change.',
  },
  medium: {
    label: 'Medium risk',
    color: '#8A6D2C',
    tone: 'text-brass',
    headline: 'Medium-risk posture.',
    note: 'The essentials are in place, but a few gaps are visible enough to matter if pressure increases on this story.',
  },
  high: {
    label: 'High risk',
    color: '#7B2E2E',
    tone: 'text-oxblood',
    headline: 'High-risk posture.',
    note: 'Several exposures point at the same workflow. Tighten the basics flagged below before the next field action.',
  },
  critical: {
    label: 'Critical risk',
    color: '#7B2E2E',
    tone: 'text-oxblood',
    headline: 'Critical-risk posture.',
    note: 'Too many foundational safeguards are missing for this threat level. The next moves should focus on immediate hardening and specialist support.',
  },
};

export const REPORT_BLOCKS = [
  { key: 'adversaries',    title: 'Likely adversaries',        accent: '#7B2E2E', Icon: Users,         summary: 'Who is most likely to push back on this work.' },
  { key: 'attackSurfaces', title: 'Exposed workflows',         accent: '#8A6D2C', Icon: Crosshair,     summary: 'Routines and channels currently carrying the most exposure.' },
  { key: 'immediateActions', title: 'Immediate actions',       accent: '#375E5A', Icon: AlertTriangle, summary: 'Hardening moves to take before the next field activity.' },
  { key: 'longerTermActions', title: 'Longer-term protections', accent: '#15110C', Icon: Footprints,   summary: 'Habits and routines worth shifting over the coming weeks.' },
];

export const DESTINATION_META = {
  'secure-setup':      { to: '/secure-setup',                   label: 'Open Secure Setup' },
  resources:           { to: '/resources',                       label: 'Open Manual' },
  'source-protection': { to: '/resources?tab=source-protection', label: 'Open Source Protection Guide' },
  'request-support':   { to: '/request-support',                 label: 'Request Specialist Support' },
  'ai-advisor':        { to: '/ai-advisor',                      label: 'Continue in AI Advisor' },
};

export const SOURCE_SENSITIVITY_OPTIONS = [
  { id: 'low',      label: 'Low',      desc: 'Mostly public or low-risk sources' },
  { id: 'moderate', label: 'Moderate', desc: 'Some confidential sources or sensitive interviews' },
  { id: 'high',     label: 'High',     desc: 'Confidential sources could face retaliation' },
  { id: 'critical', label: 'Critical', desc: 'Source exposure could cause arrest, violence, or severe reprisal' },
];

export const PUBLIC_VISIBILITY_OPTIONS = [
  { id: 'low',    label: 'Low',    desc: 'Few bylines, limited public profile' },
  { id: 'medium', label: 'Medium', desc: 'Regular bylines or moderate social visibility' },
  { id: 'high',   label: 'High',   desc: 'High public exposure, broadcast presence, or targeted profile' },
];

export const TRAVEL_PROFILE_OPTIONS = [
  { id: 'rare',         label: 'Rare',         desc: 'Mostly desk-based work' },
  { id: 'regional',     label: 'Regional',     desc: 'Regular domestic or nearby travel' },
  { id: 'cross-border', label: 'Cross-border', desc: 'International travel or border crossings' },
  { id: 'hostile',      label: 'Hostile',      desc: 'Authoritarian, conflict, or high-surveillance environments' },
];

export const THREAT_WORKFLOW = [
  { no: '01', title: 'Describe the assignment',    body: 'Give the desk the story context, geography, and any warning signs that already surfaced.' },
  { no: '02', title: 'Mark the pressure level',    body: 'Source sensitivity, visibility, and travel profile change how every weak habit should be interpreted.' },
  { no: '03', title: 'Document operating habits',  body: 'The model becomes useful when it sees how you actually handle devices, channels, and field movement.' },
];

export const DEFAULT_FORM_DATA = {
  beat: '',
  region: '',
  sourceSensitivity: 'high',
  publicVisibility: 'medium',
  travelProfile: 'regional',
  deviceProfile: '',
  communicationProfile: '',
  publicationTimeline: '',
  recentIncidents: '',
  notes: '',
};
