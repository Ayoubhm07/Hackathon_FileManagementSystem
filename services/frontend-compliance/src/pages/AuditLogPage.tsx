import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Download, Search, Activity, CheckCircle2, XCircle,
  Upload, Bell, FileBarChart, UserCog, Filter, Clock,
  TrendingUp, Users,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, PageHeader, DocTypeIcon, AnimatedCounter } from '../components/ui';
import { auditLog } from '../data/mock-data';
import type { Document, PaginatedDocuments } from '../types';
import api from '../api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuditEntry {
  id: string;
  user: string;
  action: string;
  documentName: string;
  documentId: string;
  timestamp: string;
  detail?: string;
  documentType?: string;
  source: 'live' | 'demo';
}

// ── Config ────────────────────────────────────────────────────────────────────

type IconType = React.ComponentType<{ size?: number; className?: string }>;

const ACTION_CONFIG: Record<string, { label: string; color: string; dot: string; icon: IconType }> = {
  VALIDATION_APPROVED: { label: 'Approuvé',      color: 'text-success bg-success/10 border-success/30',        dot: '#10B981', icon: CheckCircle2 as IconType },
  VALIDATION_REJECTED: { label: 'Rejeté',        color: 'text-danger bg-danger/10 border-danger/30',            dot: '#EF4444', icon: XCircle     as IconType },
  DOCUMENT_UPLOADED:   { label: 'Dépôt',         color: 'text-accent bg-accent/10 border-accent/30',            dot: '#06B6D4', icon: Upload       as IconType },
  ALERT_DISMISSED:     { label: 'Alerte ignorée',color: 'text-textsecondary bg-slate-600/20 border-border',     dot: '#6B7280', icon: Bell         as IconType },
  REPORT_GENERATED:    { label: 'Rapport généré',color: 'text-primary bg-primary/10 border-primary/30',         dot: '#6366F1', icon: FileBarChart as IconType },
  USER_ROLE_UPDATED:   { label: 'Rôle modifié',  color: 'text-warning bg-warning/10 border-warning/30',         dot: '#F59E0B', icon: UserCog      as IconType },
};

const ACTION_FILTERS = ['ALL', ...Object.keys(ACTION_CONFIG)] as const;
type ActionFilter = typeof ACTION_FILTERS[number];

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildTrendData(entries: AuditEntry[]) {
  const byDay: Record<string, { uploads: number; approvals: number; rejections: number }> = {};
  entries.forEach(e => {
    const day = e.timestamp.split('T')[0] ?? '';
    if (!byDay[day]) byDay[day] = { uploads: 0, approvals: 0, rejections: 0 };
    if (e.action === 'DOCUMENT_UPLOADED')   byDay[day]!.uploads++;
    if (e.action === 'VALIDATION_APPROVED') byDay[day]!.approvals++;
    if (e.action === 'VALIDATION_REJECTED') byDay[day]!.rejections++;
  });
  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-10)
    .map(([date, vals]) => ({
      date: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      ...vals,
    }));
}

