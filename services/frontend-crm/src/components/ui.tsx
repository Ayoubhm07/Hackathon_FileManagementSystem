import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

// ── StatusBadge ──────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  UPLOADED:   { label: 'Déposé',   color: 'text-textsecondary bg-slate-600/40 border-border' },
  PROCESSING: { label: 'En cours', color: 'text-primary bg-primary/10 border-primary/30' },
  PROCESSED:  { label: 'Traité',   color: 'text-success bg-success/10 border-success/30' },
  FAILED:     { label: 'Échec',    color: 'text-danger bg-danger/10 border-danger/30' },
  APPROVED:   { label: 'Approuvé', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
  REJECTED:   { label: 'Rejeté',   color: 'text-rose-400 bg-rose-500/15 border-rose-500/30' },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.UPLOADED;
  return (
    <motion.span
      layout
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}
    >
      {status === 'PROCESSING' && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary" style={{ animation: 'pulse-slow 2s ease-in-out infinite' }} />
      )}
      {status === 'PROCESSED' && (
        <motion.span
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="w-1.5 h-1.5 rounded-full bg-success"
        />
      )}
      {cfg.label}
    </motion.span>
  );
}

// ── DocTypeIcon ──────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { label: string; color: string; letter: string; glow: string }> = {
  FACTURE:           { label: 'Facture', color: 'bg-blue-500/20 text-blue-400',       letter: 'F', glow: 'rgba(59,130,246,0.3)' },
  DEVIS:             { label: 'Devis',   color: 'bg-purple/20 text-purple',           letter: 'D', glow: 'rgba(139,92,246,0.3)' },
  KBIS:              { label: 'KBIS',    color: 'bg-success/20 text-success',         letter: 'K', glow: 'rgba(16,185,129,0.3)' },
  URSSAF:            { label: 'URSSAF',  color: 'bg-warning/20 text-warning',         letter: 'U', glow: 'rgba(245,158,11,0.3)' },
  RIB:               { label: 'RIB',     color: 'bg-emerald-500/20 text-emerald-400', letter: 'R', glow: 'rgba(52,211,153,0.3)' },
  SIRET_ATTESTATION: { label: 'SIRET',   color: 'bg-cyan-500/20 text-cyan-400',       letter: 'S', glow: 'rgba(6,182,212,0.3)'  },
  UNKNOWN:           { label: 'Inconnu', color: 'bg-slate-600/40 text-textsecondary', letter: '?', glow: 'transparent' },
};

export function DocTypeIcon({ type, size = 'md' }: { type: string; size?: 'sm' | 'md' | 'lg' }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.UNKNOWN;
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-12 h-12 text-lg' : 'w-9 h-9 text-sm';
  return (
    <motion.div
      whileHover={{ scale: 1.1, boxShadow: `0 0 12px ${cfg.glow}` }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`${sizeClass} ${cfg.color} rounded-lg flex items-center justify-center font-bold flex-shrink-0`}
    >
      {cfg.letter}
    </motion.div>
  );
}

export function getDocTypeLabel(type: string): string {
  return TYPE_CONFIG[type]?.label ?? type;
}

// ── ConfidenceBar ────────────────────────────────────────────────────────────
export function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 90 ? 'bg-success' : pct >= 70 ? 'bg-warning' : 'bg-danger';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-600/40 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
      <span className="text-xs font-mono text-textsecondary w-8 text-right">{pct}%</span>
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`shimmer rounded-lg bg-slate-600/30 ${className}`} />;
}

// ── AnimatedCounter (spring easing) ─────────────────────────────────────────
export function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = React.useState(0);
  const hasRun = useRef(false);
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    const duration = 1400;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // ease out expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span>{display}{suffix}</span>;
}

// ── TiltCard — 3D mouse tilt ─────────────────────────────────────────────────
export function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 20 });
  const springY = useSpring(y, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-4, 4]);
  const glowOpacity = useSpring(0, { stiffness: 200, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
    glowOpacity.set(1);
  };
  const handleMouseLeave = () => {
    x.set(0); y.set(0); glowOpacity.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', transformPerspective: 800 }}
      className={`bg-card border border-border rounded-xl ${className}`}
    >
      {children}
      <motion.div
        style={{
          opacity: glowOpacity,
          background: 'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.06), transparent 60%)',
        }}
        className="absolute inset-0 rounded-xl pointer-events-none"
      />
    </motion.div>
  );
}

