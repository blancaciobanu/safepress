export const isSafeLinkedInUrl = (value = '') => {
  try {
    const url = new URL(value);
    return ['linkedin.com', 'www.linkedin.com'].includes(url.hostname);
  } catch {
    return false;
  }
};
