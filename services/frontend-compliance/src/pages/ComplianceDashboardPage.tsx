import React, { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AlertTriangle, Shield, TrendingUp, FileCheck } from 'lucide-react';
import { ComplianceGauge, AnimatedCounter, Card, PageHeader } from '../components/ui';
import { mockAlerts, trendData } from '../data/mock-data';
import type { Document, PaginatedDocuments } from '../types';
import api from '../api';

const ComplianceOrb = lazy(() => import('../components/ComplianceOrb'));

const STAGGER = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const ITEM    = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } };

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

export function ComplianceDashboardPage() {
  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => (await api.get<PaginatedDocuments>('/documents')).data.data,
    refetchInterval: 15_000,
  });

  const processed = documents.filter(d => d.status === 'PROCESSED');
  const failed    = documents.filter(d => d.status === 'FAILED');
  const processing = documents.filter(d => d.status === 'PROCESSING' || d.status === 'UPLOADED');
  const total     = documents.length;

  const globalScore = total > 0
    ? Math.round((processed.length / Math.max(processed.length + failed.length, 1)) * 100)
    : 0;

  const critical = mockAlerts.filter(a => a.severity === 'CRITICAL' && !a.dismissed).length;
  const warnings = mockAlerts.filter(a => a.severity === 'WARNING'  && !a.dismissed).length;
  const infos    = mockAlerts.filter(a => a.severity === 'INFO'     && !a.dismissed).length;

  const scoreColor = globalScore >= 80 ? '#10B981' : globalScore >= 60 ? '#F59E0B' : '#EF4444';
  const scoreLabel = globalScore >= 80 ? 'Conforme' : globalScore >= 60 ? 'À surveiller' : 'Non conforme';

  return (
    <div className="p-6 space-y-5 min-h-full" style={{
      background: 'radial-gradient(ellipse at 0% 0%, rgba(139,92,246,0.08) 0%, transparent 50%), radial-gradient(ellipse at 100% 100%, rgba(16,185,129,0.06) 0%, transparent 50%)'
    }}>
      <PageHeader
        title="Tableau de bord Compliance"
        subtitle="Surveillance de la conformité documentaire en temps réel"
      />

      {/* ── Hero: 3D Orb + Global Score ──────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">

        {/* 3D Compliance Orb */}
        <Card className="col-span-1 relative overflow-hidden" style={{ height: 260 }}>
          <div className="absolute inset-0">
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-xs text-textsecondary">Chargement…</div>
              </div>
            }>
              <ComplianceOrb score={globalScore} />
            </Suspense>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-5 pointer-events-none">
            <p className="text-xs font-semibold text-textsecondary uppercase tracking-wider mb-1">Score global</p>
            <p className="text-4xl font-bold font-mono" style={{ color: scoreColor }}>
              <AnimatedCounter value={globalScore} suffix="%" />
            </p>
            <span className="mt-1 text-xs px-2.5 py-0.5 rounded-full font-medium"
              style={{ color: scoreColor, background: `${scoreColor}18`, border: `1px solid ${scoreColor}30` }}>
              {scoreLabel}
            </span>
          </div>
        </Card>

        {/* KPI grid */}
        <motion.div
          variants={STAGGER} initial="hidden" animate="visible"
          className="col-span-2 grid grid-cols-2 gap-4"
        >
          {[
            { label: 'Documents traités',  value: processed.length,  icon: FileCheck,    color: 'text-success', bg: 'bg-success/10',  border: 'border-success/20',  glow: '#10B981' },
            { label: 'En cours',           value: processing.length, icon: TrendingUp,   color: 'text-primary', bg: 'bg-primary/10',  border: 'border-primary/20',  glow: '#3B82F6' },
            { label: 'Alertes critiques',  value: critical,          icon: AlertTriangle,color: 'text-danger',  bg: 'bg-danger/10',   border: 'border-danger/20',   glow: '#EF4444' },
            { label: 'Conformes validés',  value: processed.length,  icon: Shield,       color: 'text-purple',  bg: 'bg-purple/10',   border: 'border-purple/20',   glow: '#8B5CF6' },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} variants={ITEM}>
              <Card className={`p-4 border ${kpi.border} h-full`}>
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-8 h-8 ${kpi.bg} rounded-lg flex items-center justify-center`}>
                    <kpi.icon size={15} className={kpi.color} />
                  </div>
                  {kpi.label === 'Alertes critiques' && critical > 0 && (
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-2 h-2 bg-danger rounded-full mt-1"
                    />
                  )}
                </div>
                <p className="text-2xl font-bold font-mono text-textprimary">
                  <AnimatedCounter value={kpi.value} />
                </p>
                <p className="text-xs text-textsecondary mt-0.5">{kpi.label}</p>
                <div className="mt-2 h-0.5 bg-slate-600/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((kpi.value / Math.max(total, 1)) * 100, 100)}%` }}
                    transition={{ duration: 1.2, delay: i * 0.1 + 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                    style={{ background: kpi.glow }}
                  />
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Alert severity row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Critiques',       value: critical, color: '#EF4444', desc: 'Action immédiate requise' },
          { label: 'Avertissements',  value: warnings, color: '#F59E0B', desc: 'Surveillance recommandée' },
          { label: 'Informations',    value: infos,    color: '#3B82F6', desc: 'Aucune action requise' },
        ].map(({ label, value, color, desc }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 + 0.2 }}
          >
            <Card className="p-4" style={{ borderColor: `${color}25` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                  <span className="text-xs font-semibold text-textprimary">{label}</span>
                </div>
                {label === 'Critiques' && value > 0 && (
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}
                  >
                    ACTIF
                  </motion.div>
                )}
              </div>
              <p className="text-3xl font-bold font-mono" style={{ color }}>
                <AnimatedCounter value={value} />
              </p>
              <p className="text-xs text-textsecondary mt-1">{desc}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Trend chart ──────────────────────────────────────────────────── */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-textprimary mb-4 flex items-center gap-2">
          <TrendingUp size={14} className="text-purple" />
          Tendance conformité — 30 derniers jours
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="gScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.35}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(55,65,81,0.4)" />
            <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis domain={[60, 100]} tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone" dataKey="score" stroke="#8B5CF6" fill="url(#gScore)"
              strokeWidth={2.5} name="Score"
              dot={false} activeDot={{ r: 4, fill: '#8B5CF6', stroke: '#4C1D95', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
