import React, { Suspense, lazy, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, CheckCircle, Clock, AlertTriangle, ArrowUpRight, Zap } from 'lucide-react';
import { AnimatedCounter, StatusBadge, DocTypeIcon, Card, PageHeader, PipelineStatus, TiltCard, EmptyState } from '../components/ui';
import { mockAlerts, dailyStats } from '../data/mock-data';
import type { Document } from '../types';
import api from '../api';

// Lazy-load the 3D scene to avoid blocking
const Pipeline3D = lazy(() => import('../components/Pipeline3D'));

const STAGGER = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const ITEM    = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } };

// Custom tooltip for recharts
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-textsecondary mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [show3D, setShow3D] = useState(true);

  const { data: docs = [] } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => (await api.get<{ data: Document[] }>('/documents')).data.data,
    refetchInterval: 30_000,
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const today     = docs.filter(d => d.createdAt.startsWith(todayStr));
  const processed = docs.filter(d => d.status === 'PROCESSED');
  const processing = docs.filter(d => d.status === 'PROCESSING' || d.status === 'UPLOADED');
  const failed    = docs.filter(d => d.status === 'FAILED');
  const total     = docs.length;
  const conformance = total > 0 ? Math.round((processed.length / Math.max(processed.length + failed.length, 1)) * 100) : 0;
  const activeAlerts = mockAlerts.filter(a => !a.dismissed && a.severity !== 'INFO').length;

  const kpis = [
    { label: "Traités aujourd'hui", value: today.filter(d => d.status === 'PROCESSED').length, suffix: '', icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', glow: '#10B981', trend: '+2 vs hier' },
    { label: 'Taux de conformité',  value: conformance, suffix: '%', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', glow: '#3B82F6', trend: '+3% ce mois' },
    { label: 'En traitement',       value: processing.length, suffix: '', icon: Clock, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', glow: '#F59E0B', trend: `${processing.length} actif(s)` },
    { label: 'Alertes actives',     value: activeAlerts, suffix: '', icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20', glow: '#EF4444', trend: 'Vérif. requise' },
  ];

  const recentDocs = [...docs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <div className="p-6 space-y-5 mesh-gradient min-h-full">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div className="relative">
        <PageHeader
          title="Tableau de bord"
          subtitle="Vue d'ensemble de l'activité DocFlow"
          actions={
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setShow3D(v => !v)}
                className="px-3 py-2 text-xs text-textsecondary border border-border rounded-lg hover:text-textprimary hover:bg-white/5 transition-colors"
              >
                {show3D ? 'Masquer 3D' : 'Afficher 3D'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(59,130,246,0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/upload')}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors relative overflow-hidden"
              >
                <ArrowUpRight size={14} />
                Nouveau dépôt
              </motion.button>
            </div>
          }
        />
      </div>

      {/* ── 3D Pipeline Scene ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {show3D && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 240 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <Card className="h-60 relative overflow-hidden border-border/50 bg-navy/80">
              <div className="absolute inset-0">
                <Suspense fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-xs text-textsecondary">Chargement scène 3D…</div>
                  </div>
                }>
                  <Pipeline3D />
                </Suspense>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-navy/90 to-transparent">
                <p className="text-xs text-textsecondary font-medium">
                  Pipeline de traitement DocFlow — {total} document(s) dans le système
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <motion.div
        variants={STAGGER} initial="hidden" animate="visible"
        className="grid grid-cols-4 gap-4"
      >
        {kpis.map((kpi) => (
          <motion.div key={kpi.label} variants={ITEM}>
            <TiltCard className={`p-5 border ${kpi.border}`}>
              <div className="flex items-start justify-between mb-3">
                <motion.div
                  whileHover={{ scale: 1.1, boxShadow: `0 0 14px ${kpi.glow}40` }}
                  className={`w-9 h-9 ${kpi.bg} rounded-lg flex items-center justify-center`}
                >
                  <kpi.icon size={16} className={kpi.color} />
                </motion.div>
                <span className="text-[10px] text-textsecondary bg-slate-600/30 px-2 py-0.5 rounded-full">{kpi.trend}</span>
              </div>
              <p className="text-3xl font-bold text-textprimary font-mono tracking-tight">
                <AnimatedCounter value={kpi.value} suffix={kpi.suffix} />
              </p>
              <p className="text-xs text-textsecondary mt-1">{kpi.label}</p>
              {/* mini spark line */}
              <div className="mt-3 h-0.5 bg-slate-600/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(kpi.value * 5 + 20, 100)}%` }}
                  transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-full rounded-full ${kpi.bg.replace('/10', '')}`}
                  style={{ background: kpi.glow }}
                />
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Chart + Alerts ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2 p-5">
          <h3 className="text-sm font-semibold text-textprimary mb-4 flex items-center gap-2">
            <Zap size={14} className="text-primary" />
            Documents traités — 7 derniers jours
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={dailyStats}>
              <defs>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(55,65,81,0.4)" />
              <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="processed" stroke="#3B82F6" fill="url(#gP)" strokeWidth={2} name="Traités"
                dot={false} activeDot={{ r: 4, fill: '#3B82F6', stroke: '#1E3A8A', strokeWidth: 2 }} />
              <Area type="monotone" dataKey="failed" stroke="#EF4444" fill="url(#gF)" strokeWidth={2} name="Échecs"
                dot={false} activeDot={{ r: 4, fill: '#EF4444', stroke: '#7F1D1D', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-textprimary mb-4 flex items-center gap-2">
            <AlertTriangle size={14} className="text-warning" />
            Alertes récentes
          </h3>
          <div className="space-y-2">
            {mockAlerts.slice(0, 4).map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`p-2.5 rounded-lg border text-xs cursor-default hover:brightness-110 transition-all ${
                  alert.severity === 'CRITICAL' ? 'border-danger/30 bg-danger/5' :
                  alert.severity === 'WARNING'  ? 'border-warning/30 bg-warning/5' :
                                                  'border-border bg-slate-600/20'
                }`}
              >
                <p className="font-medium text-textprimary truncate">{alert.documentName}</p>
                <p className="text-textsecondary mt-0.5 truncate">{alert.message}</p>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Recent documents ───────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-textprimary">Documents récents</h3>
          <motion.button
            whileHover={{ x: 2 }}
            onClick={() => navigate('/documents')}
            className="text-xs text-primary hover:text-primary-hover transition-colors"
          >
            Voir tout →
          </motion.button>
        </div>
        {recentDocs.length === 0 ? (
          <EmptyState icon="📄" title="Aucun document" subtitle="Déposez votre premier document pour commencer" />
        ) : (
          <div className="divide-y divide-border">
            {recentDocs.map((doc, i) => (
              <motion.div
                key={doc._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)', x: 2 }}
                onClick={() => navigate(`/documents/${doc._id}`)}
                className="flex items-center gap-4 px-5 py-3 cursor-pointer transition-colors group"
              >
                <DocTypeIcon type={doc.documentType} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-textprimary truncate group-hover:text-primary transition-colors">{doc.originalName}</p>
                  <p className="text-xs text-textsecondary">
                    {new Date(doc.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <StatusBadge status={doc.status} />
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
