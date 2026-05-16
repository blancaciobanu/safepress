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
import { NewsPage, NewsRule } from '../components/editorial/NewsPage';

/* Assessment sheet — Form SP-A.
   Printed-form structure: welcome → quiz → results with gauges.
   Editorial ink palette for scores: ink (strong) / brass (moderate) / oxblood (needs work). */

const scoreStroke = (v) => v >= 80 ? 'var(--color-ink)' : v >= 60 ? 'var(--color-brass)' : 'var(--color-oxblood)';
const scoreLabel = (v) => v >= 80 ? 'Strong' : v >= 60 ? 'Moderate' : v >= 40 ? 'Needs work' : 'Critical';
const scoreTone  = (v) => v >= 80 ? 'text-ink' : v >= 60 ? 'text-brass' : 'text-oxblood';

const riskInfo = {
  low:      { Icon: CheckCircle2, label: 'Low risk',      tone: 'text-ink',     note: 'Your security practices are solid for your work context. Maintain these habits and stay updated on emerging threats.' },
  medium:   { Icon: AlertTriangle, label: 'Medium risk',  tone: 'text-brass',   note: 'You have some good practices, but there are important gaps to address. Focus on the weak areas identified below.' },
  high:     { Icon: XCircle,      label: 'High risk',     tone: 'text-oxblood', note: 'Significant security gaps exist that could compromise your work or sources. Prioritise addressing critical issues immediately.' },
  critical: { Icon: Shield,       label: 'Critical risk', tone: 'text-oxblood', note: 'Your current security posture is inadequate for your threat level. Immediate action is required to protect yourself and sources.' },
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
  const [view, setView] = useState('welcome');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const questions = QUESTIONS;
  const answeredCount = Object.keys(answers).length;

  const total = questions.length;

  const calculateScore = () => {
    const maxPts = questions.reduce((s, q) => s + Math.max(...q.options.map(o => o.points)), 0);
    const earned = Object.values(answers).reduce((s, a) => s + a.points, 0);
    return Math.round((earned / maxPts) * 100);
  };

  const calculateCategoryScores = () => {
    const cats = {};
    questions.forEach(q => {
      if (!cats[q.category]) cats[q.category] = { name: q.categoryName, earned: 0, max: 0 };
      cats[q.category].max += Math.max(...q.options.map(o => o.points));
      if (answers[q.id]) cats[q.category].earned += answers[q.id].points;
    });
    Object.keys(cats).forEach(k => {
      cats[k].score = Math.round((cats[k].earned / cats[k].max) * 100);
    });
    return cats;
  };

  const calculateRiskLevel = () => {
    const overall = calculateScore();
    const cats = calculateCategoryScores();
    const work = cats.risk?.score ?? 50;
    if (work < 40) return overall < 50 ? 'critical' : overall < 70 ? 'high' : 'medium';
    if (work < 70) return overall < 50 ? 'high' : overall < 70 ? 'medium' : 'low';
    return overall < 50 ? 'medium' : 'low';
  };

  const getRecommendations = () => {
    const cats = calculateCategoryScores();
    const guidance = {
      password: { action: 'Set up secure passwords', link: '/secure-setup' },
      device: { action: 'Harden your devices', link: '/secure-setup' },
      communication: { action: 'Open the source protection playbook', link: '/source-protection' },
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

  const saveQuizResults = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const result = {
        score: calculateScore(),
        categoryScores: calculateCategoryScores(),
        riskLevel: calculateRiskLevel(),
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
  const restartQuiz = () => { setView('welcome'); setCurrentQuestion(0); setAnswers({}); };

  /* ── Welcome view ──────────────────────────────────────────────────── */
  if (view === 'welcome') {
    const last = user?.securityScores?.[user.securityScores.length - 1];
    const lastDate = last ? new Date(last.completedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
    return (
      <NewsPage max="reading">
        <Motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <div className="flex items-baseline justify-between pb-3">
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
      <NewsPage max="form">
        <Motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-baseline justify-between pb-3">
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
  const score     = calculateScore();
  const cats      = calculateCategoryScores();
  const risk      = calculateRiskLevel();
  const { Icon: RiskIcon, label: riskLabel, tone: riskTone, note: riskNote } = riskInfo[risk] ?? riskInfo.medium;
  const recs      = getRecommendations();
  const today     = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const filingReference = `SP-A-${new Date().getFullYear()}-${String(score).padStart(3, '0')}-${String(answeredCount).padStart(2, '0')}`;
  const catOrder  = ['password', 'device', 'communication', 'data', 'physical'];

  return (
    <NewsPage>
      <Motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        {/* Form header */}
        <div className="flex items-baseline justify-between pb-3">
          <span className="eyebrow sm text-oxblood">Form SP-A — Security assessment</span>
          <span className="eyebrow sm">Filed · {today}</span>
        </div>
        <NewsRule />

        {/* Respondent strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pb-6 border-b border-ink/12">
          {[
            { label: 'Respondent', value: user?.username || 'Anonymous', sub: user?.avatarIcon ?? '' },
            { label: 'Questions answered', value: `${answeredCount} of ${total}`, sub: null },
            { label: 'Filing reference', value: filingReference, sub: 'Form revision · v3.1' },
          ].map(({ label, value, sub }) => (
            <div key={label}>
              <p className="eyebrow sm">{label}</p>
              <p className="display-soft text-xl md:text-2xl mt-2 leading-tight">{value}</p>
              {sub && <p className="eyebrow text-[10px] normal-case text-smoke mt-1">{sub}</p>}
            </div>
          ))}
        </div>

        {/* Score + risk note */}
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-8 mt-8">
          <div>
            <p className="eyebrow sm">Result</p>
            <h1 className={`display text-6xl md:text-8xl mt-2 leading-none num ${scoreTone(score)}`}>
              {score}<span className="text-3xl text-smoke">/100</span>
            </h1>
            <p className="display-soft text-xl mt-3 leading-tight">
              <em className="italic-ox">{scoreLabel(score)} posture.</em>
            </p>
          </div>
          <div className="news-notice news-notice--brass">
            <RiskIcon className="news-notice__icon" />
            <div>
              <p className={`eyebrow sm ${riskTone}`}>{riskLabel}</p>
              <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">{riskNote}</p>
            </div>
          </div>
        </div>

        {/* Category gauges */}
        <div className="mt-10">
          <p className="eyebrow sm pb-3 border-b border-ink/20">Category breakdown</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {catOrder.map((k, i) => {
              const d = cats[k];
              if (!d) return null;
              return (
                <div key={k} className={`flex items-center gap-4 py-4 ${i < catOrder.length - 2 || (catOrder.length % 2 !== 0 && i === catOrder.length - 1) ? '' : ''} border-b border-ink/10`}>
                  <Gauge value={d.score} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="eyebrow text-[10px] normal-case text-smoke">{String(i + 1).padStart(2, '0')} · {d.name}</span>
                    </div>
                    <p className="display-soft text-lg mt-0.5 leading-tight">{d.name}</p>
                  </div>
                  <p className={`eyebrow sm shrink-0 ${scoreTone(d.score)}`}>{scoreLabel(d.score)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommendations */}
        {recs.length > 0 && (
          <div className="mt-10">
            <p className="eyebrow sm pb-3 border-b border-ink/20">Priority actions</p>
            <div className="flex flex-col gap-0">
              {recs.map(({ key, name, score: s, priority, action, link }) => (
                <div key={key} className={`flex items-baseline gap-5 py-4 border-b border-ink/10 last:border-b-0`}>
                  <Gauge value={s} size={44} />
                  <div className="flex-1">
                    <p className={`eyebrow sm ${priority === 'critical' ? 'text-oxblood' : 'text-brass'}`}>{priority}</p>
                    <p className="display-soft text-base mt-0.5 leading-tight">{name}</p>
                  </div>
                  <Link to={link} className="inline-flex items-center gap-1 btn ghost py-1.5 px-3 text-xs shrink-0">
                    {action} <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-4 border-t border-ink/22 flex flex-col sm:flex-row items-start sm:items-baseline gap-4 justify-between">
          <span className="eyebrow sm">
            Signed by respondent · {user?.username || 'Anonymous'} · {today}
          </span>
          <div className="flex gap-3 flex-wrap">
            <Link to="/secure-setup" className="btn">
              Begin remediation <ArrowRight className="w-4 h-4" />
            </Link>
            <button onClick={restartQuiz} className="btn ghost">
              <RotateCcw className="w-4 h-4" /> Re-take
            </button>
          </div>
        </div>
      </Motion.div>
    </NewsPage>
  );
};

export default SecurityScore;
