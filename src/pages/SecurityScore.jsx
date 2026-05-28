import { motion as Motion } from 'framer-motion';
import {
  Shield, CheckCircle2, XCircle, AlertTriangle,
  Lock, Smartphone, MessageSquare, Database, MapPin,
  ArrowRight, RotateCcw, Briefcase
} from 'lucide-react';
import { createElement, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../config/firebaseCollections';
import { logError } from '../utils/logger';
import {
  NewsBadge,
  NewsCard,
  NewsPage,
  NewsRule,
} from '../components/editorial/NewsPage';
import { getDisplayName } from '../utils/userUtils';

/* Assessment sheet — Form SP-A.
   Printed-form structure: welcome → quiz → results with gauges.
   Editorial ink palette for scores: ink (strong) / brass (moderate) / oxblood (needs work). */

const scoreStroke = (v) => v >= 80 ? 'var(--color-ink)' : v >= 60 ? 'var(--color-brass)' : 'var(--color-oxblood)';
const scoreLabel = (v) => v >= 80 ? 'Strong' : v >= 60 ? 'Moderate' : v >= 40 ? 'Needs Work' : 'Critical';
const scoreTone  = (v) => v >= 80 ? 'text-ink' : v >= 60 ? 'text-brass' : 'text-oxblood';
const formatFiledDate = (value = new Date()) =>
  new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const toTitleCase = (value = '') =>
  value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

const riskInfo = {
  low:      { Icon: CheckCircle2, label: 'Low Risk',      tone: 'text-ink',     accent: '#375E5A',              note: 'Your security practices are solid for your work context. Maintain them and review them when your reporting conditions change.' },
  medium:   { Icon: AlertTriangle, label: 'Medium Risk',  tone: 'text-brass',   accent: 'var(--color-brass)',   note: 'Some of the basics are working, but there are still gaps large enough to matter on a sensitive story.' },
  high:     { Icon: XCircle,      label: 'High Risk',     tone: 'text-oxblood', accent: 'var(--color-oxblood)', note: 'Several weak routines could compromise your work or your sources. This needs focused cleanup next.' },
  critical: { Icon: Shield,       label: 'Critical Risk', tone: 'text-oxblood', accent: 'var(--color-oxblood)', note: 'Too many foundational safeguards are missing for this threat level. Immediate hardening should come first.' },
};

const CATEGORY_META = {
  password: {
    Icon: Lock,
    accent: '#7B2E2E',
    summary: 'Passwords, recovery paths, and two-factor protection.',
    strength: 'Account hygiene is giving the rest of your stack a steadier foundation right now.',
    caution: 'The basics are partly in place, but stronger password uniqueness and 2FA habits would make the stack less fragile.',
    improvement: 'Password reuse, weak recovery paths, or missing 2FA can unravel the rest of your stack quickly.',
    routeLabel: 'Open secure setup',
    route: '/secure-setup',
  },
  device: {
    Icon: Smartphone,
    accent: '#8A6D2C',
    summary: 'Updates, locks, malware protection, and device recovery.',
    strength: 'Your device routines are giving the rest of your workflow a stronger floor.',
    caution: 'A few device basics still need to become more consistent so theft or malware stays containable.',
    improvement: 'Unpatched devices or weak locks make theft, malware, and border checks much harder to contain.',
    routeLabel: 'Harden devices',
    route: '/secure-setup',
  },
  communication: {
    Icon: MessageSquare,
    accent: '#7B2E2E',
    summary: 'Source contact, verification, secure messaging, and VPN habits.',
    strength: 'Your communication habits are giving sensitive contact a steadier baseline.',
    caution: 'This area works some of the time, but it still needs more consistency when a conversation turns sensitive.',
    improvement: 'Inconsistent secure communications can expose source identities or leak sensitive context during routine contact.',
    routeLabel: 'Open source protection',
    route: '/resources?tab=source-protection',
  },
  data: {
    Icon: Database,
    accent: '#375E5A',
    summary: 'Backups, deletion, removable storage, and cloud handling.',
    strength: 'Your data-handling routines should make recovery and containment easier if something goes wrong.',
    caution: 'There are some good habits here, but backups and storage rules still need to hold up more reliably.',
    improvement: 'Backup and storage gaps increase the cost of device loss, seizure, or account compromise.',
    routeLabel: 'Improve data protection',
    route: '/secure-setup',
  },
  physical: {
    Icon: MapPin,
    accent: '#15110C',
    summary: 'Travel routines, screen privacy, device custody, and location exposure.',
    strength: 'Your field habits are helping reduce opportunistic exposure when you move through the world.',
    caution: 'This is not the weakest area, but it still needs stronger routines in public and travel-heavy situations.',
    improvement: 'Physical habits often decide whether a minor incident turns into device or source exposure.',
    routeLabel: 'Review field habits',
    route: '/resources',
  },
};

const postureNarrative = (value) => {
  if (value >= 80) {
    return 'Your routines line up well with the kinds of pressure this work creates. The next job is keeping them sharp as assignments change.';
  }
  if (value >= 60) {
    return 'The essentials are visible here, but a few weaker habits could still compromise a sensitive story when pressure goes up.';
  }
  if (value >= 40) {
    return 'Some core safeguards are missing, and those gaps are large enough to matter during real reporting pressure.';
  }
  return 'Too many foundational safeguards are missing for this workload. The next steps should focus on immediate hardening and containment.';
};

const getWorkContextMeta = (value) => {
  if (value >= 70) {
    return {
      label: 'Lower exposure context',
      color: 'var(--color-ink)',
      note: 'The work itself is comparatively less hostile right now, which gives you room to tighten the basics methodically.',
    };
  }
  if (value >= 40) {
    return {
      label: 'Moderate exposure context',
      color: 'var(--color-brass)',
      note: 'Your beat adds real pressure. Lower numbers here mean the context, sources, or geography increase the cost of weak routines elsewhere.',
    };
  }
  return {
    label: 'High exposure context',
    color: 'var(--color-oxblood)',
    note: 'This work carries elevated exposure. Lower numbers here mean the environment itself is adding pressure, so device, source, and data habits need to be tighter.',
  };
};

const categoryNarrative = (key, value) => {
  const meta = CATEGORY_META[key];
  if (!meta) return '';
  if (value >= 80) return meta.strength;
  if (value >= 60) return meta.caution;
  if (value >= 40) return meta.improvement;
  return `This is one of the most exposed parts of your current routine. ${meta.improvement}`;
};

const recommendationNarrative = (key, value, priority) => {
  const meta = CATEGORY_META[key];
  if (!meta) return `This area scored ${value}/100 and should be addressed next.`;
  if (priority === 'critical') {
    return `This area scored ${value}/100. ${meta.improvement}`;
  }
  return `This area scored ${value}/100. ${meta.caution}`;
};

const Gauge = ({ value, size = 60 }) => {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const offset = c - (c * value) / 100;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(21,17,12,0.12)" strokeWidth="2.5" />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={scoreStroke(value)} strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fill: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </text>
    </svg>
  );
};

