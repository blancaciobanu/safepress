import { motion } from 'framer-motion';
import { Shield, CheckCircle2, XCircle, ExternalLink, AlertCircle, Award, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const AdminDashboard = () => {
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchVerifications();
  }, []);

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
        verificationDate: new Date().toISOString()
      });

      // Refresh the list
      await fetchVerifications();
    } catch (error) {
      console.error('Error rejecting verification:', error);
      alert('Failed to reject verification. Please try again.');
    } finally {
      setProcessingId(null);
    }
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
          initial={{ opacity: 0, y: 20 }}
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
          initial={{ opacity: 0, y: 20 }}
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

        {/* Pending Verifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
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
                  initial={{ opacity: 0, y: 20 }}
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
                        disabled={processingId === verification.id}
                        className="flex-1 lg:flex-none px-6 py-3 bg-olive-500 hover:bg-olive-600 text-white rounded-lg font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 lowercase"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        {processingId === verification.id ? 'processing...' : 'approve'}
                      </button>

                      <button
                        onClick={() => handleReject(verification.id)}
                        disabled={processingId === verification.id}
                        className="flex-1 lg:flex-none px-6 py-3 bg-crimson-500 hover:bg-crimson-600 text-white rounded-lg font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 lowercase"
                      >
                        <XCircle className="w-5 h-5" />
                        {processingId === verification.id ? 'processing...' : 'reject'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