function avatarColor(user: string): string {
  const colors = [
    'from-primary to-accent',
    'from-success to-accent',
    'from-warning to-danger',
    'from-purple-500 to-primary',
    'from-emerald-500 to-cyan-500',
  ];
  const idx = user.charCodeAt(0) % colors.length;
  return colors[idx] ?? colors[0]!;
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-textsecondary mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AuditLogPage() {
  const [search, setSearch]         = useState('');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('ALL');
  const [showTrend, setShowTrend]   = useState(true);

  // ── Fetch live documents ──────────────────────────────────────────────────
  const { data: liveDocuments = [], isLoading } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => (await api.get<PaginatedDocuments>('/documents')).data.data,
    refetchInterval: 30_000,
  });

  // ── Derive events from live documents ─────────────────────────────────────
  const liveEntries = useMemo<AuditEntry[]>(() => {
    const entries: AuditEntry[] = [];

    liveDocuments.forEach(doc => {
      // Upload event
      entries.push({
        id:           `live-upload-${doc._id}`,
        user:         doc.userId ?? 'operateur',
        action:       'DOCUMENT_UPLOADED',
        documentName: doc.originalName,
        documentId:   doc._id,
        timestamp:    doc.createdAt,
        detail:       `${doc.documentType} · ${(doc.fileSize / 1024).toFixed(0)} KB`,
        documentType: doc.documentType,
        source:       'live',
      });

      // Approval / rejection event
      if (doc.status === 'APPROVED') {
        entries.push({
          id:           `live-approved-${doc._id}`,
          user:         'validator',
          action:       'VALIDATION_APPROVED',
          documentName: doc.originalName,
          documentId:   doc._id,
          timestamp:    doc.createdAt,
          detail:       'Document approuvé via centre de validation',
          documentType: doc.documentType,
          source:       'live',
        });
      } else if (doc.status === 'REJECTED') {
        entries.push({
          id:           `live-rejected-${doc._id}`,
          user:         'validator',
          action:       'VALIDATION_REJECTED',
          documentName: doc.originalName,
          documentId:   doc._id,
          timestamp:    doc.createdAt,
          detail:       'Document rejeté via centre de validation',
          documentType: doc.documentType,
          source:       'live',
        });
      }
    });

    return entries;
  }, [liveDocuments]);

  // ── Merge live + mock ─────────────────────────────────────────────────────
  const allEntries = useMemo<AuditEntry[]>(() => {
    const liveDocIds = new Set(liveDocuments.map(d => d._id));

    const mockEntries: AuditEntry[] = auditLog
      .filter(e => !liveDocIds.has(e.documentId) || e.documentId === '')
      .map(e => ({
        id:           e.id,
        user:         e.user,
        action:       e.action,
        documentName: e.documentName,
        documentId:   e.documentId,
        timestamp:    e.timestamp,
        detail:       e.detail,
        documentType: undefined,
        source:       'demo' as const,
      }));

    return [...liveEntries, ...mockEntries]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [liveEntries, liveDocuments]);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    allEntries.filter(e => {
      const matchAction = actionFilter === 'ALL' || e.action === actionFilter;
      const matchSearch = !search ||
        e.user.toLowerCase().includes(search.toLowerCase()) ||
        e.documentName.toLowerCase().includes(search.toLowerCase()) ||
        (ACTION_CONFIG[e.action]?.label ?? '').toLowerCase().includes(search.toLowerCase());
      return matchAction && matchSearch;
    }),
  [allEntries, actionFilter, search]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     allEntries.length,
    uploaded:  allEntries.filter(e => e.action === 'DOCUMENT_UPLOADED').length,
    approved:  allEntries.filter(e => e.action === 'VALIDATION_APPROVED').length,
    rejected:  allEntries.filter(e => e.action === 'VALIDATION_REJECTED').length,
    users:     new Set(allEntries.map(e => e.user)).size,
    liveCount: liveEntries.length,
  }), [allEntries, liveEntries]);

  const trendData = useMemo(() => buildTrendData(allEntries), [allEntries]);

  // ── Export CSV ────────────────────────────────────────────────────────────
  const handleExportCSV = useCallback(() => {
    const header = ['Date', 'Heure', 'Utilisateur', 'Action', 'Document', 'Détail', 'Source'];
    const rows = filtered.map(e => {
      const d = new Date(e.timestamp);
      return [
        d.toLocaleDateString('fr-FR'),
        d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        e.user,
        ACTION_CONFIG[e.action]?.label ?? e.action,
        e.documentName,
        e.detail ?? '',
        e.source,
      ];
    });
    const csv = [header, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-5" style={{
      background: 'radial-gradient(ellipse at 0% 100%, rgba(16,185,129,0.05) 0%, transparent 55%)',
    }}>
      <PageHeader
        title="Journal d'audit"
        subtitle={`${filtered.length} entrées · ${stats.liveCount} événements live · ${stats.users} utilisateurs`}
        actions={
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-xs text-textsecondary hover:text-textprimary hover:border-primary/40 transition-colors"
          >
            <Download size={12} /> Exporter CSV
          </button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total événements', value: stats.total,    icon: Activity,     color: 'text-primary', bg: 'bg-primary/10',  border: 'border-primary/20',  glow: '#6366F1' },
          { label: 'Dépôts',           value: stats.uploaded, icon: Upload,       color: 'text-accent',  bg: 'bg-accent/10',   border: 'border-accent/20',   glow: '#06B6D4' },
          { label: 'Approbations',     value: stats.approved, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10',  border: 'border-success/20',  glow: '#10B981' },
          { label: 'Rejets',           value: stats.rejected, icon: XCircle,      color: 'text-danger',  bg: 'bg-danger/10',   border: 'border-danger/20',   glow: '#EF4444' },
          { label: 'Utilisateurs',     value: stats.users,    icon: Users,        color: 'text-warning', bg: 'bg-warning/10',  border: 'border-warning/20',  glow: '#F59E0B' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Card className={`p-4 border ${stat.border}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-textsecondary leading-tight">{stat.label}</p>
                <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                  <stat.icon size={13} className={stat.color} />
                </div>
              </div>
              <p className={`text-2xl font-bold font-mono ${stat.color}`}>
                <AnimatedCounter value={stat.value} />
              </p>
              <div className="mt-2 h-0.5 bg-slate-600/25 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((stat.value / Math.max(stats.total, 1)) * 100, 100)}%` }}
                  transition={{ duration: 1.3, delay: i * 0.1 + 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{ background: stat.glow }}
                />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Trend chart */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-textprimary flex items-center gap-2">
            <TrendingUp size={14} className="text-primary" />
            Activité — 10 derniers jours
          </h3>
          <button
            onClick={() => setShowTrend(v => !v)}
            className="text-xs text-textsecondary hover:text-textprimary transition-colors flex items-center gap-1"
          >
            <Clock size={12} />
            {showTrend ? 'Masquer' : 'Afficher'}
          </button>
        </div>
        <AnimatePresence>
          {showTrend && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 180, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden"
            >
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="gUploads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#06B6D4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gApprovals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gRejections" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(55,65,81,0.35)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="uploads"    name="Dépôts"        stroke="#06B6D4" fill="url(#gUploads)"    strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="approvals"  name="Approbations"  stroke="#10B981" fill="url(#gApprovals)"  strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="rejections" name="Rejets"         stroke="#EF4444" fill="url(#gRejections)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-textsecondary pointer-events-none" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher utilisateur, action, document…"
              className="w-full pl-9 pr-4 py-2 bg-navy/60 border border-border rounded-lg text-sm text-textprimary placeholder-textsecondary focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={12} className="text-textsecondary mr-1" />
            {ACTION_FILTERS.map(f => {
              const cfg = f !== 'ALL' ? ACTION_CONFIG[f] : null;
              return (
                <button
                  key={f}
                  onClick={() => setActionFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    actionFilter === f
                      ? 'bg-primary/20 border-primary/50 text-primary'
                      : 'bg-card border-border text-textsecondary hover:border-primary/30 hover:text-textprimary'
                  }`}
                >
                  {f === 'ALL' ? 'Tous' : (cfg?.label ?? f)}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <Card>
        {/* Header */}
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <p className="text-xs font-semibold text-textsecondary uppercase tracking-wide">
            Événements ({filtered.length})
          </p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-accent">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Live
            </span>
            <span className="flex items-center gap-1.5 text-xs text-textsecondary">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              Démo
            </span>
          </div>
        </div>

        {/* Entries */}
        <div className="divide-y divide-border">
          {isLoading && (
            <div className="px-5 py-6 flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-textsecondary">Chargement des événements live…</span>
            </div>
          )}

          <AnimatePresence>
            {filtered.map((entry, i) => {
              const cfg     = ACTION_CONFIG[entry.action] ?? { label: entry.action, color: 'text-textsecondary bg-slate-600/20 border-border', dot: '#6B7280', icon: Activity as IconType };
              const Icon    = cfg.icon;
              const initials = entry.user.split('.').map((p: string) => p[0]?.toUpperCase() ?? '').join('').slice(0, 2) || '?';
              const gradientClass = avatarColor(entry.user);

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ delay: Math.min(i * 0.018, 0.4) }}
                  className="flex items-start gap-4 px-5 py-3.5 hover:bg-white/2 transition-colors group"
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center flex-shrink-0 mt-1">
                    <div
                      className="w-2.5 h-2.5 rounded-full border-2 border-card flex-shrink-0"
                      style={{ background: cfg.dot, boxShadow: `0 0 6px ${cfg.dot}60` }}
                    />
                    {i < filtered.length - 1 && (
                      <div className="w-px flex-1 bg-border mt-1" style={{ minHeight: 24 }} />
                    )}
                  </div>

                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {initials}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-textprimary">{entry.user}</span>

                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${cfg.color}`}>
                        <Icon size={10} />
                        {cfg.label}
                      </span>

                      {entry.documentName && entry.documentName !== '—' && (
                        <div className="flex items-center gap-1.5 min-w-0">
                          {entry.documentType && <DocTypeIcon type={entry.documentType} size="sm" />}
                          <span className="text-xs text-textsecondary truncate max-w-[240px]">
                            {entry.documentName}
                          </span>
                        </div>
                      )}

                      {entry.source === 'live' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-semibold">
                          LIVE
                        </span>
                      )}
                    </div>

                    {entry.detail && (
                      <p className="text-xs text-textsecondary mt-0.5">{entry.detail}</p>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-mono text-textsecondary">
                      {new Date(entry.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {new Date(entry.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!isLoading && filtered.length === 0 && (
            <div className="py-14 text-center">
              <Activity size={30} className="mx-auto text-textsecondary mb-3 opacity-40" />
              <p className="text-textsecondary text-sm">Aucune entrée trouvée</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
