import { useEffect, useState } from 'react';
import { COMMUNITY_NEWS_FEEDS } from '../../config/externalResources';
import { logError } from '../../utils/logger';

/* Fetches and merges third-party security news feeds (HN, BleepingComputer, …).
   Returns the 8 most recent items across all configured feeds.

   Independent of Community — usable on Dashboard or anywhere else a
   "latest threats" strip belongs. */

export const useNewsArticles = ({ limit = 8 } = {}) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchNews = async () => {
      setLoading(true);
      try {
        const results = await Promise.allSettled(
          COMMUNITY_NEWS_FEEDS.map(({ url }) => fetch(url).then((r) => r.json())),
        );
        const merged = results
          .filter((r) => r.status === 'fulfilled' && r.value.status === 'ok')
          .flatMap((r) => r.value.items.map((item) => ({
            title:   item.title,
            link:    item.link,
            pubDate: item.pubDate,
            source:  r.value.feed?.title || 'Security Feed',
          })))
          .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
          .slice(0, limit);

        if (!cancelled) setArticles(merged);
      } catch (err) {
        logError('Error fetching news:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchNews();

    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { articles, loading };
};
