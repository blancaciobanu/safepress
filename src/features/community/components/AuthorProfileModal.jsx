import { motion, AnimatePresence } from 'framer-motion';
import { BadgeCheck, Star, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NewsModalCard } from '../../../components/editorial/NewsPage';
import { timeAgo } from '../../../utils/time';
import { UserAvatar } from './UserAvatar';

/* Author profile modal — read-only summary of a journalist or specialist.
   profile: result of getAuthorProfile() (or null/loading state)
   onSelectPost: (post) => void — called when user clicks a recent post
   onClose: () => void */

export const AuthorProfileModal = ({ profile, onSelectPost, onClose }) => (
  <AnimatePresence>
    {profile && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <NewsModalCard
          as={motion.div}
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md overflow-hidden max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-smoke-dim hover:text-ink transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {profile.loading ? (
            <div className="p-10 flex justify-center">
              <div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="px-6 pt-6 pb-4 border-b border-ink/8">
                <div className="flex items-center gap-3 mb-4">
                  <UserAvatar name={profile.username} accountType={profile.type} size="lg" />
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-base font-semibold text-ink">
                        {profile.username}
                      </span>
                      {profile.type === 'specialist' && profile.verified && (
                        <BadgeCheck className="w-4 h-4 text-oxblood" />
                      )}
                    </div>
                    <p className="text-[11px] text-smoke mt-0.5">
                      {profile.type === 'specialist'
                        ? (profile.verified ? 'verified security specialist' : 'specialist (unverified)')
                        : 'journalist'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 flex-wrap">
                  <div>
                    <p className="text-xl font-bold text-ink">{profile.postCount}</p>
                    <p className="text-[10px] text-smoke-dim">community posts</p>
                  </div>
                  {profile.type === 'specialist' && profile.supportStatsVisible && (
                    <>
                      <div>
                        <p className="text-xl font-bold text-ink">{profile.resolvedCount}</p>
                        <p className="text-[10px] text-smoke-dim">cases resolved</p>
                      </div>
                      {profile.avgRating && (
                        <div>
                          <p className="text-xl font-bold text-ink flex items-center gap-1">
                            {profile.avgRating}
                            <Star className="w-3.5 h-3.5 text-brass fill-current" />
                          </p>
                          <p className="text-[10px] text-smoke-dim">avg rating</p>
                        </div>
                      )}
                    </>
                  )}
                  {profile.createdAt && (
                    <div>
                      <p className="text-sm font-semibold text-ink-soft">
                        {new Date(profile.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] text-smoke-dim">joined</p>
                    </div>
                  )}
                </div>
              </div>

              {profile.bio && (
                <div className="px-6 py-4 border-b border-ink/8">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-smoke-dim mb-2">
                    about
                  </p>
                  <p className="text-sm text-smoke leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {profile.specializations?.length > 0 && (
                <div className="px-6 py-4 border-b border-ink/8">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-smoke-dim mb-2">
                    specializations
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.specializations.map((s, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-ink/8 border border-ink/15 text-[11px] text-ink-soft"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.recentPosts?.length > 0 && (
                <div className="px-6 py-4 border-b border-ink/8">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-smoke-dim mb-2">
                    recent posts
                  </p>
                  <div className="space-y-2">
                    {profile.recentPosts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => onSelectPost?.(p)}
                        className="w-full text-left flex items-start gap-2 px-2 py-2 hover:bg-paper-soft/80 transition-colors"
                      >
                        <span className="text-[10px] font-bold tracking-widest uppercase text-smoke-dim mt-1 flex-shrink-0">
                          {p.type === 'question' ? 'q' : 'd'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-ink-soft line-clamp-1">{p.title}</p>
                          <p className="text-[10px] text-smoke-dim">{timeAgo(p.createdAt)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {profile.type === 'specialist' && profile.recentFeedback?.length > 0 && (
                <div className="px-6 py-4 border-b border-ink/8">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-smoke-dim mb-3">
                    recent feedback
                  </p>
                  <div className="space-y-3">
                    {profile.recentFeedback.map((r, i) => (
                      <div key={i}>
                        <div className="flex items-center gap-0.5 mb-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= r.feedback.rating
                                  ? 'text-brass fill-current'
                                  : 'text-smoke-dim'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-smoke italic">"{r.feedback.comment}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profile.type === 'specialist' && profile.verified && (
                <div className="px-6 py-4">
                  <Link
                    to="/request-support"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-ink hover:bg-ink-soft text-paper text-xs font-semibold uppercase tracking-wide transition-all"
                  >
                    request support from this specialist
                  </Link>
                </div>
              )}
            </>
          )}
        </NewsModalCard>
      </motion.div>
    )}
  </AnimatePresence>
);
