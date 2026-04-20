import { motion } from 'framer-motion';
import { Shield, CheckCircle2, XCircle, ExternalLink, AlertCircle, Award, Users, Flag, MessageSquare, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const AdminDashboard = () => {
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

  useEffect(() => {
    fetchVerifications();
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const snap = await getDocs(collection(db, 'community-reports'));
      const rows = await Promise.all(snap.docs.map(async (d) => {
        const data = { id: d.id, ...d.data() };
        try {
          const postSnap = await getDoc(doc(db, 'community-posts', data.postId));
          if (postSnap.exists()) {
            const post = postSnap.data();
            data.postTitle = post.title;
            data.postType = post.type;
            data.postAuthor = post.authorName;
            if (data.commentId !== null && data.commentId !== undefined) {
              data.commentContent = post.comments?.[data.commentId]?.content;
            }
          } else {
            data.postMissing = true;
          }
        } catch (e) {
          data.postMissing = true;
        }
        return data;
      }));
      rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setReports(rows);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  const markReportReviewed = async (reportId) => {
    try {
      await updateDoc(doc(db, 'community-reports', reportId), {
        status: 'reviewed',
        reviewedAt: new Date().toISOString(),
      });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'reviewed', reviewedAt: new Date().toISOString() } : r));
    } catch (err) {
      console.error('Error updating report:', err);
    }
  };

  const deleteReport = async (reportId) => {
    try {
      await deleteDoc(doc(db, 'community-reports', reportId));
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      console.error('Error deleting report:', err);
    }
  };

  const deleteReportedPost = async (postId, reportId) => {
    try {
      await deleteDoc(doc(db, 'community-posts', postId));
      if (reportId) {
        await updateDoc(doc(db, 'community-reports', reportId), {
          status: 'reviewed',
          reviewedAt: new Date().toISOString(),
          actionTaken: 'post-deleted',
        });
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'reviewed', actionTaken: 'post-deleted' } : r));
      }
    } catch (err) {
      console.error('Error deleting reported post:', err);
    }
  };

  const fetchVerifications = async () => {
    try {
      setLoading(true);

      // Fetch pending verifications
      const pendingQuery = query(
        collection(db, 'users'),
        where('accountType', '==', 'specialist'),
        where('verificationStatus', '==', 'pending')
      );
      const pendingSnapshot = await getDocs(pendingQuery);
      const pending = pendingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPendingVerifications(pending);

      // Fetch approved count
      const approvedQuery = query(
        collection(db, 'users'),
        where('accountType', '==', 'specialist'),
        where('verificationStatus', '==', 'approved')
      );
      const approvedSnapshot = await getDocs(approvedQuery);
      setApprovedCount(approvedSnapshot.size);

      // Fetch rejected count
      const rejectedQuery = query(
        collection(db, 'users'),
        where('accountType', '==', 'specialist'),
        where('verificationStatus', '==', 'rejected')
      );
      const rejectedSnapshot = await getDocs(rejectedQuery);
      setRejectedCount(rejectedSnapshot.size);

    } catch (error) {
      console.error('Error fetching verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      setProcessingId(userId);

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        verificationStatus: 'approved',
        verificationDate: new Date().toISOString()
      });

      // Refresh the list
      await fetchVerifications();
    } catch (error) {
      console.error('Error approving verification:', error);
      alert('Failed to approve verification. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId) => {
    try {
      setProcessingId(userId);

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        verificationStatus: 'rejected',
        verificationDate: new Date().toISOString(),
        verificationRejectionReason: rejectionReason.trim() || null
      });

      setRejectingId(null);
      setRejectionReason('');
      await fetchVerifications();
    } catch (error) {
      console.error('Error rejecting verification:', error);
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
      <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-midnight-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400 lowercase">loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-midnight-400/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-midnight-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold lowercase">
              admin dashboard
            </h1>
          </div>
          <p className="text-lg text-gray-400 lowercase leading-relaxed">
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
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                pending
              </h3>
            </div>
            <p className="text-4xl font-display font-bold text-amber-500">
              {pendingVerifications.length}
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-olive-500" />
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                approved
              </h3>
            </div>
            <p className="text-4xl font-display font-bold text-olive-500">
              {approvedCount}
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-5 h-5 text-crimson-500" />
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                rejected
              </h3>
            </div>
            <p className="text-4xl font-display font-bold text-crimson-500">
              {rejectedCount}
            </p>
          </div>
        </motion.div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-white/[0.03] border border-white/[0.07] rounded-xl p-1 mb-6 w-fit">
          {[
            { id: 'verifications', label: 'verifications', icon: Shield, count: pendingVerifications.length },
            { id: 'reports', label: 'reports', icon: Flag, count: reports.filter(r => r.status === 'open').length },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all lowercase ${
                  active ? 'bg-white/[0.08] text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                    active ? 'bg-amber-500/25 text-amber-400' : 'bg-white/[0.06] text-gray-500'
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
              <div className="flex gap-1 bg-white/[0.03] border border-white/[0.07] rounded-lg p-1">
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
                        active ? 'bg-white/[0.08] text-white' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {reportsLoading ? (
              <div className="glass-card p-12 text-center">
                <div className="w-6 h-6 border-2 border-midnight-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500 lowercase">loading reports...</p>
              </div>
            ) : (() => {
              const filtered = reports.filter(r =>
                reportFilter === 'all' ? true : r.status === reportFilter
              );
              if (filtered.length === 0) {
                return (
                  <div className="glass-card p-12 text-center">
                    <Flag className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-display font-bold mb-2 lowercase">
                      no {reportFilter === 'all' ? '' : reportFilter} reports
                    </h3>
                    <p className="text-gray-400 lowercase">
                      {reportFilter === 'open' ? 'the community is behaving.' : 'nothing to show here.'}
                    </p>
                  </div>
                );
              }
              return (
                <div className="space-y-4">
                  {filtered.map((r) => (
                    <div key={r.id} className="glass-card p-5">
                      <div className="flex items-start gap-4 mb-3 flex-wrap">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          r.status === 'open' ? 'bg-amber-500/15 border border-amber-500/25' : 'bg-white/[0.04] border border-white/[0.08]'
                        }`}>
                          <Flag className={`w-5 h-5 ${r.status === 'open' ? 'text-amber-400' : 'text-gray-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded ${
                              r.status === 'open' ? 'bg-amber-500/15 text-amber-400' : 'bg-white/[0.06] text-gray-500'
                            }`}>
                              {r.status}
                            </span>
                            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500">{r.reason}</span>
                            {r.commentId !== null && r.commentId !== undefined && (
                              <span className="text-[10px] font-bold tracking-widest uppercase text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                                comment
                              </span>
                            )}
                            <span className="text-xs text-gray-600 lowercase ml-auto">
                              {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                            </span>
                          </div>
                          {r.postMissing ? (
                            <p className="text-sm text-gray-500 italic lowercase">original post has been deleted</p>
                          ) : (
                            <>
                              <p className="text-sm font-semibold text-white mb-1 lowercase">{r.postTitle || 'untitled'}</p>
                              <p className="text-xs text-gray-500 lowercase">
                                by {r.postAuthor} · {r.postType === 'question' ? 'q&a' : 'discussion'}
                              </p>
                              {r.commentContent && (
                                <p className="text-xs text-gray-400 lowercase mt-2 italic line-clamp-2 border-l-2 border-white/10 pl-2">
                                  "{r.commentContent}"
                                </p>
                              )}
                            </>
                          )}
                          {r.note && (
                            <div className="mt-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                              <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-1">reporter note</p>
                              <p className="text-xs text-gray-300 lowercase leading-relaxed">{r.note}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap pt-3 border-t border-white/[0.06]">
                        {r.status === 'open' && (
                          <button
                            onClick={() => markReportReviewed(r.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-olive-500/20 border border-olive-500/30 rounded-lg text-xs text-olive-400 hover:bg-olive-500/30 transition-all lowercase"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            mark reviewed
                          </button>
                        )}
                        {!r.postMissing && (r.commentId === null || r.commentId === undefined) && r.status === 'open' && (
                          <button
                            onClick={() => deleteReportedPost(r.postId, r.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-crimson-500/20 border border-crimson-500/30 rounded-lg text-xs text-crimson-400 hover:bg-crimson-500/30 transition-all lowercase"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            delete post
                          </button>
                        )}
                        <button
                          onClick={() => deleteReport(r.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-gray-400 rounded-lg text-xs transition-all lowercase ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          discard report
                        </button>
                      </div>
                      {r.actionTaken && (
                        <p className="text-[10px] text-gray-600 lowercase mt-2">action: {r.actionTaken}</p>
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
            <div className="glass-card p-12 text-center">
              <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-display font-bold mb-2 lowercase">
                no pending verifications
              </h3>
              <p className="text-gray-400 lowercase">
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
                  className="glass-card p-6"
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
                          <p className="text-sm text-gray-400 lowercase">
                            {verification.realName}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                            email
                          </p>
                          <p className="text-sm text-white">{verification.email}</p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                            submitted
                          </p>
                          <p className="text-sm text-white lowercase">
                            {new Date(verification.verificationData.submittedAt).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                            organization
                          </p>
                          <p className="text-sm text-white lowercase">
                            {verification.verificationData.organization}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                            expertise
                          </p>
                          <p className="text-sm text-white lowercase">
                            {verification.verificationData.expertise}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                          credentials
                        </p>
                        <p className="text-sm text-gray-300 lowercase leading-relaxed">
                          {verification.verificationData.credentials}
                        </p>
                      </div>

                      {verification.verificationData.linkedinUrl && (
                        <a
                          href={verification.verificationData.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-midnight-400 hover:text-midnight-300 transition-colors lowercase"
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
                        className="flex-1 lg:flex-none px-6 py-3 bg-olive-500 hover:bg-olive-600 text-white rounded-lg font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 lowercase"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        {processingId === verification.id ? 'processing...' : 'approve'}
                      </button>

                      <button
                        onClick={() => openReject(verification.id)}
                        disabled={processingId === verification.id || rejectingId === verification.id}
                        className="flex-1 lg:flex-none px-6 py-3 bg-crimson-500 hover:bg-crimson-600 text-white rounded-lg font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 lowercase"
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
                      className="mt-6 pt-6 border-t border-white/[0.08]"
                    >
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                        rejection reason (optional)
                      </p>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows="3"
                        placeholder="explain what's missing so the applicant can improve and reapply..."
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-crimson-500 transition-colors resize-none lowercase"
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleReject(verification.id)}
                          disabled={processingId === verification.id}
                          className="px-4 py-2 bg-crimson-500 hover:bg-crimson-600 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 lowercase"
                        >
                          <XCircle className="w-4 h-4" />
                          {processingId === verification.id ? 'rejecting...' : 'confirm rejection'}
                        </button>
                        <button
                          onClick={cancelReject}
                          disabled={processingId === verification.id}
                          className="px-4 py-2 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-gray-300 rounded-lg text-sm transition-all disabled:opacity-50 lowercase"
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
      </div>
    </div>
  );
};

export default AdminDashboard;
