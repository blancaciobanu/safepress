import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createCommunityPost } from '../features/community/services/communityService';
import { createAMA } from '../features/community/services/amaService';
import { NewsPage, NewsRule } from '../components/editorial/NewsPage';
import { CommunityRichTextEditor } from '../features/community/components/CommunityRichTextEditor';
import { logError } from '../utils/logger';
import { getDisplayName } from '../utils/userUtils';

const CATS = [
  { id: 'device-security',   name: 'devices'  },
  { id: 'source-protection', name: 'sources'  },
  { id: 'communication',     name: 'comms'    },
  { id: 'data-protection',   name: 'data'     },
  { id: 'physical-safety',   name: 'physical' },
  { id: 'legal-rights',      name: 'legal'    },
  { id: 'general',           name: 'general'  },
];

const DRAFT_KEY = 'safepress:community:draft';

const CreatePost = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const urlType      = params.get('type') || 'discussion';
  const isAMA        = urlType === 'ama';
  const isSpecialist = user?.accountType === 'specialist' && user?.verificationStatus === 'approved';

  /* Local type switcher — lets user toggle discussion ↔ question inline */
  const [postType,   setPostType]   = useState(urlType);
  const isQuestion = postType === 'question';

  const savedDraft = !isAMA
    ? (() => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}'); } catch { return {}; } })()
    : {};

  const [title,      setTitle]      = useState(savedDraft.title || (isAMA ? `Ask ${user?.username || 'me'} anything` : ''));
  const [content,    setContent]    = useState(savedDraft.content || '');
  const [cats,       setCats]       = useState(savedDraft.categories || []);
  const [anon,       setAnon]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (isAMA && !isSpecialist) navigate('/community');
  }, [user, isAMA, isSpecialist, navigate]);

  useEffect(() => {
    if (isAMA) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content, categories: cats, type: postType }));
  }, [title, content, cats, postType, isAMA]);

  const toggleCat = (id) =>
    setCats((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !title.trim()) return;
    if (!isAMA && !content.trim()) return;
    if (!user.emailVerified && !isAMA) { setError('verify your email before posting.'); return; }
    setSubmitting(true);
    setError('');
    try {
      let post;
      if (isAMA) {
        post = await createAMA(user, content);
      } else {
        const finalCats = cats.length > 0 ? cats : ['general'];
        post = await createCommunityPost({
          type:        postType,
          title:       title.trim(),
          content:     content.trim(),
          authorId:    user.uid,
          authorName:  anon ? 'anonymous' : (getDisplayName(user) || 'anonymous'),
          authorType:  user.accountType || 'journalist',
          isVerified: user.verificationStatus === 'approved',
          authorVerificationStatus: user.accountType === 'specialist' ? (user.verificationStatus || 'pending') : null,
          isAnonymous: anon,
          category:    finalCats[0],
          categories:  finalCats,
          createdAt:   new Date().toISOString(),
          likes: 0, likedBy: [], resolved: false,
        });
        localStorage.removeItem(DRAFT_KEY);
      }
      navigate(`/community/${post.id}`);
    } catch (err) {
      logError('Error creating post:', err);
      setError('failed to publish — check your connection.');
      setSubmitting(false);
    }
  };

  if (!user) return null;

  const displayHeading = isAMA ? 'Ask Me Anything' : isQuestion ? 'Ask a Question' : 'New Discussion';

  return (
    <NewsPage>
      <div>

        {/* ── Header — mirrors Community page structure ───────────── */}
        <Motion.header initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <div className="news-page-topline">
            <button onClick={() => navigate('/community')}
              className="flex items-center gap-1.5 eyebrow sm text-smoke-dim hover:text-ink transition-colors">
              <ArrowLeft className="w-3 h-3" />
              The newsroom board
            </button>
          </div>
          <NewsRule />
          <div className="mt-10 max-w-prose">
            <h1 className="display text-4xl md:text-6xl leading-none">
              {displayHeading}<em className="italic-ox">.</em>
            </h1>
          </div>

          {/* Type switcher (not for AMA) */}
          {!isAMA && (
            <div className="flex border-b border-ink/14 mt-8">
              {[
                { id: 'discussion', label: 'Discussion' },
                { id: 'question',   label: 'Question'   },
              ].map((tab, i) => {
                const active = postType === tab.id;
                return (
                  <button key={tab.id} type="button"
                    onClick={() => setPostType(tab.id)}
                    className={`relative px-4 py-3 font-mono uppercase text-[11px] tracking-[0.16em] transition-colors mr-1 ${i === 0 ? 'pl-0' : ''} ${active ? 'text-ink' : 'text-smoke hover:text-ink-soft'}`}
                  >
                    {tab.label}
                    {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink" />}
                  </button>
                );
              })}
            </div>
          )}
          {isAMA && <div className="border-b border-ink/14 mt-8" />}
        </Motion.header>

        {/* ── Two-column layout ───────────────────────────────────── */}
        <div className="lg:grid lg:grid-cols-[1fr_256px] lg:gap-8 lg:items-start mt-6">

          {/* ── Form ─────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit}>

            {/* Title box */}
            <div className="border border-ink/15 bg-paper-soft/50 mb-2 focus-within:border-ink/30 transition-colors">
              <div className="px-4 py-2.5 border-b border-ink/10">
                <label className="eyebrow sm text-smoke-dim">
                  {isAMA ? 'headline' : 'title'}
                </label>
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  isAMA        ? 'Ask me anything about…'
                  : isQuestion ? "What's your question?"
                               : "What's on your mind?"
                }
                required
                className="w-full px-4 py-3.5 bg-transparent text-ink font-display font-bold text-xl placeholder-smoke-dim focus:outline-none"
              />
            </div>

            {/* Content box */}
            <div className="border border-ink/15 bg-paper-soft/50 mb-5 focus-within:border-ink/30 transition-colors">
              <div className="px-4 py-2.5 border-b border-ink/10">
                <label className="eyebrow sm text-smoke-dim">
                  {isAMA ? 'your speciality & intro' : 'content'}
                </label>
              </div>
              <CommunityRichTextEditor
                value={content}
                onChange={setContent}
                placeholder={
                  isAMA
                    ? 'Tell journalists what you specialise in and why they should ask you…'
                    : isQuestion
                      ? 'Add context or background to help the community answer…'
                      : 'Share your thoughts, experience, or resources…'
                }
                rows={isAMA ? 5 : 10}
                className="border-0 bg-transparent mt-0"
                editorClassName="text-sm"
              />
            </div>

            {/* Tags */}
            {!isAMA && (
              <div className="mb-5">
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="eyebrow sm text-smoke-dim">tags</span>
                  <span className="text-xs text-smoke-dim">pick all that apply</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATS.map((cat) => {
                    const on = cats.includes(cat.id);
                    return (
                      <button key={cat.id} type="button" onClick={() => toggleCat(cat.id)}
                        className={`font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 border transition-colors ${
                          on
                            ? 'border-ink bg-ink text-paper'
                            : 'border-ink/20 text-smoke-dim hover:border-ink/40 hover:text-ink-soft'
                        }`}>
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Anonymous */}
            {!isAMA && !isQuestion && (
              <label className="flex items-start gap-3 mb-5 cursor-pointer">
                <input type="checkbox" checked={anon}
                  onChange={(e) => setAnon(e.target.checked)}
                  className="accent-ink mt-0.5 flex-shrink-0" />
                <span className="text-sm text-smoke">
                  Post anonymously
                  <span className="block text-xs text-smoke-dim mt-0.5">
                    your name will be hidden from the community
                  </span>
                </span>
              </label>
            )}

            {error && <p className="text-sm text-oxblood mb-4">{error}</p>}

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4 border-t border-ink/8">
              {!isAMA && (
                <span className="eyebrow sm text-smoke-dim">
                  {(title || content) ? 'draft saved' : 'autosaved'}
                </span>
              )}
              <div className="flex-1" />
              <button type="button" onClick={() => navigate('/community')}
                className="font-mono text-[10px] tracking-widest uppercase px-3 py-2 text-smoke-dim hover:text-ink transition-colors">
                cancel
              </button>
              <button type="submit"
                disabled={submitting || !title.trim() || (!isAMA && !content.trim())}
                className="btn flex items-center gap-2 text-xs uppercase tracking-widest disabled:opacity-40">
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'publishing…' : isAMA ? 'launch AMA' : 'publish'}
              </button>
            </div>
          </form>

          {/* ── Tips sidebar ─────────────────────────────────────── */}
          <aside className="hidden lg:block lg:sticky lg:top-28 mt-6 lg:mt-0">
            <div className="border border-ink/15 bg-paper-soft/40 p-4 mb-4">
              <p className="eyebrow sm text-smoke-dim mb-3">
                {isAMA ? 'AMA guidelines' : 'posting to community'}
              </p>
              <ul className="space-y-2.5">
                {(isAMA ? [
                  'Write clearly what topics you cover so journalists know what to ask',
                  'Check back regularly — active AMAs get more engagement',
                  'Verified specialists only — your badge is visible on replies',
                ] : isQuestion ? [
                  'Search first — your question may already be answered',
                  'Give enough context for experts to help you specifically',
                  'Tag your question so the right specialists see it',
                  'Never include identifying details about sources',
                ] : [
                  'Keep titles short and specific',
                  'Share what you tried or what you know so far',
                  'Tag with relevant categories to reach the right people',
                  'Never share identifying details about sources',
                ]).map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-smoke-dim leading-relaxed">
                    <span className="font-mono text-smoke-dim/40 flex-shrink-0 mt-0.5">·</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {!isAMA && (
              <div className="border border-ink/15 bg-paper-soft/40 p-4">
                <p className="eyebrow sm text-smoke-dim mb-2">community rules</p>
                <p className="text-xs text-smoke-dim leading-relaxed">
                  never share source identities · stay on topic · be respectful · report suspicious content
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </NewsPage>
  );
};

export default CreatePost;
