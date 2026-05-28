/* Stable display reference for a support case.
   Format: SP-YYYY-XXXX (XXXX = first 4 chars of the Firestore doc id, uppercased). */

export const caseFileRef = (caseLike) => {
  if (!caseLike?.id) return 'SP-—';
  const year = caseLike.createdAt
    ? new Date(caseLike.createdAt).getFullYear()
    : new Date().getFullYear();
  const slug = caseLike.id.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase().padEnd(4, '0');
  return `SP-${year}-${slug}`;
};
