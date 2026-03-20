import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, X, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '../types';

interface Props {
  notification: Notification | null;
  onDismiss: () => void;
}

const DURATION = 5000;

export function ToastNotification({ notification, onDismiss }: Props) {
  const [progress, setProgress] = useState(100);
  const navigate = useNavigate();

  useEffect(() => {
    if (!notification) return;
    setProgress(100);

    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [notification, onDismiss]);

  const isApproved = notification?.decision === 'APPROVED';

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.92, x: 20 }}
          animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
          exit={{ opacity: 0, y: 40, scale: 0.95, x: 20 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="fixed bottom-6 right-6 z-[100] w-80 rounded-2xl overflow-hidden shadow-2xl cursor-pointer"
          style={{
            background: 'linear-gradient(145deg, rgba(15,23,42,0.97) 0%, rgba(30,41,59,0.97) 100%)',
            border: `1px solid ${isApproved ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            backdropFilter: 'blur(20px)',
            boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px ${isApproved ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}`,
          }}
          onClick={() => {
            onDismiss();
            navigate(`/documents/${notification.documentId}`);
          }}
        >
          {/* Glow top bar */}
          <div
            className="h-0.5"
            style={{
              background: isApproved
                ? 'linear-gradient(90deg, transparent, #10B981, transparent)'
                : 'linear-gradient(90deg, transparent, #EF4444, transparent)',
            }}
          />

          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Decision icon */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: isApproved ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  border: `1px solid ${isApproved ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                }}
              >
                {isApproved
                  ? <CheckCircle size={20} className="text-emerald-400" />
                  : <XCircle size={20} className="text-red-400" />}
              </motion.div>

              <div className="flex-1 min-w-0">
                {/* Status label */}
                <motion.p
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-xs font-bold tracking-widest uppercase mb-1"
                  style={{ color: isApproved ? '#10B981' : '#EF4444' }}
                >
                  {isApproved ? 'Document approuvé' : 'Document rejeté'}
                </motion.p>

                {/* Filename */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-1.5 mb-1"
                >
                  <FileText size={12} className="text-textsecondary flex-shrink-0" />
                  <p className="text-sm font-medium text-white truncate">{notification.filename}</p>
                </motion.div>

                {/* Validator */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-xs text-textsecondary"
                >
                  Par {notification.validatorName}
                </motion.p>
              </div>

              {/* Close */}
              <motion.button
                whileHover={{ scale: 1.2, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.9 }}
                onClick={e => { e.stopPropagation(); onDismiss(); }}
                className="w-6 h-6 rounded-full flex items-center justify-center text-textsecondary flex-shrink-0 transition-colors"
              >
                <X size={12} />
              </motion.button>
            </div>
          </div>

          {/* Progress bar */}
          <motion.div
            className="h-0.5"
            style={{
              transformOrigin: 'left',
              scaleX: progress / 100,
              background: isApproved
                ? 'linear-gradient(90deg, #10B981, #06B6D4)'
                : 'linear-gradient(90deg, #EF4444, #F97316)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
