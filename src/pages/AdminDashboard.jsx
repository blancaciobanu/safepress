import { motion } from 'framer-motion';
import { Shield, CheckCircle2, XCircle, ExternalLink, AlertCircle, Award, Users, Flag, MessageSquare, Trash2, KeyRound } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  approveSpecialist,
  deleteCommunityReport,
  deleteReportedCommunityPost,
  getCommunityReports,
  getVerificationDashboardData,
  markCommunityReportReviewed,
  rejectSpecialist,
  setAdminClaim,
} from '../features/admin/services/adminService';
import { isSafeLinkedInUrl } from '../utils/externalLinks';
import { logError } from '../utils/logger';
import { NewsPage } from '../components/editorial/NewsPage';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const { refreshUser } = useAuth();
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeTab, setActiveTab] = useState('verifications');
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportFilter, setReportFilter] = useState('open');
  const [grantTargetUid, setGrantTargetUid] = useState('');
  const [grantSubmitting, setGrantSubmitting] = useState(false);
  const [grantMessage, setGrantMessage] = useState(null);

  const handleGrantAdmin = async (admin) => {
    if (!grantTargetUid.trim()) {
      setGrantMessage({ type: 'error', text: 'enter a user uid' });
      return;
    }
    setGrantSubmitting(true);
    setGrantMessage(null);
    try {
      await setAdminClaim({ targetUid: grantTargetUid.trim(), admin });
      setGrantMessage({
        type: 'success',
        text: admin
          ? 'admin claim granted. user must reload to pick up new permissions.'
          : 'admin claim revoked.',
      });
      setGrantTargetUid('');
      await refreshUser();
    } catch (error) {
      logError('setAdminClaim failed:', error);
      setGrantMessage({
        type: 'error',
        text: error?.message || 'failed to update admin claim',
      });
    } finally {
      setGrantSubmitting(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const rows = await getCommunityReports();
      setReports(rows);
    } catch (err) {
      logError('Error fetching reports:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  const markReportReviewed = async (reportId) => {
    try {
      const reviewedAt = await markCommunityReportReviewed(reportId);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'reviewed', reviewedAt } : r));
    } catch (err) {
      logError('Error updating report:', err);
    }
  };

  const deleteReport = async (reportId) => {
    try {
      await deleteCommunityReport(reportId);
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      logError('Error deleting report:', err);
    }
  };

  const deleteReportedPost = async (postId, reportId) => {
    try {
      const reviewedAt = await deleteReportedCommunityPost(postId, reportId);
      if (reportId) {
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'reviewed', reviewedAt, actionTaken: 'post-deleted' } : r));
      }
    } catch (err) {
      logError('Error deleting reported post:', err);
    }
  };

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const dashboardData = await getVerificationDashboardData();
      setPendingVerifications(dashboardData.pendingVerifications);
      setApprovedCount(dashboardData.approvedCount);
      setRejectedCount(dashboardData.rejectedCount);
    } catch (error) {
      logError('Error fetching verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      setProcessingId(userId);
      await approveSpecialist(userId);
      await fetchVerifications();
    } catch (error) {
      logError('Error approving verification:', error);
      alert('Failed to approve verification. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId) => {
    try {
      setProcessingId(userId);
      await rejectSpecialist(userId, rejectionReason);
      setRejectingId(null);
      setRejectionReason('');
      await fetchVerifications();
    } catch (error) {
      logError('Error rejecting verification:', error);
      alert('Failed to reject verification. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const openReject = (userId) => {
    setRejectingId(userId);
    setRejectionReason('');
  };

  const cancelReject = () => {
    setRejectingId(null);
    setRejectionReason('');
  };

  if (loading) {
    return (
      <NewsPage max="reading">
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Shield className="w-12 h-12 text-oxblood mx-auto mb-4 animate-pulse" />
            <p className="eyebrow sm">Loading admin dashboard…</p>
          </div>
        </div>
      </NewsPage>
    );
  }

  return (
    <NewsPage>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-ink/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-oxblood" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold lowercase">
              admin dashboard
            </h1>
          </div>
          <p className="text-lg text-smoke lowercase leading-relaxed">
            manage specialist verification requests
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-paper-soft border border-ink/12 p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-semibold text-smoke uppercase tracking-wider">
                pending
              </h3>
            </div>
            <p className="text-4xl font-display font-bold text-amber-500">
              {pendingVerifications.length}
            </p>
          </div>

          <div className="bg-paper-soft border border-ink/12 p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-brass" />
              <h3 className="text-sm font-semibold text-smoke uppercase tracking-wider">
                approved
              </h3>
            </div>
            <p className="text-4xl font-display font-bold text-brass">
              {approvedCount}
            </p>
          </div>

          <div className="bg-paper-soft border border-ink/12 p-6">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-5 h-5 text-oxblood" />
              <h3 className="text-sm font-semibold text-smoke uppercase tracking-wider">
                rejected
              </h3>
            </div>
            <p className="text-4xl font-display font-bold text-oxblood">
              {rejectedCount}
            </p>
          </div>
        </motion.div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-paper-soft/60 border border-white/[0.07]  p-1 mb-6 w-fit">
          {[
            { id: 'verifications', label: 'verifications', icon: Shield, count: pendingVerifications.length },
            { id: 'reports', label: 'reports', icon: Flag, count: reports.filter(r => r.status === 'open').length },
            { id: 'internal', label: 'internal', icon: KeyRound, count: 0 },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2  text-sm font-medium transition-all lowercase ${
                  active ? 'bg-white/[0.08] text-ink' : 'text-smoke hover:text-ink-soft'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                    active ? 'bg-amber-500/25 text-brass' : 'bg-white/[0.06] text-smoke'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeTab === 'reports' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h2 className="text-2xl font-display font-bold lowercase">
                community reports
              </h2>
              <div className="flex gap-1 bg-paper-soft/60 border border-white/[0.07]  p-1">
                {[
                  { id: 'open', label: 'open' },
                  { id: 'reviewed', label: 'reviewed' },
                  { id: 'all', label: 'all' },
                ].map(f => {
                  const active = reportFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setReportFilter(f.id)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all lowercase ${
                        active ? 'bg-white/[0.08] text-ink' : 'text-smoke hover:text-ink-soft'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {reportsLoading ? (
              <div className="bg-paper-soft border border-ink/12 p-12 text-center">
                <div className="w-6 h-6 border-2 border-midnight-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-smoke lowercase">loading reports...</p>
              </div>
            ) : (() => {
              const filtered = reports.filter(r =>
                reportFilter === 'all' ? true : r.status === reportFilter
              );
              if (filtered.length === 0) {
                return (
                  <div className="bg-paper-soft border border-ink/12 p-12 text-center">
                    <Flag className="w-16 h-16 text-smoke mx-auto mb-4" />
                    <h3 className="text-xl font-display font-bold mb-2 lowercase">
                      no {reportFilter === 'all' ? '' : reportFilter} reports
                    </h3>
                    <p className="text-smoke lowercase">
                      {reportFilter === 'open' ? 'the community is behaving.' : 'nothing to show here.'}
                    </p>
                  </div>
                );
              }
              return (
                <div className="space-y-4">
                  {filtered.map((r) => (
                    <div key={r.id} className="bg-paper-soft border border-ink/12 p-5">
                      <div className="flex items-start gap-4 mb-3 flex-wrap">
                        <div className={`w-10 h-10  flex items-center justify-center flex-shrink-0 ${
                          r.status === 'open' ? 'bg-amber-500/15 border border-amber-500/25' : 'bg-white/[0.04] border border-ink/10'
                        }`}>
                          <Flag className={`w-5 h-5 ${r.status === 'open' ? 'text-brass' : 'text-smoke'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded ${
                              r.status === 'open' ? 'bg-amber-500/15 text-brass' : 'bg-white/[0.06] text-smoke'
                            }`}>
                              {r.status}
                            </span>
                            <span className="text-[10px] font-bold tracking-widest uppercase text-smoke">{r.reason}</span>
                            {r.commentId !== null && r.commentId !== undefined && (
                              <span className="text-[10px] font-bold tracking-widest uppercase text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                                comment
                              </span>
                            )}
                            <span className="text-xs text-smoke-dim lowercase ml-auto">
                              {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                            </span>
                          </div>
                          {r.postMissing ? (
                            <p className="text-sm text-smoke italic lowercase">original post has been deleted</p>
                          ) : (
                            <>
                              <p className="text-sm font-semibold text-ink mb-1 lowercase">{r.postTitle || 'untitled'}</p>
                              <p className="text-xs text-smoke lowercase">
                                by {r.postAuthor} · {r.postType === 'question' ? 'q&a' : 'discussion'}
                              </p>
                              {r.commentContent && (
                                <p className="text-xs text-smoke lowercase mt-2 italic line-clamp-2 border-l-2 border-ink/12 pl-2">
                                  "{r.commentContent}"
                                </p>
                              )}
                            </>
                          )}
                          {r.note && (
                            <div className="mt-3 p-3  bg-paper-soft/60 border border-ink/8">
                              <p className="text-[10px] font-bold tracking-widest uppercase text-smoke mb-1">reporter note</p>
                              <p className="text-xs text-ink-soft lowercase leading-relaxed">{r.note}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap pt-3 border-t border-ink/8">
                        {r.status === 'open' && (
                          <button
                            onClick={() => markReportReviewed(r.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-brass/20 border border-olive-500/30  text-xs text-brass hover:bg-brass/30 transition-all lowercase"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            mark reviewed
                          </button>
                        )}
                        {!r.postMissing && (r.commentId === null || r.commentId === undefined) && r.status === 'open' && (
                          <button
                            onClick={() => deleteReportedPost(r.postId, r.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-oxblood/20 border border-oxblood/30  text-xs text-oxblood hover:bg-oxblood/30 transition-all lowercase"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            delete post
                          </button>
                        )}
                        <button
                          onClick={() => deleteReport(r.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-ink/10 hover:bg-white/[0.08] text-smoke  text-xs transition-all lowercase ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          discard report
                        </button>
                      </div>
                      {r.actionTaken && (
                        <p className="text-[10px] text-smoke-dim lowercase mt-2">action: {r.actionTaken}</p>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* Pending Verifications */}
        {activeTab === 'verifications' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-2xl font-display font-bold mb-6 lowercase">
            pending verification requests
          </h2>

          {pendingVerifications.length === 0 ? (
            <div className="bg-paper-soft border border-ink/12 p-12 text-center">
              <Users className="w-16 h-16 text-smoke mx-auto mb-4" />
              <h3 className="text-xl font-display font-bold mb-2 lowercase">
                no pending verifications
              </h3>
              <p className="text-smoke lowercase">
                all specialist applications have been reviewed
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingVerifications.map((verification, index) => (
                <motion.div
                  key={verification.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="bg-paper-soft border border-ink/12 p-6"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">{verification.avatarIcon}</span>
                        <div>
                          <h3 className="text-xl font-display font-bold lowercase">
                            {verification.username}
                          </h3>
                          <p className="text-sm text-smoke lowercase">
                            {verification.realName}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-smoke uppercase tracking-wider mb-1">
                            email
                          </p>
                          <p className="text-sm text-ink">{verification.email}</p>
                        </div>

                        <div>
                          <p className="text-xs text-smoke uppercase tracking-wider mb-1">
                            submitted
                          </p>
                          <p className="text-sm text-ink lowercase">
                            {new Date(verification.verificationData.submittedAt).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-smoke uppercase tracking-wider mb-1">
                            organization
                          </p>
                          <p className="text-sm text-ink lowercase">
                            {verification.verificationData.organization}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-smoke uppercase tracking-wider mb-1">
                            expertise
                          </p>
                          <p className="text-sm text-ink lowercase">
                            {verification.verificationData.expertise}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-smoke uppercase tracking-wider mb-1">
                          credentials
                        </p>
                        <p className="text-sm text-ink-soft lowercase leading-relaxed">
                          {verification.verificationData.credentials}
                        </p>
                      </div>

                      {verification.verificationData.linkedinUrl && isSafeLinkedInUrl(verification.verificationData.linkedinUrl) && (
                        <a
                          href={verification.verificationData.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-oxblood hover:text-midnight-300 transition-colors lowercase"
                        >
                          view linkedin profile
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col gap-3">
                      <button
                        onClick={() => handleApprove(verification.id)}
                        disabled={processingId === verification.id || rejectingId === verification.id}
                        className="flex-1 lg:flex-none px-6 py-3 bg-brass hover:bg-olive-600 text-ink  font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 lowercase"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        {processingId === verification.id ? 'processing...' : 'approve'}
                      </button>

                      <button
                        onClick={() => openReject(verification.id)}
                        disabled={processingId === verification.id || rejectingId === verification.id}
                        className="flex-1 lg:flex-none px-6 py-3 bg-oxblood hover:bg-crimson-600 text-ink  font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 lowercase"
                      >
                        <XCircle className="w-5 h-5" />
                        reject
                      </button>
                    </div>
                  </div>

                  {/* Reject reason form */}
                  {rejectingId === verification.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-6 pt-6 border-t border-ink/10"
                    >
                      <p className="text-xs text-smoke uppercase tracking-wider mb-2">
                        rejection reason (optional)
                      </p>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows="3"
                        placeholder="explain what's missing so the applicant can improve and reapply..."
                        className="w-full px-3 py-2 bg-paper-soft border border-ink/12  text-sm text-ink placeholder-gray-600 focus:outline-none focus:border-oxblood transition-colors resize-none lowercase"
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleReject(verification.id)}
                          disabled={processingId === verification.id}
                          className="px-4 py-2 bg-oxblood hover:bg-crimson-600 text-ink  text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 lowercase"
                        >
                          <XCircle className="w-4 h-4" />
                          {processingId === verification.id ? 'rejecting...' : 'confirm rejection'}
                        </button>
                        <button
                          onClick={cancelReject}
                          disabled={processingId === verification.id}
                          className="px-4 py-2 bg-white/[0.04] border border-ink/10 hover:bg-white/[0.08] text-ink-soft  text-sm transition-all disabled:opacity-50 lowercase"
                        >
                          cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
        )}

        {activeTab === 'internal' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-paper-soft border border-ink/12 p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-semibold lowercase">grant or revoke admin</h2>
            </div>
            <p className="text-sm text-smoke lowercase mb-6 leading-relaxed">
              sets the `admin` custom claim on the target user. once set, they keep admin access until revoked here. user must reload the app for the claim to apply.
            </p>

            <label className="block text-xs text-smoke mb-1.5 lowercase">target user uid</label>
            <input
              type="text"
              value={grantTargetUid}
              onChange={(e) => setGrantTargetUid(e.target.value)}
              placeholder="firebase auth uid"
              disabled={grantSubmitting}
              className="w-full px-4 py-3 bg-paper-soft border border-ink/12  text-ink placeholder-gray-600 text-sm focus:outline-none focus:border-ink/60 transition-colors mb-4 font-mono"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleGrantAdmin(true)}
                disabled={grantSubmitting}
                className="px-4 py-2 bg-brass hover:bg-olive-600 text-ink  text-sm font-semibold transition-all disabled:opacity-50 lowercase flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                grant admin
              </button>
              <button
                type="button"
                onClick={() => handleGrantAdmin(false)}
                disabled={grantSubmitting}
                className="px-4 py-2 bg-oxblood hover:bg-crimson-600 text-ink  text-sm font-semibold transition-all disabled:opacity-50 lowercase flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                revoke admin
              </button>
            </div>

            {grantMessage && (
              <div
                className={`mt-4 p-3  text-sm lowercase ${
                  grantMessage.type === 'success'
                    ? 'bg-brass/10 border border-olive-500/20 text-brass'
                    : 'bg-oxblood/10 border border-oxblood/20 text-oxblood'
                }`}
              >
                {grantMessage.text}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </NewsPage>
  );
};

export default AdminDashboard;
