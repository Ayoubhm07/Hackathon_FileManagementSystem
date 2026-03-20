import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '../types';

interface Props {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'à l\'instant';
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

export function NotificationPanel({ notifications, unreadCount, onMarkAsRead, onMarkAllAsRead, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="absolute right-0 top-full mt-2 w-96 z-50 rounded-2xl overflow-hidden shadow-2xl"
      style={{
        background: 'linear-gradient(145deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.98) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
            <Bell size={15} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Notifications</p>
            {unreadCount > 0 && (
              <p className="text-xs text-textsecondary">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1.5 text-xs text-primary/80 hover:text-primary transition-colors px-2.5 py-1.5 rounded-lg hover:bg-primary/10"
          >
            <CheckCheck size={13} />
            Tout lire
          </motion.button>
        )}
      </div>

      {/* Notification list */}
      <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
        <AnimatePresence>
          {notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 gap-3"
            >
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
                <Bell size={22} className="text-textsecondary" />
              </div>
              <p className="text-sm text-textsecondary">Aucune notification</p>
            </motion.div>
          ) : (
            notifications.map((notif, i) => (
              <motion.div
                key={notif._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => {
                  onMarkAsRead(notif._id);
                  onClose();
                  navigate(`/documents/${notif.documentId}`);
                }}
                className={`relative flex items-start gap-4 px-5 py-4 cursor-pointer transition-all group ${
                  !notif.read ? 'bg-white/[0.03]' : ''
                } hover:bg-white/[0.05]`}
                style={{
                  borderLeft: !notif.read
                    ? `2px solid ${notif.decision === 'APPROVED' ? '#10B981' : '#EF4444'}`
                    : '2px solid transparent',
                }}
              >
                {/* Icon */}
                <div
                  className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: notif.decision === 'APPROVED'
                      ? 'rgba(16,185,129,0.12)'
                      : 'rgba(239,68,68,0.12)',
                  }}
                >
                  {notif.decision === 'APPROVED'
                    ? <CheckCircle size={18} className="text-emerald-400" />
                    : <XCircle size={18} className="text-red-400" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-xs font-semibold tracking-wide"
                      style={{ color: notif.decision === 'APPROVED' ? '#10B981' : '#EF4444' }}
                    >
                      {notif.decision === 'APPROVED' ? '✓ APPROUVÉ' : '✗ REJETÉ'}
                    </span>
                    {!notif.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-white font-medium truncate">{notif.filename}</p>
                  <p className="text-xs text-textsecondary mt-0.5">
                    Par {notif.validatorName} · {timeAgo(notif.createdAt)}
                  </p>
                </div>

                {/* Hover arrow */}
                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  whileHover={{ opacity: 1, x: 0 }}
                  className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink size={13} className="text-textsecondary" />
                </motion.div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-5 py-3 border-t border-white/5">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => { onClose(); navigate('/notifications'); }}
            className="w-full text-xs text-center text-primary/70 hover:text-primary transition-colors py-1.5 rounded-lg hover:bg-primary/5"
          >
            Voir toutes les notifications →
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