const QUESTIONS = [
    { id: 'risk1', category: 'risk', categoryName: 'work context', icon: Briefcase, question: 'How would you describe the sensitivity of your current journalistic work?', options: [ { value: 'low', label: 'General news, entertainment, or lifestyle reporting', points: 10 }, { value: 'medium', label: 'Political, business, or social issues reporting', points: 7 }, { value: 'high', label: 'Investigative journalism or sensitive topics (corruption, whistleblowers)', points: 3 }, { value: 'critical', label: 'Conflict zones, hostile environments, or authoritarian regimes', points: 0 } ] },
    { id: 'risk2', category: 'risk', categoryName: 'work context', icon: Briefcase, question: 'Do you work with confidential sources who could face risks if their identity is revealed?', options: [ { value: 'no', label: 'No, my sources are public or low-risk', points: 10 }, { value: 'rarely', label: 'Rarely, only for specific stories', points: 7 }, { value: 'sometimes', label: 'Sometimes, for investigative work', points: 3 }, { value: 'frequently', label: 'Frequently, protecting sources is critical to my work', points: 0 } ] },
    { id: 'risk3', category: 'risk', categoryName: 'work context', icon: Briefcase, question: 'What is your geographic work environment?', options: [ { value: 'safe', label: 'Stable democracy with strong press freedom protections', points: 10 }, { value: 'moderate', label: 'Democracy with some press restrictions or surveillance concerns', points: 5 }, { value: 'restricted', label: 'Authoritarian regime or conflict zone with limited press freedom', points: 0 } ] },
    { id: 'risk4', category: 'risk', categoryName: 'work context', icon: Briefcase, question: 'How public is your professional profile?', options: [ { value: 'high', label: 'Very public (TV/broadcast, frequent bylines, active social media)', points: 10 }, { value: 'medium', label: 'Moderately visible (some bylines, limited social media presence)', points: 7 }, { value: 'low', label: 'Low visibility (prefer anonymity or work behind the scenes)', points: 5 } ] },
    { id: 'risk5', category: 'risk', categoryName: 'work context', icon: Briefcase, question: 'Have you personally experienced any of the following threats or incidents?', options: [ { value: 'none', label: 'None of the above', points: 10 }, { value: 'online', label: 'Online harassment, trolling, or coordinated attacks', points: 6 }, { value: 'surveillance', label: 'Surveillance concerns or digital monitoring', points: 3 }, { value: 'legal', label: 'Legal threats, lawsuits, or arrest risks', points: 2 }, { value: 'physical', label: 'Physical threats, violence, or data breach attempts', points: 0 } ] },
    { id: 'risk6', category: 'risk', categoryName: 'work context', icon: Briefcase, question: 'What types of stories do you typically cover?', options: [ { value: 'general', label: 'General news, sports, culture, or lifestyle', points: 10 }, { value: 'politics', label: 'Politics, government accountability, or business investigations', points: 5 }, { value: 'sensitive', label: 'Corruption, organised crime, human rights abuses, or national security', points: 0 } ] },
    { id: 'pass1', category: 'password', categoryName: 'password security', icon: Lock, question: 'Do you use unique passwords for each of your accounts?', options: [ { value: 'yes', label: 'Yes, all accounts have unique passwords', points: 10 }, { value: 'some', label: 'Some accounts share passwords', points: 5 }, { value: 'no', label: 'No, I reuse passwords across accounts', points: 0 } ] },
    { id: 'pass2', category: 'password', categoryName: 'password security', icon: Lock, question: 'Do you use a password manager?', options: [ { value: 'yes', label: 'Yes, I use a password manager for all accounts', points: 10 }, { value: 'some', label: 'I use it for some accounts', points: 5 }, { value: 'no', label: 'No, I remember my passwords', points: 0 } ] },
    { id: 'pass3', category: 'password', categoryName: 'password security', icon: Lock, question: 'Are your passwords long (12+ characters) with a mix of letters, numbers, and symbols?', options: [ { value: 'yes', label: 'Yes, all passwords are long and complex', points: 10 }, { value: 'some', label: 'Some passwords are strong', points: 5 }, { value: 'unsure', label: "I'm not sure", points: 2 }, { value: 'no', label: 'No, I use short or simple passwords', points: 0 } ] },
    { id: 'pass4', category: 'password', categoryName: 'password security', icon: Lock, question: 'Have you enabled two-factor authentication (2FA) on your important accounts?', options: [ { value: 'yes', label: 'Yes, on all critical accounts (email, banking, social media)', points: 10 }, { value: 'some', label: 'Yes, on some accounts', points: 5 }, { value: 'no', label: "No, I don't use 2FA", points: 0 } ] },
    { id: 'pass5', category: 'password', categoryName: 'password security', icon: Lock, question: 'How often do you change passwords for your sensitive accounts?', options: [ { value: 'regular', label: 'Every 3–6 months or when compromised', points: 10 }, { value: 'rare', label: 'Rarely, only when forced to', points: 5 }, { value: 'never', label: 'Never, unless I forget them', points: 0 } ] },
    { id: 'device1', category: 'device', categoryName: 'device security', icon: Smartphone, question: 'Do you keep your operating system and apps updated?', options: [ { value: 'yes', label: 'Yes, I install updates immediately', points: 10 }, { value: 'sometimes', label: 'Sometimes, when I remember', points: 5 }, { value: 'no', label: 'No, I delay or ignore updates', points: 0 } ] },
    { id: 'device2', category: 'device', categoryName: 'device security', icon: Smartphone, question: 'Do your devices require a password to access files if someone steals them?', options: [ { value: 'yes', label: 'Yes, my files are protected even if device is stolen', points: 10 }, { value: 'some', label: 'Some devices have this protection', points: 5 }, { value: 'unsure', label: "I'm not sure", points: 0 }, { value: 'no', label: 'No, files can be accessed if device is stolen', points: 0 } ] },
    { id: 'device3', category: 'device', categoryName: 'device security', icon: Smartphone, question: 'Do you use antivirus or anti-malware software on your devices?', options: [ { value: 'yes', label: 'Yes, with real-time protection enabled', points: 10 }, { value: 'basic', label: 'Only basic/built-in protection', points: 5 }, { value: 'no', label: "No, I don't use any protection", points: 0 } ] },
    { id: 'device4', category: 'device', categoryName: 'device security', icon: Smartphone, question: 'Do you use biometric locks (fingerprint/face ID) or strong PINs on your devices?', options: [ { value: 'yes', label: 'Yes, all devices have strong locks', points: 10 }, { value: 'some', label: 'Some devices have locks', points: 5 }, { value: 'no', label: 'No, minimal or no device locks', points: 0 } ] },
    { id: 'device5', category: 'device', categoryName: 'device security', icon: Smartphone, question: 'Do you have remote wipe capabilities enabled on your mobile devices?', options: [ { value: 'yes', label: 'Yes, find my device and remote wipe enabled', points: 10 }, { value: 'unsure', label: "I'm not sure if it's enabled", points: 5 }, { value: 'no', label: "No, it's not enabled", points: 0 } ] },
    { id: 'comm1', category: 'communication', categoryName: 'communication practices', icon: MessageSquare, question: 'Do you use secure messaging apps (Signal, WhatsApp) for sensitive communications?', options: [ { value: 'yes', label: 'Yes, always use Signal, WhatsApp or similar', points: 10 }, { value: 'sometimes', label: 'Sometimes, depends on the contact', points: 5 }, { value: 'unsure', label: "I'm not sure which apps are secure", points: 2 }, { value: 'no', label: 'No, I use regular SMS or other apps', points: 0 } ] },
    { id: 'comm2', category: 'communication', categoryName: 'communication practices', icon: MessageSquare, question: 'Do you verify the identity of sources before sharing sensitive information?', options: [ { value: 'yes', label: 'Yes, always through multiple channels', points: 10 }, { value: 'sometimes', label: "Sometimes, if it seems suspicious", points: 5 }, { value: 'no', label: 'No, I trust the contact information I have', points: 0 } ] },
    { id: 'comm3', category: 'communication', categoryName: 'communication practices', icon: MessageSquare, question: 'Do you use secure email services (ProtonMail, Tutanota) for sensitive correspondence?', options: [ { value: 'yes', label: 'Yes, for all sensitive communications', points: 10 }, { value: 'sometimes', label: "I have one but don't use it consistently", points: 5 }, { value: 'no', label: 'No, I use regular email (Gmail, Yahoo, etc.)', points: 0 } ] },
    { id: 'comm4', category: 'communication', categoryName: 'communication practices', icon: MessageSquare, question: 'Do you regularly delete or archive sensitive communications?', options: [ { value: 'yes', label: 'Yes, I have a routine deletion schedule', points: 10 }, { value: 'sometimes', label: 'Occasionally, when I remember', points: 5 }, { value: 'no', label: 'No, I keep everything', points: 0 } ] },
    { id: 'comm5', category: 'communication', categoryName: 'communication practices', icon: MessageSquare, question: 'Do you use a VPN when connecting to public wifi networks?', options: [ { value: 'yes', label: 'Yes, always on public networks', points: 10 }, { value: 'sometimes', label: 'Sometimes, if I remember', points: 5 }, { value: 'no', label: 'No, I connect directly', points: 0 } ] },
    { id: 'data1', category: 'data', categoryName: 'data protection', icon: Database, question: 'Do you regularly backup your important files and data?', options: [ { value: 'yes', label: 'Yes, automatic backups to protected storage', points: 10 }, { value: 'sometimes', label: 'Occasionally, I back up manually', points: 5 }, { value: 'unsure', label: "I'm not sure if backups are happening", points: 2 }, { value: 'no', label: "No, I don't back up regularly", points: 0 } ] },
    { id: 'data2', category: 'data', categoryName: 'data protection', icon: Database, question: "Are your backups protected so others can't access them?", options: [ { value: 'yes', label: 'Yes, protected with passwords and in safe locations', points: 10 }, { value: 'partial', label: 'Backed up but not password-protected', points: 5 }, { value: 'unsure', label: "I'm not sure", points: 2 }, { value: 'no', label: 'No protection or stored in accessible places', points: 0 } ] },
    { id: 'data3', category: 'data', categoryName: 'data protection', icon: Database, question: 'Do you use password-protected USB drives or external storage for sensitive files?', options: [ { value: 'yes', label: 'Yes, all external storage requires passwords', points: 10 }, { value: 'sometimes', label: 'Some drives are password-protected', points: 5 }, { value: 'unsure', label: "I'm not sure / I don't use external storage", points: 5 }, { value: 'no', label: 'No, anyone can access my drives', points: 0 } ] },
    { id: 'data4', category: 'data', categoryName: 'data protection', icon: Database, question: "When you delete sensitive files, do you permanently erase them so they can't be recovered?", options: [ { value: 'yes', label: 'Yes, I use permanent deletion tools', points: 10 }, { value: 'sometimes', label: 'Sometimes, for very sensitive files', points: 5 }, { value: 'unsure', label: "I'm not sure how to do this", points: 2 }, { value: 'no', label: 'No, I just use the trash/recycle bin', points: 0 } ] },
    { id: 'data5', category: 'data', categoryName: 'data protection', icon: Database, question: 'Do you avoid storing sensitive information in cloud services (Google Drive, Dropbox, iCloud)?', options: [ { value: 'yes', label: 'Yes, sensitive data stays on my devices only', points: 10 }, { value: 'protected', label: 'I protect files with passwords before uploading', points: 7 }, { value: 'unsure', label: "I'm not sure what's stored in the cloud", points: 2 }, { value: 'no', label: 'No, I upload everything to cloud services', points: 0 } ] },
    { id: 'physical1', category: 'physical', categoryName: 'physical security', icon: MapPin, question: 'Do you keep your devices physically secure and out of sight when not in use?', options: [ { value: 'yes', label: 'Yes, always locked away or secured', points: 10 }, { value: 'sometimes', label: 'Usually, but sometimes leave them unattended', points: 5 }, { value: 'no', label: 'No, I often leave devices in public spaces', points: 0 } ] },
    { id: 'physical2', category: 'physical', categoryName: 'physical security', icon: MapPin, question: 'Do you disable location services when not needed?', options: [ { value: 'yes', label: 'Yes, location is off unless actively needed', points: 10 }, { value: 'sometimes', label: 'Sometimes, for sensitive work', points: 5 }, { value: 'no', label: 'No, location services always on', points: 0 } ] },
    { id: 'physical3', category: 'physical', categoryName: 'physical security', icon: MapPin, question: 'Do you use privacy screens or screen protectors to prevent shoulder surfing?', options: [ { value: 'yes', label: 'Yes, on all devices used in public', points: 10 }, { value: 'sometimes', label: 'On some devices', points: 5 }, { value: 'no', label: "No, I don't use privacy screens", points: 0 } ] },
    { id: 'physical4', category: 'physical', categoryName: 'physical security', icon: MapPin, question: 'Do you cover webcams when not in use?', options: [ { value: 'yes', label: 'Yes, always covered or has physical shutter', points: 10 }, { value: 'sometimes', label: 'Sometimes, when I remember', points: 5 }, { value: 'no', label: 'No, never covered', points: 0 } ] },
    { id: 'physical5', category: 'physical', categoryName: 'physical security', icon: MapPin, question: 'Do you vary your routes and routines when working on sensitive stories?', options: [ { value: 'yes', label: 'Yes, I vary patterns and stay aware of surroundings', points: 10 }, { value: 'sometimes', label: 'Sometimes, for high-risk situations', points: 5 }, { value: 'no', label: 'No, I maintain regular patterns', points: 0 } ] },
];

