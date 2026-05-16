import { motion } from 'framer-motion';
import { AlertTriangle, ExternalLink, Newspaper } from 'lucide-react';
import { NewsPanel } from '../../components/editorial/NewsPage';
import { timeAgo } from '../../utils/time';
import { useNewsArticles } from './useNewsArticles';

/* Sticky "latest threats" sidebar. Editorial paper surface with
   third-party security feeds. Not community-specific — usable anywhere. */

export const NewsSidebar = ({ className = '' }) => {
  const { articles, loading } = useNewsArticles();

  return (
    <motion.aside
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`lg:sticky lg:top-32 ${className}`}
    >
      <NewsPanel muted className="p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-oxblood/8 border border-oxblood/20 flex items-center justify-center">
            <Newspaper className="w-3.5 h-3.5 text-oxblood" />
          </div>
          <h3 className="text-[10px] font-bold tracking-widest uppercase text-smoke">
            latest threats
          </h3>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-3 bg-ink/8 rounded w-full mb-2" />
                <div className="h-3 bg-ink/8 rounded w-3/4 mb-1.5" />
                <div className="h-2 bg-ink/5 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-6">
            <AlertTriangle className="w-5 h-5 text-smoke-dim mx-auto mb-2" />
            <p className="text-xs text-smoke-dim lowercase">couldn't load news feed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article, i) => (
              <a
                key={i}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <p className="text-[13px] text-ink-soft leading-snug group-hover:text-ink transition-colors mb-1.5 line-clamp-2">
                  {article.title}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-smoke-dim">
                  <span className="lowercase">{article.source}</span>
                  <span>·</span>
                  <span className="lowercase">{timeAgo(article.pubDate)}</span>
                  <ExternalLink className="w-2.5 h-2.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-smoke" />
                </div>
              </a>
            ))}
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-ink/8">
          <p className="text-[10px] text-smoke-dim lowercase leading-relaxed">
            powered by the hacker news & bleepingcomputer rss feeds
          </p>
        </div>
      </NewsPanel>
    </motion.aside>
  );
};
