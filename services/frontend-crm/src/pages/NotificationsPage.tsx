import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Bell, CheckCheck, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { PageHeader, AnimatedCounter } from '../components/ui';

type FilterType = 'ALL' | 'APPROVED' | 'REJECTED' | 'UNREAD';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'à l\'instant';
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'ALL', label: 'Toutes' },
  { key: 'UNREAD', label: 'Non lues' },
  { key: 'APPROVED', label: 'Approuvées' },
  { key: 'REJECTED', label: 'Rejetées' },
];

export function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState<FilterType>('ALL');
  const navigate = useNavigate();

  const filtered = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.read;
    if (filter === 'APPROVED') return n.decision === 'APPROVED';
    if (filter === 'REJECTED') return n.decision === 'REJECTED';
    return true;
  });

  const approvedCount = notifications.filter(n => n.decision === 'APPROVED').length;
  const rejectedCount = notifications.filter(n => n.decision === 'REJECTED').length;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Notifications"
          subtitle="Historique des décisions de validation"
        />
        {unreadCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={markAllAsRead}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 px-4 py-2 rounded-xl border border-primary/20 hover:bg-primary/5 transition-colors"
          >
            <CheckCheck size={14} />
            Tout marquer comme lu
          </motion.button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Total', value: notifications.length,
            color: 'from-primary/20 to-purple/20', border: 'border-primary/20', text: 'text-primary',
          },
          {
            label: 'Approuvés', value: approvedCount,
            color: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400',
          },
          {
            label: 'Rejetés', value: rejectedCount,
            color: 'from-red-500/10 to-red-500/5', border: 'border-red-500/20', text: 'text-red-400',
          },
        ].map(({ label, value, color, border, text }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-gradient-to-br ${color} border ${border} rounded-2xl p-5`}
          >
            <p className="text-xs text-textsecondary mb-2">{label}</p>
            <p className={`text-3xl font-bold ${text}`}>
              <AnimatedCounter value={value} />
            </p>
          </motion.div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate/50 rounded-xl border border-border w-fit">
        <Filter size={14} className="text-textsecondary ml-2 mr-1" />
        {FILTERS.map(f => (
          <motion.button
            key={f.key}
            whileTap={{ scale: 0.96 }}
            onClick={() => setFilter(f.key)}
            className={`relative px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key ? 'text-white' : 'text-textsecondary hover:text-textprimary'
            }`}
          >
            {filter === f.key && (
              <motion.div
                layoutId="filter-bg"
                className="absolute inset-0 rounded-lg bg-primary/20 border border-primary/30"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{f.label}</span>
            {f.key === 'UNREAD' && unreadCount > 0 && (
              <span className="relative z-10 ml-1.5 text-xs bg-danger text-white rounded-full px-1.5 py-0.5">
                {unreadCount}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate/50 border border-border flex items-center justify-center">
                <Bell size={24} className="text-textsecondary" />
              </div>
              <p className="text-textprimary font-medium">Aucune notification</p>
              <p className="text-sm text-textsecondary">Vous serez notifié quand un validateur statue sur vos documents</p>
            </motion.div>
          ) : (
            filtered.map((notif, i) => {
              const isApproved = notif.decision === 'APPROVED';
              return (
                <motion.div
                  key={notif._id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => {
                    markAsRead(notif._id);
                    navigate(`/documents/${notif.documentId}`);
                  }}
                  className="group relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all"
                  style={{
                    background: notif.read
                      ? 'rgba(255,255,255,0.02)'
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${!notif.read
                      ? isApproved ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'
                      : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: !notif.read
                      ? `0 0 20px ${isApproved ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)'}`
                      : 'none',
                  }}
                  whileHover={{
                    scale: 1.005,
                    borderColor: isApproved ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)',
                  }}
                >
                  {/* Unread indicator */}
                  {!notif.read && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                      style={{ background: isApproved ? '#10B981' : '#EF4444' }}
                    />
                  )}

                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isApproved ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    }}
                  >
                    {isApproved
                      ? <CheckCircle size={22} className="text-emerald-400" />
                      : <XCircle size={22} className="text-red-400" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: isApproved ? '#10B981' : '#EF4444' }}
                      >
                        {isApproved ? 'Approuvé' : 'Rejeté'}
                      </span>
                      {!notif.read && (
                        <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-textprimary truncate">{notif.filename}</p>
                    <p className="text-xs text-textsecondary mt-0.5">
                      Par <span className="text-textprimary/70">{notif.validatorName}</span>
                    </p>
                  </div>

                  {/* Timestamp */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-textsecondary">{timeAgo(notif.createdAt)}</p>
                    <p className="text-xs text-textsecondary/50 mt-1">
                      {new Date(notif.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