// ── RippleButton ─────────────────────────────────────────────────────────────
export function RippleButton({
  children, onClick, className = '', disabled = false, type = 'button',
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = ref.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `
      position:absolute;border-radius:50%;pointer-events:none;
      width:${size}px;height:${size}px;
      left:${e.clientX - rect.left - size / 2}px;
      top:${e.clientY - rect.top - size / 2}px;
      background:rgba(255,255,255,0.18);
      animation:ripple-expand 0.55s linear;
    `;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
    onClick?.(e);
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={handleClick}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
    </motion.button>
  );
}

// ── Card (standard + glass variant) ─────────────────────────────────────────
export function Card({ children, className = '', glass = false }: {
  children: React.ReactNode; className?: string; glass?: boolean;
}) {
  return (
    <div className={`${glass ? 'glass-strong' : 'bg-card border border-border'} rounded-xl ${className}`}>
      {children}
    </div>
  );
}

// ── PageHeader ────────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }: {
  title: string; subtitle?: string; actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-textprimary tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-textsecondary mt-1">{subtitle}</p>}
      </motion.div>
      {actions && (
        <motion.div
          initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center gap-3"
        >
          {actions}
        </motion.div>
      )}
    </div>
  );
}

// ── ComplianceGauge — animated SVG ring ──────────────────────────────────────
export function ComplianceGauge({ score, size = 120 }: { score: number; size?: number }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';
  const pct = Math.max(0, Math.min(100, score));

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} style={{ overflow: 'visible' }}>
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(55,65,81,0.6)" strokeWidth={size * 0.07} />
        {/* Progress */}
        <motion.circle
          cx={size/2} cy={size/2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.07}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
        />
        {/* Label */}
        <text x={size/2} y={size/2 + 2} textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize={size * 0.2} fontWeight="700" fontFamily="JetBrains Mono, monospace">
          {pct}%
        </text>
      </svg>
    </div>
  );
}

// ── PipelineStatus — animated horizontal stepper ─────────────────────────────
const STEPS = ['UPLOAD', 'OCR', 'CLASSIFY', 'EXTRACT', 'VALIDATE'];

export function PipelineStatus({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const done    = i < currentStep;
        const active  = i === currentStep;
        const pending = i > currentStep;
        return (
          <React.Fragment key={step}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 300 }}
              className="flex flex-col items-center gap-1"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all duration-500 ${
                done    ? 'bg-success/20 border-success text-success' :
                active  ? 'bg-primary/20 border-primary text-primary pipeline-node-active' :
                          'bg-slate-600/20 border-border text-textsecondary'
              }`}>
                {done ? (
                  <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </motion.svg>
                ) : active ? (
                  <span className="w-2 h-2 rounded-full bg-primary" style={{ animation: 'pulse-slow 1.5s ease-in-out infinite' }} />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span className={`text-[10px] font-medium tracking-wide ${active ? 'text-primary' : done ? 'text-success' : 'text-textsecondary'}`}>
                {step}
              </span>
            </motion.div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 mx-1 h-0.5 mb-4 bg-border overflow-hidden rounded-full">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: done ? '100%' : '0%' }}
                  transition={{ duration: 0.5, delay: i * 0.08 + 0.2 }}
                  className="h-full bg-success rounded-full"
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── EmptyState — CSS-animated SVG ────────────────────────────────────────────
export function EmptyState({ icon = '📄', title, subtitle }: {
  icon?: string; title: string; subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 gap-3"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-16 h-16 rounded-2xl bg-slate-600/20 flex items-center justify-center text-3xl"
      >
        {icon}
      </motion.div>
      <p className="text-sm font-medium text-textprimary">{title}</p>
      {subtitle && <p className="text-xs text-textsecondary text-center max-w-xs">{subtitle}</p>}
    </motion.div>
  );
}
