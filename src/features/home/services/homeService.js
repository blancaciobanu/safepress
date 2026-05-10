import {
  getClaimedSupportRequestsBySpecialist,
  getOpenSupportQueueRequests,
  getResolvedSupportRequestsBySpecialist,
  getSupportRequestsByRequester,
} from '../../support/services/supportService';
import { listRecentCommunityPosts } from '../../community/services/communityService';
import { COMMUNITY_NEWS_FEEDS } from '../../../config/externalResources';

const trimText = (value = '', maxLength = 180) => {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength).trimEnd()}...`;
};

const stripHtml = (value = '') =>
  value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

export const HOME_SETUP_TASK_TOTAL = 31;

export const getLatestSecurityScore = (user) => {
  if (!user?.securityScores?.length) return null;
  return user.securityScores[user.securityScores.length - 1];
};

export const getSetupProgress = (user) => {
  const completed = user?.setupProgress?.completedTasks?.length || 0;
  const percent = Math.round((completed / HOME_SETUP_TASK_TOTAL) * 100);
  return {
    completed,
    total: HOME_SETUP_TASK_TOTAL,
    percent,
  };
};

export const getSupportStatusLabel = (status) => {
  if (status === 'open') return 'awaiting specialist review';
  if (status === 'claimed') return 'specialist assigned';
  if (status === 'resolved') return 'resolved';
  return 'no active request';
};

export const getSpecialistVerificationState = (user) => {
  if (user?.accountType !== 'specialist') return null;
  if (!user.emailVerified || user.verificationStatus === 'pending-email-verification') {
    return 'pending-email-verification';
  }
  return user.verificationStatus || 'pending';
};

export const getJournalistHomeSupportSnapshot = async (userId) => {
  const requests = await getSupportRequestsByRequester(userId);
  return {
    requests,
    latestRequest: requests[0] || null,
  };
};

export const getApprovedSpecialistHomeStats = async (userId) => {
  const [openRequests, claimedRequests, resolvedRequests] = await Promise.all([
    getOpenSupportQueueRequests(),
    getClaimedSupportRequestsBySpecialist(userId),
    getResolvedSupportRequestsBySpecialist(userId),
  ]);

  return {
    openCount: openRequests.length,
    claimedCount: claimedRequests.length,
    resolvedCount: resolvedRequests.length,
  };
};

export const getInternalFieldSignal = async () => {
  const posts = await listRecentCommunityPosts(6);
  const signalPost = posts.find((post) => post?.title && post?.content) || posts[0];
  if (!signalPost) return null;

  return {
    label: signalPost.type === 'question' ? 'recent community question' : 'recent community discussion',
    title: signalPost.title,
    excerpt: trimText(signalPost.content, 190),
    href: '/community',
    meta: signalPost.category ? `Filed under ${signalPost.category}` : 'Public discussion',
  };
};

export const getExternalFieldSignal = async () => {
  for (const feed of COMMUNITY_NEWS_FEEDS) {
    try {
      const response = await fetch(feed.url);
      const payload = await response.json();
      const firstItem = payload?.status === 'ok' ? payload.items?.[0] : null;
      if (!firstItem) continue;

      const excerptSource = firstItem.description || firstItem.content || firstItem.contentSnippet || '';

      return {
        label: 'from public advisories',
        title: firstItem.title,
        excerpt: trimText(stripHtml(excerptSource), 190),
        href: firstItem.link,
        source: feed.label,
        publishedAt: firstItem.pubDate || firstItem.published || null,
      };
    } catch {
      // Try the next feed before giving up.
    }
  }

  return null;
};
