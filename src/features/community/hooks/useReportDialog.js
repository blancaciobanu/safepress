import { useState } from 'react';
import { createCommunityReport } from '../services/communityService';
import { logError } from '../../../utils/logger';

export const useReportDialog = (user) => {
  const [reportDialog, setReportDialog] = useState(null);

  const submitReport = async ({ reason, note }) => {
    if (!user || !reportDialog) return;
    if (!user.emailVerified) throw new Error('email not verified');
    try {
      await createCommunityReport({
        postId: reportDialog.postId,
        commentId: reportDialog.commentId ?? null,
        reportedBy: user.uid,
        reason,
        note,
        status: 'open',
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      logError('Error filing report:', err);
      throw err;
    }
  };

  return { reportDialog, setReportDialog, submitReport };
};
