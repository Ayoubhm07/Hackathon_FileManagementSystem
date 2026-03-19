import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { ValidationRule } from '../data/mock-data';

// StatusBadge
const STATUS_CONFIG = {
  UPLOADED:   { label: 'Déposé',   color: 'text-textsecondary bg-slate-600/40 border-border' },
  PROCESSING: { label: 'En cours', color: 'text-accent bg-accent/10 border-accent/30' },
  PROCESSED:  { label: 'Traité',   color: 'text-success bg-success/10 border-success/30' },
  FAILED:     { label: 'Échec',    color: 'text-danger bg-danger/10 border-danger/30' },
  APPROVED:   { label: 'Approuvé', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
  REJECTED:   { label: 'Rejeté',   color: 'text-rose-400 bg-rose-500/15 border-rose-500/30' },
};
export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.UPLOADED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      {status === 'PROCESSING' && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-slow" />}
      {cfg.label}
    </span>
  );
}

// DocTypeIcon
const TYPE_CONFIG: Record<string, { color: string; letter: string }> = {
  FACTURE:           { color: 'bg-accent/20 text-accent-light',     letter: 'F' },
  DEVIS:             { color: 'bg-primary/20 text-primary-light',   letter: 'D' },
  KBIS:              { color: 'bg-success/20 text-success-light',   letter: 'K' },
  URSSAF:            { color: 'bg-warning/20 text-warning-light',   letter: 'U' },
  RIB:               { color: 'bg-emerald-500/20 text-emerald-400', letter: 'R' },
  SIRET_ATTESTATION: { color: 'bg-cyan-500/20 text-cyan-400',       letter: 'S' },
  UNKNOWN:           { color: 'bg-slate-600/40 text-textsecondary', letter: '?' },
};
export function DocTypeIcon({ type, size = 'md' }: { type: string; size?: 'sm'|'md'|'lg' }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.UNKNOWN!;
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-12 h-12 text-lg' : 'w-9 h-9 text-sm';
  return <div className={`${sz} ${cfg.color} rounded-lg flex items-center justify-center font-bold flex-shrink-0`}>{cfg.letter}</div>;
}
export function getDocTypeLabel(type: string): string {
  const map: Record<string,string> = { FACTURE:'Facture', DEVIS:'Devis', KBIS:'KBIS', URSSAF:'URSSAF', RIB:'RIB', SIRET_ATTESTATION:'SIRET', UNKNOWN:'Inconnu' };
  return map[type] ?? type;
}

// ComplianceScore badge
export function ComplianceScore({ score }: { score: number }) {
  const color = score >= 90 ? 'text-success border-success/30 bg-success/10' : score >= 70 ? 'text-warning border-warning/30 bg-warning/10' : 'text-danger border-danger/30 bg-danger/10';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${color}`}>{score}/100</span>;
}

// ComplianceGauge — animated SVG circular gauge
export function ComplianceGauge({ score }: { score: number }) {
  const r = 54; const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 90 ? '#10B981' : score >= 70 ? '#F59E0B' : '#EF4444';
  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <svg width="160" height="160" className="-rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#374151" strokeWidth="10" />
        <motion.circle cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold font-mono" style={{ color }}>{score}</span>
        <span className="text-xs text-textsecondary">/ 100</span>
      </div>
    </div>
  );
}

// RuleCheckItem
export function RuleCheckItem({ rule }: { rule: ValidationRule }) {
  return (
    <div className={`flex items-start gap-3 p-2.5 rounded-lg text-sm ${
      rule.status === 'pass' ? 'bg-success/5' : rule.status === 'fail' ? 'bg-danger/5' : 'bg-warning/5'
    }`}>
      {rule.status === 'pass'
        ? <CheckCircle size={15} className="text-success mt-0.5 flex-shrink-0" />
        : rule.status === 'fail'
        ? <XCircle size={15} className="text-danger mt-0.5 flex-shrink-0" />
        : <AlertTriangle size={15} className="text-warning mt-0.5 flex-shrink-0" />}
      <div>
        <p className={rule.status === 'pass' ? 'text-textprimary' : rule.status === 'fail' ? 'text-danger' : 'text-warning'}>{rule.label}</p>
        {rule.message && <p className="text-xs text-textsecondary mt-0.5">{rule.message}</p>}
      </div>
    </div>
  );
}

// Skeleton
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`shimmer rounded-lg bg-slate-600/30 ${className}`} />;
}

// Card
export function Card({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={`bg-card border border-border rounded-xl ${className}`} style={style}>{children}</div>;
}

// PageHeader
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-textprimary">{title}</h1>
        {subtitle && <p className="text-sm text-textsecondary mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

// AnimatedCounter
export function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    const steps = 60; let current = 0;
    const inc = value / steps;
    const timer = setInterval(() => {
      current += inc;
      if (current >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(current));
    }, 1200 / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display}{suffix}</span>;
}
