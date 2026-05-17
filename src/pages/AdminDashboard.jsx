import { motion } from 'framer-motion';
import {
  CheckCircle2,
  ExternalLink,
  Flag,
  MessageSquare,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  approveSpecialist,
  deleteCommunityReport,
  deleteReportedCommunityPost,
  getCommunityReports,
  getVerificationDashboardData,
  markCommunityReportReviewed,
  requestSpecialistMoreInfo,
  rejectSpecialist,
  setAdminClaim,
} from '../features/admin/services/adminService';
import { isSafeLinkedInUrl } from '../utils/externalLinks';
import { logError } from '../utils/logger';
import { NewsPage, NewsRule } from '../components/editorial/NewsPage';
import PageLoader from '../components/PageLoader';
import { useAuth } from '../contexts/AuthContext';
import { getInitials } from '../utils/userUtils';

const FILTERS = [
  { id: 'open', label: 'open' },
  { id: 'reviewed', label: 'reviewed' },
  { id: 'all', label: 'all' },
];

const AdminDashboard = () => {
  const { refreshUser } = useAuth();
  const [pendingDetailsVerifications, setPendingDetailsVerifications] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [needsMoreInfoVerifications, setNeedsMoreInfoVerifications] = useState([]);
  const [pendingDetailsCount, setPendingDetailsCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [needsMoreInfoCount, setNeedsMoreInfoCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [moreInfoId, setMoreInfoId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [activeTab, setActiveTab] = useState('verifications');
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportFilter, setReportFilter] = useState('open');
  const [grantTargetUid, setGrantTargetUid] = useState('');
  const [grantSubmitting, setGrantSubmitting] = useState(false);
  const [grantMessage, setGrantMessage] = useState(null);

  useEffect(() => {
    fetchVerifications();
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const rows = await getCommunityReports();
      setReports(rows);
    } catch (error) {
      logError('Error fetching reports:', error);
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const dashboardData = await getVerificationDashboardData();
      setPendingDetailsVerifications(dashboardData.pendingDetailsVerifications);
      setPendingVerifications(dashboardData.pendingVerifications);
      setNeedsMoreInfoVerifications(dashboardData.needsMoreInfoVerifications);
      setPendingDetailsCount(dashboardData.pendingDetailsCount);
      setApprovedCount(dashboardData.approvedCount);
      setNeedsMoreInfoCount(dashboardData.needsMoreInfoCount);
      setRejectedCount(dashboardData.rejectedCount);
    } catch (error) {
      logError('Error fetching verifications:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleRequestMoreInfo = async (userId) => {
    try {
      setProcessingId(userId);
      await requestSpecialistMoreInfo(userId, reviewNote);
      setMoreInfoId(null);
      setReviewNote('');
      await fetchVerifications();
    } catch (error) {
      logError('Error requesting more specialist info:', error);
      alert('Failed to request more information. Please try again.');
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

  const markReportReviewed = async (reportId) => {
    try {
      const reviewedAt = await markCommunityReportReviewed(reportId);
      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: 'reviewed', reviewedAt } : r)));
    } catch (error) {
      logError('Error updating report:', error);
    }
  };

  const deleteReport = async (reportId) => {
    try {
      await deleteCommunityReport(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (error) {
      logError('Error deleting report:', error);
    }
  };

  const deleteReportedPost = async (postId, reportId) => {
    try {
      const reviewedAt = await deleteReportedCommunityPost(postId, reportId);
      if (reportId) {
        setReports((prev) => prev.map((r) => (r.id === reportId ? {
          ...r,
          status: 'reviewed',
          reviewedAt,
          actionTaken: 'post-deleted',
        } : r)));
      }
    } catch (error) {
      logError('Error deleting reported post:', error);
    }
  };

  const openReject = (userId) => {
    setRejectingId(userId);
    setRejectionReason('');
    setMoreInfoId(null);
    setReviewNote('');
  };

  const cancelReject = () => {
    setRejectingId(null);
    setRejectionReason('');
  };

  const openMoreInfo = (userId, initialNote = '') => {
    setMoreInfoId(userId);
    setReviewNote(initialNote);
    setRejectingId(null);
    setRejectionReason('');
  };

  const cancelMoreInfo = () => {
    setMoreInfoId(null);
    setReviewNote('');
  };

  const openReportCount = reports.filter((report) => report.status === 'open').length;
  const verificationQueueCount = pendingDetailsVerifications.length + pendingVerifications.length + needsMoreInfoVerifications.length;
  const filteredReports = reports.filter((report) => (reportFilter === 'all' ? true : report.status === reportFilter));

  if (loading) {
    return (
      <NewsPage>
        <PageLoader text="Loading admin review desk…" />
      </NewsPage>
    );
  }

  return (
    <NewsPage className="admin-review-desk">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="admin-review-desk__header"
      >
        <div className="flex items-baseline justify-between pb-3">
          <span className="eyebrow sm text-oxblood">Admin review desk · verification and moderation</span>
          <span className="eyebrow sm">{verificationQueueCount + openReportCount} live items</span>
        </div>
        <NewsRule />

        <div className="admin-review-desk__hero">
          <div>
            <h1 className="display text-4xl md:text-6xl leading-none">
              Review desk<span className="italic-ox">.</span>
            </h1>
            <p className="admin-review-desk__lede">
              Approve specialists, send files back for stronger detail, and keep the community queue clean without falling back into a generic dashboard mood.
            </p>
          </div>

          <div className="admin-review-desk__note">
            <p className="eyebrow sm text-brass">How this desk works</p>
            <p className="news-card-copy mt-3">
              Read each verification like a filed packet. Approve when the casework identity is trustworthy, request more detail when the file is thin, and reject only when the route should fully stop.
            </p>
          </div>
        </div>

        <div className="admin-review-desk__stats">
          <article className="admin-review-stat">
            <p className="admin-review-stat__kicker">awaiting dossier</p>
            <p className="admin-review-stat__value">{pendingDetailsCount}</p>
          </article>
          <article className="admin-review-stat admin-review-stat--brass">
            <p className="admin-review-stat__kicker">pending review</p>
            <p className="admin-review-stat__value">{pendingVerifications.length}</p>
          </article>
          <article className="admin-review-stat">
            <p className="admin-review-stat__kicker">needs detail</p>
            <p className="admin-review-stat__value">{needsMoreInfoCount}</p>
          </article>
          <article className="admin-review-stat admin-review-stat--olive">
            <p className="admin-review-stat__kicker">approved</p>
            <p className="admin-review-stat__value">{approvedCount}</p>
          </article>
          <article className="admin-review-stat admin-review-stat--oxblood">
            <p className="admin-review-stat__kicker">rejected</p>
            <p className="admin-review-stat__value">{rejectedCount}</p>
          </article>
        </div>
      </motion.div>

      <div className="admin-review-desk__tabs">
        {[
          { id: 'verifications', label: 'verification files', count: verificationQueueCount },
          { id: 'reports', label: 'community reports', count: openReportCount },
          { id: 'internal', label: 'internal controls', count: 0 },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`admin-review-desk__tab ${active ? 'is-active' : ''}`}
            >
              <span className="admin-review-desk__tablabel">{tab.label}</span>
              {tab.count > 0 && (
                <span className={`admin-review-desk__tabcount ${active ? 'is-active' : ''}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === 'verifications' && (
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="admin-review-panel"
        >
          <div className="admin-review-panel__head">
            <div>
              <p className="eyebrow sm text-oxblood">Review queue</p>
              <h2 className="display-soft text-3xl leading-none mt-3">Specialist verification files</h2>
            </div>
            <p className="text-sm text-smoke max-w-md leading-relaxed">
              Read for judgment, not just completion. The goal is a casework identity a journalist can trust under pressure.
            </p>
          </div>

          {pendingDetailsVerifications.length > 0 && (
            <div className="admin-review-returned">
              <div className="admin-review-panel__head">
                <div>
                  <p className="eyebrow sm text-oxblood">Awaiting dossier</p>
                  <h3 className="display-soft text-2xl leading-none mt-3">Specialists who still need to complete their file</h3>
                </div>
              </div>
              <div className="admin-review-returned__list">
                {pendingDetailsVerifications.map((verification) => (
                  <article key={verification.id} className="admin-review-returned__item">
                    <div>
                      <p className="eyebrow sm text-oxblood mb-2">{verification.username}</p>
                      <p className="display-soft text-xl leading-tight">{verification.realName}</p>
                      <p className="text-sm text-smoke mt-2">{verification.email}</p>
                    </div>
                    <div>
                      <p className="eyebrow sm text-smoke mb-2">Status</p>
                      <p className="text-sm text-ink-soft leading-relaxed">
                        Email verified, but not yet reviewable. The specialist still needs to submit the fuller verification dossier.
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {pendingVerifications.length === 0 ? (
            <div className="admin-review-empty">
              <p className="display-soft text-xl leading-tight">No pending verifications.</p>
              <p className="text-sm text-smoke">Everything reviewable is already filed or waiting on the specialist.</p>
            </div>
          ) : (
            <div className="admin-review-filelist">
              {pendingVerifications.map((verification, index) => (
                <motion.article
                  key={verification.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.2 + index * 0.05 }}
                  className="admin-review-file"
                >
                  <div className="admin-review-file__topline">
                    <span className="eyebrow sm text-oxblood">verification file</span>
                    <span className="eyebrow sm">
                      submitted {new Date(verification.verificationData.submittedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="admin-review-file__body">
                    <div className="admin-review-file__identity">
                      <div className="admin-review-file__monogram">
                        {getInitials(verification.realName || verification.username || '')}
                      </div>
                      <div>
                        <p className="display-soft text-2xl leading-tight">{verification.realName}</p>
                        <p className="eyebrow sm text-oxblood mt-2">{verification.username}</p>
                        <p className="text-sm text-smoke mt-2 break-all">{verification.email}</p>
                      </div>
                    </div>

                    <div className="admin-review-file__details">
                      <div className="admin-review-file__meta">
                        <p className="eyebrow sm text-smoke mb-2">Organization</p>
                        <p className="text-sm text-ink">{verification.verificationData.organization}</p>
                      </div>
                      <div className="admin-review-file__meta">
                        <p className="eyebrow sm text-smoke mb-2">Expertise</p>
                        <p className="text-sm text-ink">{verification.verificationData.expertise}</p>
                      </div>
                      {verification.verificationData.region && (
                        <div className="admin-review-file__meta">
                          <p className="eyebrow sm text-smoke mb-2">Region</p>
                          <p className="text-sm text-ink">{verification.verificationData.region}</p>
                        </div>
                      )}
                      {verification.verificationData.languages && (
                        <div className="admin-review-file__meta">
                          <p className="eyebrow sm text-smoke mb-2">Languages</p>
                          <p className="text-sm text-ink">{verification.verificationData.languages}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="admin-review-file__credentials">
                    <p className="eyebrow sm text-smoke mb-2">Credentials and training</p>
                    <p className="text-sm text-ink-soft leading-relaxed">{verification.verificationData.credentials}</p>
                  </div>

                  {(verification.verificationData.portfolioUrl
                    || verification.verificationData.secureContactHandle
                    || verification.verificationData.availability
                    || verification.verificationData.supportAreas?.length
                    || verification.verificationData.linkedinUrl) && (
                    <div className="admin-review-file__extended">
                      {verification.verificationData.portfolioUrl && (
                        <div className="admin-review-file__meta">
                          <p className="eyebrow sm text-smoke mb-2">Portfolio</p>
                          <a
                            href={verification.verificationData.portfolioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-oxblood hover:text-ink transition-colors break-all"
                          >
                            {verification.verificationData.portfolioUrl}
                          </a>
                        </div>
                      )}
                      {verification.verificationData.linkedinUrl && isSafeLinkedInUrl(verification.verificationData.linkedinUrl) && (
                        <div className="admin-review-file__meta">
                          <p className="eyebrow sm text-smoke mb-2">LinkedIn</p>
                          <a
                            href={verification.verificationData.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-oxblood hover:text-ink transition-colors"
                          >
                            view profile
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                      {verification.verificationData.secureContactHandle && (
                        <div className="admin-review-file__meta">
                          <p className="eyebrow sm text-smoke mb-2">Secure contact</p>
                          <p className="text-sm text-ink">
                            {verification.verificationData.secureContactMethod || 'secure'} · {verification.verificationData.secureContactHandle}
                          </p>
                        </div>
                      )}
                      {verification.verificationData.availability && (
                        <div className="admin-review-file__meta">
                          <p className="eyebrow sm text-smoke mb-2">Availability</p>
                          <p className="text-sm text-ink">{verification.verificationData.availability}</p>
                        </div>
                      )}
                      {verification.verificationData.supportAreas?.length > 0 && (
                        <div className="admin-review-file__meta admin-review-file__meta--wide">
                          <p className="eyebrow sm text-smoke mb-2">Coverage</p>
                          <p className="text-sm text-ink">{verification.verificationData.supportAreas.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="admin-review-file__actions">
                    <button
                      onClick={() => handleApprove(verification.id)}
                      disabled={processingId === verification.id || rejectingId === verification.id || moreInfoId === verification.id}
                      className="admin-action admin-action--olive"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {processingId === verification.id ? 'processing...' : 'approve'}
                    </button>

                    <button
                      onClick={() => openMoreInfo(verification.id)}
                      disabled={processingId === verification.id || rejectingId === verification.id}
                      className="admin-action"
                    >
                      <MessageSquare className="w-4 h-4" />
                      request more info
                    </button>

                    <button
                      onClick={() => openReject(verification.id)}
                      disabled={processingId === verification.id || rejectingId === verification.id || moreInfoId === verification.id}
                      className="admin-action admin-action--oxblood"
                    >
                      <XCircle className="w-4 h-4" />
                      reject
                    </button>
                  </div>

                  {moreInfoId === verification.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="admin-review-file__reply"
                    >
                      <p className="eyebrow sm text-smoke mb-2">Request for revision</p>
                      <textarea
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        rows="4"
                        placeholder="Ask for the specific missing proof, coverage detail, secure contact method, or language/availability context you still need."
                        className="w-full px-3 py-2 bg-paper-soft border border-ink/12 text-sm text-ink placeholder-gray-600 focus:outline-none focus:border-oxblood transition-colors resize-none"
                      />
                      <div className="admin-review-file__replyactions">
                        <button
                          onClick={() => handleRequestMoreInfo(verification.id)}
                          disabled={processingId === verification.id || !reviewNote.trim()}
                          className="admin-action"
                        >
                          <MessageSquare className="w-4 h-4" />
                          {processingId === verification.id ? 'sending...' : 'send back for detail'}
                        </button>
                        <button
                          onClick={cancelMoreInfo}
                          disabled={processingId === verification.id}
                          className="admin-action"
                        >
                          cancel
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {rejectingId === verification.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="admin-review-file__reply"
                    >
                      <p className="eyebrow sm text-smoke mb-2">Rejection note</p>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows="3"
                        placeholder="Explain why this file should stop here."
                        className="w-full px-3 py-2 bg-paper-soft border border-ink/12 text-sm text-ink placeholder-gray-600 focus:outline-none focus:border-oxblood transition-colors resize-none"
                      />
                      <div className="admin-review-file__replyactions">
                        <button
                          onClick={() => handleReject(verification.id)}
                          disabled={processingId === verification.id}
                          className="admin-action admin-action--oxblood"
                        >
                          <XCircle className="w-4 h-4" />
                          {processingId === verification.id ? 'rejecting...' : 'confirm rejection'}
                        </button>
                        <button
                          onClick={cancelReject}
                          disabled={processingId === verification.id}
                          className="admin-action"
                        >
                          cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.article>
              ))}
            </div>
          )}

          {needsMoreInfoVerifications.length > 0 && (
            <div className="admin-review-returned">
              <div className="admin-review-panel__head">
                <div>
                  <p className="eyebrow sm text-oxblood">Returned files</p>
                  <h3 className="display-soft text-2xl leading-none mt-3">Waiting on specialist revision</h3>
                </div>
              </div>
              <div className="admin-review-returned__list">
                {needsMoreInfoVerifications.map((verification) => (
                  <article key={verification.id} className="admin-review-returned__item">
                    <div>
                      <p className="eyebrow sm text-oxblood mb-2">{verification.username}</p>
                      <p className="display-soft text-xl leading-tight">{verification.realName}</p>
                      <p className="text-sm text-smoke mt-2">{verification.email}</p>
                    </div>
                    <div>
                      <p className="eyebrow sm text-smoke mb-2">Review note</p>
                      <p className="text-sm text-ink-soft leading-relaxed">
                        {verification.verificationReviewNote || 'Waiting for updated detail from the specialist.'}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </motion.section>
      )}

      {activeTab === 'reports' && (
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="admin-review-panel"
        >
          <div className="admin-review-panel__head">
            <div>
              <p className="eyebrow sm text-oxblood">Moderation queue</p>
              <h2 className="display-soft text-3xl leading-none mt-3">Community reports</h2>
            </div>
            <div className="admin-review-filter">
              {FILTERS.map((filter) => {
                const active = reportFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setReportFilter(filter.id)}
                    className={`admin-review-filter__chip ${active ? 'is-active' : ''}`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          {reportsLoading ? (
            <div className="admin-review-empty">
              <div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="eyebrow sm text-smoke-dim">Loading reports…</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="admin-review-empty">
              <p className="display-soft text-xl leading-tight">No {reportFilter === 'all' ? '' : reportFilter} reports.</p>
              <p className="text-sm text-smoke">
                {reportFilter === 'open' ? 'The moderation queue is clear for now.' : 'Nothing is filed in this view.'}
              </p>
            </div>
          ) : (
            <div className="admin-report-list">
              {filteredReports.map((report) => (
                <article key={report.id} className="admin-report-file">
                  <div className="admin-report-file__topline">
                    <span className="eyebrow sm text-oxblood">{report.status}</span>
                    <span className="eyebrow sm">{report.reason}</span>
                    <span className="eyebrow sm">{report.createdAt ? new Date(report.createdAt).toLocaleDateString() : '—'}</span>
                  </div>

                  <div className="admin-report-file__body">
                    <div className="admin-report-file__mark">
                      <Flag className="w-5 h-5 text-oxblood" />
                    </div>
                    <div className="min-w-0">
                      {report.postMissing ? (
                        <p className="text-sm text-smoke italic">original post has been deleted</p>
                      ) : (
                        <>
                          <p className="display-soft text-xl leading-tight">{report.postTitle || 'untitled'}</p>
                          <p className="text-sm text-smoke mt-2">
                            by {report.postAuthor} · {report.postType === 'question' ? 'q&a' : 'discussion'}
                          </p>
                          {report.commentContent && (
                            <p className="admin-report-file__excerpt">
                              "{report.commentContent}"
                            </p>
                          )}
                        </>
                      )}

                      {report.note && (
                        <div className="admin-report-file__note">
                          <p className="eyebrow sm text-smoke mb-2">Reporter note</p>
                          <p className="text-sm text-ink-soft leading-relaxed">{report.note}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="admin-report-file__actions">
                    {report.status === 'open' && (
                      <button
                        onClick={() => markReportReviewed(report.id)}
                        className="admin-action admin-action--olive"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        mark reviewed
                      </button>
                    )}
                    {!report.postMissing && (report.commentId === null || report.commentId === undefined) && report.status === 'open' && (
                      <button
                        onClick={() => deleteReportedPost(report.postId, report.id)}
                        className="admin-action admin-action--oxblood"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        delete post
                      </button>
                    )}
                    <button
                      onClick={() => deleteReport(report.id)}
                      className="admin-action ml-auto"
                    >
                      discard report
                    </button>
                  </div>

                  {report.actionTaken && (
                    <p className="eyebrow sm text-smoke-dim mt-3 normal-case">action: {report.actionTaken}</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </motion.section>
      )}

      {activeTab === 'internal' && (
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="admin-review-panel"
        >
          <div className="admin-review-panel__head">
            <div>
              <p className="eyebrow sm text-oxblood">Internal controls</p>
              <h2 className="display-soft text-3xl leading-none mt-3">Admin claims</h2>
            </div>
            <p className="text-sm text-smoke max-w-md leading-relaxed">
              Use sparingly. This is the manual override that changes who can see the rest of the desk.
            </p>
          </div>

          <div className="admin-internal-note">
            <p className="eyebrow sm text-brass">Control note</p>
            <p className="news-card-copy mt-3">
              A granted admin claim stays attached to the account until it is revoked here. The target user must reload the app before the permission shift appears in their session.
            </p>
          </div>

          <div className="admin-internal-form">
            <label className="eyebrow sm text-smoke">Target user UID</label>
            <input
              type="text"
              value={grantTargetUid}
              onChange={(e) => setGrantTargetUid(e.target.value)}
              placeholder="firebase auth uid"
              disabled={grantSubmitting}
              className="w-full px-4 py-3 bg-paper-soft border border-ink/12 text-ink placeholder-gray-600 text-sm focus:outline-none focus:border-ink/60 transition-colors font-mono"
            />

            <div className="admin-internal-form__actions">
              <button
                type="button"
                onClick={() => handleGrantAdmin(true)}
                disabled={grantSubmitting}
                className="admin-action admin-action--olive"
              >
                grant admin
              </button>
              <button
                type="button"
                onClick={() => handleGrantAdmin(false)}
                disabled={grantSubmitting}
                className="admin-action admin-action--oxblood"
              >
                revoke admin
              </button>
            </div>

            {grantMessage && (
              <div className={`admin-internal-form__message ${grantMessage.type === 'success' ? 'is-success' : 'is-error'}`}>
                {grantMessage.text}
              </div>
            )}
          </div>
        </motion.section>
      )}
    </NewsPage>
  );
};

export default AdminDashboard;