const SecurityScore = () => {
  const { user } = useAuth();
  const [view, setView] = useState('auto');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const questions = QUESTIONS;
  const answeredCount = Object.keys(answers).length;
  const latestSavedScore = user?.securityScores?.length
    ? user.securityScores[user.securityScores.length - 1]
    : null;

  const total = questions.length;

  const calculateScore = (answerSet = answers) => {
    const maxPts = questions.reduce((s, q) => s + Math.max(...q.options.map(o => o.points)), 0);
    const earned = Object.values(answerSet).reduce((s, a) => s + a.points, 0);
    return Math.round((earned / maxPts) * 100);
  };

  const calculateCategoryScores = (answerSet = answers) => {
    const cats = {};
    questions.forEach(q => {
      if (!cats[q.category]) cats[q.category] = { name: q.categoryName, earned: 0, max: 0 };
      cats[q.category].max += Math.max(...q.options.map(o => o.points));
      if (answerSet[q.id]) cats[q.category].earned += answerSet[q.id].points;
    });
    Object.keys(cats).forEach(k => {
      cats[k].score = Math.round((cats[k].earned / cats[k].max) * 100);
    });
    return cats;
  };

  const calculateRiskLevel = (overall = calculateScore(), cats = calculateCategoryScores()) => {
    const work = cats.risk?.score ?? 50;
    if (work < 40) return overall < 50 ? 'critical' : overall < 70 ? 'high' : 'medium';
    if (work < 70) return overall < 50 ? 'high' : overall < 70 ? 'medium' : 'low';
    return overall < 50 ? 'medium' : 'low';
  };

  const getRecommendations = (cats = calculateCategoryScores()) => {
    const guidance = {
      password: { action: 'Set up secure passwords', link: '/secure-setup' },
      device: { action: 'Harden your devices', link: '/secure-setup' },
      communication: { action: 'Open the source protection guide in the Manual', link: '/resources?tab=source-protection' },
      data: { action: 'Improve data protection', link: '/secure-setup' },
      physical: { action: 'Review physical security', link: '/resources' },
    };
    return Object.entries(cats)
      .filter(([k, d]) => k !== 'risk' && d.score < 60)
      .sort(([, a], [, b]) => a.score - b.score)
      .map(([k, d]) => ({
        key: k, name: d.name, score: d.score,
        priority: d.score < 40 ? 'critical' : 'important',
        icon: questions.find(q => q.category === k)?.icon ?? Shield,
        ...guidance[k] ?? { action: 'View recommendations', link: '/resources' },
      }));
  };

  const currentResult = answeredCount
    ? {
        score: calculateScore(),
        categoryScores: calculateCategoryScores(),
        riskLevel: calculateRiskLevel(),
        completedAt: new Date().toISOString(),
        totalQuestions: total,
        answeredQuestions: answeredCount,
      }
    : null;
  const report = view === 'results' ? currentResult : latestSavedScore;
  const shouldShowSavedReport = view === 'auto' && latestSavedScore;

  const saveQuizResults = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const result = {
        score: calculateScore(),
        categoryScores: calculateCategoryScores(),
        riskLevel: calculateRiskLevel(calculateScore(), calculateCategoryScores()),
        completedAt: new Date().toISOString(),
        totalQuestions: total,
        answeredQuestions: answeredCount,
      };
      const ref = doc(db, COLLECTIONS.USERS, user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, { securityScores: [...(snap.data().securityScores || []), result] });
      } else {
        await setDoc(ref, { email: user.email, securityScores: [result], createdAt: new Date().toISOString() });
      }
    } catch (err) {
      logError('Error saving quiz results:', err);
      alert('Failed to save quiz results. Please try again or contact support.');
    } finally {
      setSaving(false);
    }
  };

  const handleAnswer = (qId, value, points) => setAnswers({ ...answers, [qId]: { value, points } });
  const nextQuestion = async () => {
    if (currentQuestion < total - 1) { setCurrentQuestion(currentQuestion + 1); }
    else { await saveQuizResults(); setView('results'); }
  };
  const previousQuestion = () => { if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1); };
  const restartQuiz = () => { setView('quiz'); setCurrentQuestion(0); setAnswers({}); };

  /* ── Welcome view ──────────────────────────────────────────────────── */
  if (view === 'welcome' || (!shouldShowSavedReport && view === 'auto')) {
    const last = latestSavedScore;
    const lastDate = last ? formatFiledDate(last.completedAt) : null;
    return (
      <NewsPage className="scoreDossier">
        <Motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <div className="news-page-topline">
            <span className="eyebrow sm text-oxblood">Form SP-A — Security assessment</span>
            <span className="eyebrow sm">{last ? `Last filed · ${lastDate}` : '31 questions · 6 categories'}</span>
          </div>
          <NewsRule />

          <div className="mt-10 grid grid-cols-1 md:grid-cols-[1.45fr_1fr] gap-10 items-start">
            <div>
              <h1 className="display text-4xl md:text-6xl leading-none">
                Take the security<br />assessment<span className="italic-ox">.</span>
              </h1>
              <p className="mt-5 text-base md:text-lg text-ink-soft leading-relaxed max-w-prose">
                31 questions across six security categories. The assessment profiles your risk environment and your current practices — the result is a single score and a prioritised action list.
              </p>
            </div>
            {last && (
              <div className="bg-paper-soft border border-ink/10 border-l-2 border-l-brass p-5">
                <p className="eyebrow sm">Previous result</p>
                <p className={`display text-4xl mt-2 num ${scoreTone(last.score)}`}>{last.score}<span className="text-xl text-smoke">/100</span></p>
                <p className={`eyebrow sm mt-2 ${scoreTone(last.score)}`}>{scoreLabel(last.score)}</p>
                <p className="eyebrow text-[10px] normal-case text-smoke mt-1">Filed {lastDate}</p>
              </div>
            )}
          </div>

          <div className="mt-8 grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { Icon: Lock, label: 'Password security' },
              { Icon: Smartphone, label: 'Device security' },
              { Icon: MessageSquare, label: 'Communications' },
              { Icon: Database, label: 'Data protection' },
              { Icon: MapPin, label: 'Physical security' },
              { Icon: Briefcase, label: 'Work context' },
            ].map(({ Icon, label }, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-3 border border-ink/10 bg-paper-soft/50">
                {createElement(Icon, { className: 'w-4 h-4 text-smoke' })}
                <p className="eyebrow text-[9px] normal-case text-center text-smoke leading-tight">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-5 border-t border-ink/22 flex items-center justify-between">
            <span className="eyebrow sm">Form SP-A · {total} questions</span>
            <button onClick={() => setView('quiz')} className="btn">
              Begin assessment <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </Motion.div>
      </NewsPage>
    );
  }

  /* ── Quiz view ─────────────────────────────────────────────────────── */
  if (view === 'quiz') {
    const q = questions[currentQuestion];
    const Icon = q.icon;
    const answered = !!answers[q.id];
    const pct = Math.round((currentQuestion / total) * 100);
    return (
      <NewsPage className="scoreDossier">
        <Motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="news-page-topline">
            <span className="eyebrow sm text-oxblood">Form SP-A — {q.categoryName}</span>
            <span className="eyebrow sm num">{currentQuestion + 1} / {total}</span>
          </div>
          <div className="h-0.5 bg-ink/8 mb-8">
            <div className="h-full bg-ink transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <Icon className="w-4 h-4 text-smoke shrink-0 mt-0.5" />
            <h2 className="display-soft text-xl md:text-2xl leading-snug">{q.question}</h2>
          </div>

          <div className="flex flex-col gap-2.5">
            {q.options.map((opt) => {
              const selected = answers[q.id]?.value === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(q.id, opt.value, opt.points)}
                  className={`w-full text-left px-4 py-3 border transition-colors flex items-baseline gap-3 ${
                    selected
                      ? 'border-ink bg-paper-soft'
                      : 'border-ink/10 hover:border-ink/30 hover:bg-paper-soft/60'
                  }`}
                >
                  <span className={`shrink-0 w-3.5 h-3.5 rounded-full border-[1.5px] mt-0.5 inline-flex items-center justify-center ${selected ? 'border-ink' : 'border-ink/30'}`}>
                    {selected && <span className="w-[7px] h-[7px] rounded-full bg-ink block" />}
                  </span>
                  <span className="text-sm text-ink-soft">{opt.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 pt-4 border-t border-ink/22 flex justify-between items-center gap-4">
            <button onClick={previousQuestion} disabled={currentQuestion === 0} className="btn ghost disabled:opacity-30">
              ← Back
            </button>
            <button
              onClick={nextQuestion}
              disabled={!answered || saving}
              className="btn disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : currentQuestion === total - 1 ? 'Complete assessment' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </Motion.div>
      </NewsPage>
    );
  }

  /* ── Results view ──────────────────────────────────────────────────── */
  const score     = report?.score ?? 0;
  const cats      = report?.categoryScores ?? {};
  const risk      = report?.riskLevel ?? calculateRiskLevel(score, cats);
  const { Icon: RiskIcon, label: riskLabel, tone: riskTone, note: riskNote } = riskInfo[risk] ?? riskInfo.medium;
  const recs      = getRecommendations(cats);
  const today     = formatFiledDate(report?.completedAt);
  const reportAnsweredCount = report?.answeredQuestions ?? answeredCount;
  const reportTotal = report?.totalQuestions ?? total;
  const catOrder  = ['password', 'device', 'communication', 'data', 'physical'];
  const respondentName = getDisplayName(user) || 'Anonymous';
  const categories = catOrder
    .map((key, index) => {
      const details = cats[key];
      const meta = CATEGORY_META[key];
      if (!details || !meta) return null;
      return {
        ...details,
        ...meta,
        key,
        index,
      };
    })
    .filter(Boolean);
  const sortedCategories = [...categories].sort((left, right) => left.score - right.score);
  const weakestCategory = sortedCategories[0] ?? null;
  const strongestCategory = sortedCategories[sortedCategories.length - 1] ?? null;
  const workContextScore = cats.risk?.score ?? 0;
  const workContext = getWorkContextMeta(workContextScore);
  const primaryRecommendation = recs[0] ?? null;
  const nextRoute = primaryRecommendation
    ? { label: primaryRecommendation.action, link: primaryRecommendation.link }
    : { label: 'Pressure-test it in simulations', link: '/simulations' };
  const nextRouteAccent = primaryRecommendation
    ? primaryRecommendation.priority === 'critical'
      ? 'var(--color-oxblood)'
      : 'var(--color-brass)'
    : 'var(--color-ink)';
  const primaryFocus = primaryRecommendation
    ? {
        title: toTitleCase(primaryRecommendation.name),
        score: primaryRecommendation.score,
        note: recommendationNarrative(primaryRecommendation.key, primaryRecommendation.score, primaryRecommendation.priority),
      }
    : {
        title: 'Maintain Posture',
        score: score,
        note: 'No category fell below the action threshold, so the next step is keeping the routine sharp and pressure-testing it in simulations.',
      };
  const metaCards = [
    { label: 'Respondent', value: respondentName, note: user?.accountType ? toTitleCase(user.accountType) : 'Guest Session' },
    { label: 'Questions Answered', value: `${reportAnsweredCount}/${reportTotal}`, note: 'Assessment Complete' },
    { label: 'Primary Focus', value: primaryFocus.title, note: primaryRecommendation ? `${primaryFocus.score}/100` : workContext.label },
  ];

  return (
    <NewsPage className="scoreDossier">
      <Motion.div
        className="scoreReport"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="news-page-topline scoreReportTopline">
          <span className="eyebrow sm text-oxblood">Form SP-A — Security assessment</span>
          <span className="eyebrow sm">Filed · {today}</span>
        </div>
        <NewsRule />

        <div className="scoreMetaGrid">
          {metaCards.map(({ label, value, note }) => (
            <div key={label} className="scoreMetaCard">
              <p className="eyebrow sm">{label}</p>
              <p className="display-soft text-xl md:text-2xl mt-2 leading-tight">{value}</p>
              {note && <p className="eyebrow text-[10px] normal-case text-smoke mt-1">{note}</p>}
            </div>
          ))}
        </div>

        <div className="scoreHero">
          <article className="scoreSheet">
            <div className="scoreSheetTabs" aria-hidden="true">
              <span />
              <span />
            </div>

            <div className="scoreSheetTopline">
              <div>
                <p className="eyebrow sm text-oxblood">Assessment Result</p>
                <p className="eyebrow text-[10px] normal-case text-smoke mt-1">{today}</p>
              </div>
              <NewsBadge color={scoreStroke(score)}>{scoreLabel(score)}</NewsBadge>
            </div>

            <div className="scoreSheetBody">
              <h1 className={`display text-6xl md:text-[7.25rem] leading-none num ${scoreTone(score)}`}>
                {score}<span className="text-3xl md:text-4xl text-smoke">/100</span>
              </h1>
              <p className="display-soft text-2xl mt-4 leading-tight">
                <em className="italic-ox">{scoreLabel(score)} posture.</em>
              </p>
              <p className="scoreSheetCopy">{postureNarrative(score)}</p>

              <div className="scoreSheetActions">
                <Link to="/secure-setup" className="btn">
                  Open secure setup <ArrowRight className="w-4 h-4" />
                </Link>
                <button onClick={restartQuiz} className="btn ghost">
                  <RotateCcw className="w-4 h-4" /> Retake assessment
                </button>
              </div>
            </div>

            <div className="scoreStats">
              <div className="scoreStat">
                <span>Risk Level</span>
                <strong className={riskTone}>{riskLabel}</strong>
              </div>
              <div className="scoreStat">
                <span>Work Context</span>
                <strong>{workContext.label}</strong>
              </div>
              <div className="scoreStat">
                <span>Strongest Area</span>
                <strong>{strongestCategory ? toTitleCase(strongestCategory.name) : 'Not Available'}</strong>
              </div>
              <div className="scoreStat">
                <span>Weakest Area</span>
                <strong>{weakestCategory ? toTitleCase(weakestCategory.name) : 'No Weak Area Flagged'}</strong>
              </div>
            </div>
          </article>

          <div className="scoreSide">
            <NewsCard accent={riskInfo[risk]?.accent} className="scoreSideCard">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className={`eyebrow sm ${riskTone}`}>Risk Level</p>
                  <h2 className="news-card-title mt-2">{riskLabel}</h2>
                </div>
                <RiskIcon className={`w-4 h-4 shrink-0 mt-0.5 ${riskTone}`} />
              </div>
              <p className="news-card-copy mt-4">{riskNote}</p>
            </NewsCard>

            <NewsCard accent={nextRouteAccent} className="scoreSideCard">
              <div className="scoreSideCardMeter">
                <div>
                  <p className="eyebrow sm text-oxblood">Next Move</p>
                  <h2 className="news-card-title mt-2">{primaryFocus.title}</h2>
                </div>
                <Gauge value={primaryFocus.score} size={56} />
              </div>
              <p className="news-card-copy mt-4">{primaryFocus.note}</p>
              <p className="news-card-copy mt-3">{workContext.note}</p>
              <Link to={nextRoute.link} className="scoreLink">
                {nextRoute.label} <ArrowRight className="w-3 h-3" />
              </Link>
            </NewsCard>
          </div>
        </div>

        <section className="scoreSection">
          <div className="scoreSectionHeader">
            <p className="eyebrow sm">Category Map</p>
            <span className="scoreSectionNote">Five scored areas, each with one direct route out.</span>
          </div>

          <div className="scoreCategoryGrid">
            {categories.map(({ key, index, Icon, accent, summary, route, routeLabel, name, score: categoryScore }) => (
              <NewsCard key={key} accent={accent} className="scoreCategoryCard">
                <div className="scoreCategoryHead">
                  <div className="scoreCategoryLabel">
                    <Icon className="w-3.5 h-3.5 text-smoke" />
                    <span>{String(index + 1).padStart(2, '0')} · {toTitleCase(name)}</span>
                  </div>
                  <NewsBadge color={scoreStroke(categoryScore)}>{scoreLabel(categoryScore)}</NewsBadge>
                </div>

                <div className="scoreCategoryMeter">
                  <Gauge value={categoryScore} size={72} />
                  <div>
                    <p className={`display-soft text-3xl leading-none num ${scoreTone(categoryScore)}`}>{categoryScore}</p>
                    <p className="eyebrow text-[10px] normal-case text-smoke mt-2">
                      {weakestCategory?.key === key
                        ? 'Top Priority'
                        : strongestCategory?.key === key
                          ? 'Best Protected'
                          : categoryScore < 60
                            ? 'Needs Attention'
                            : 'Stable'}
                    </p>
                  </div>
                </div>

                <p className="news-card-copy mt-4">{categoryNarrative(key, categoryScore)}</p>
                <p className="scoreCategorySummary">{summary}</p>
                <Link to={route} className="scoreLink">
                  {routeLabel} <ArrowRight className="w-3 h-3" />
                </Link>
              </NewsCard>
            ))}
          </div>
        </section>

        <div className="scoreFooter">
          <span className="eyebrow sm">
            Latest saved result · {today}
          </span>
          <div className="flex gap-3 flex-wrap">
            <Link to={nextRoute.link} className="btn ghost">
              {nextRoute.label} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </Motion.div>
    </NewsPage>
  );
};

export default SecurityScore;
