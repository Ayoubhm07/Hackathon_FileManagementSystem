import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, Eye, X } from 'lucide-react';
import { DocTypeIcon, Card, PageHeader } from '../components/ui';
import { mockAlerts } from '../data/mock-data';

const SEV_CONFIG = {
  CRITICAL: { color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/40', label: 'Critique', pulseBorder: true },
  WARNING:  { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30', label: 'Avertissement', pulseBorder: false },
  INFO:     { color: 'text-accent',  bg: 'bg-accent/10',  border: 'border-accent/30',  label: 'Information', pulseBorder: false },
};

export function AlertsPage() {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = mockAlerts.filter(a => {
    if (dismissed.has(a.id)) return false;
    if (filter !== 'ALL' && a.severity !== filter) return false;
    return true;
  });

  const critCount = visible.filter(a => a.severity === 'CRITICAL').length;

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Alertes" subtitle={`${visible.length} alerte(s) active(s)${critCount > 0 ? ` — ${critCount} critique(s)` : ''}`} />

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        {(['ALL','CRITICAL','WARNING','INFO'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              filter === f
                ? f === 'CRITICAL' ? 'bg-danger/20 text-danger border-danger/40'
                  : f === 'WARNING' ? 'bg-warning/20 text-warning border-warning/40'
                  : f === 'INFO' ? 'bg-accent/20 text-accent border-accent/40'
                  : 'bg-primary/20 text-primary border-primary/40'
                : 'text-textsecondary border-border hover:text-textprimary'
            }`}>
            {f === 'ALL' ? 'Toutes' : f === 'CRITICAL' ? 'Critiques' : f === 'WARNING' ? 'Avertissements' : 'Informations'}
          </button>
        ))}
      </div>

      {/* Alerts */}
      <div className="space-y-3">
        <AnimatePresence>
          {visible.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-16 gap-3">
              <div className="text-4xl">✅</div>
              <p className="text-textprimary font-medium">Aucune alerte active</p>
              <p className="text-xs text-textsecondary">Tous les documents sont conformes</p>
            </motion.div>
          )}
          {visible.map((alert, i) => {
            const cfg = SEV_CONFIG[alert.severity];
            return (
              <motion.div key={alert.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 100, height: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`${cfg.bg} border ${cfg.border} rounded-xl p-4 ${cfg.pulseBorder ? 'pulse-border-red' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    {alert.severity === 'INFO' ? <Info size={14} className={cfg.color} /> : <AlertTriangle size={14} className={cfg.color} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-xs text-textsecondary font-mono">{alert.rule}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <DocTypeIcon type={alert.documentType} size="sm" />
                      <p className="text-sm font-medium text-textprimary truncate">{alert.documentName}</p>
                    </div>
                    <p className="text-sm text-textsecondary">{alert.message}</p>
                    {alert.field && (
                      <span className="inline-block mt-1.5 px-2 py-0.5 bg-slate-600/30 rounded text-xs font-mono text-textsecondary">
                        champ: {alert.field}
                      </span>
                    )}
                    <p className="text-xs text-textsecondary mt-2">{new Date(alert.createdAt).toLocaleString('fr-FR')}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button className={`p-1.5 rounded ${cfg.bg} border ${cfg.border} ${cfg.color} hover:opacity-80 transition-opacity`}>
                      <Eye size={12} />
                    </button>
                    <button onClick={() => setDismissed(prev => new Set([...prev, alert.id]))}
                      className="p-1.5 rounded bg-slate-600/30 border border-border text-textsecondary hover:text-textprimary transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
