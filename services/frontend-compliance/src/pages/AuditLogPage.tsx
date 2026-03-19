import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { Card, PageHeader } from '../components/ui';
import { auditLog } from '../data/mock-data';

const ACTION_CONFIG: Record<string, { label: string; color: string }> = {
  VALIDATION_APPROVED: { label: 'Approuvé',           color: 'text-success bg-success/10 border-success/30' },
  VALIDATION_REJECTED: { label: 'Rejeté',             color: 'text-danger bg-danger/10 border-danger/30' },
  DOCUMENT_UPLOADED:   { label: 'Dépôt',              color: 'text-accent bg-accent/10 border-accent/30' },
  ALERT_DISMISSED:     { label: 'Alerte ignorée',     color: 'text-textsecondary bg-slate-600/20 border-border' },
  REPORT_GENERATED:    { label: 'Rapport généré',     color: 'text-primary bg-primary/10 border-primary/30' },
  USER_ROLE_UPDATED:   { label: 'Rôle modifié',       color: 'text-warning bg-warning/10 border-warning/30' },
};

export function AuditLogPage() {
  const [filter, setFilter] = useState('');

  const filtered = auditLog.filter(e =>
    !filter || e.user.includes(filter) || e.action.includes(filter) || e.documentName.includes(filter)
  );

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Journal d'audit"
        subtitle={`${filtered.length} entrées`}
        actions={
          <button className="flex items-center gap-2 px-3 py-2 bg-slate border border-border rounded-lg text-xs text-textsecondary hover:text-textprimary transition-colors">
            <Download size={12} /> Exporter CSV
          </button>
        }
      />

      <Card className="p-4">
        <input value={filter} onChange={e => setFilter(e.target.value)}
          placeholder="Filtrer par utilisateur, action, document..."
          className="w-full px-3 py-2 bg-navy/60 border border-border rounded-lg text-sm text-textprimary placeholder-textsecondary focus:outline-none focus:border-primary/50"
        />
      </Card>

      <Card className="divide-y divide-border">
        {filtered.map((entry, i) => {
          const cfg = ACTION_CONFIG[entry.action] ?? { label: entry.action, color: 'text-textsecondary bg-slate-600/20 border-border' };
          const initials = entry.user.split('.').map((p: string) => p[0]?.toUpperCase() ?? '').join('');
          return (
            <motion.div key={entry.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="flex items-start gap-4 px-5 py-4 hover:bg-white/3 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-textprimary">{entry.user}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cfg.color}`}>{cfg.label}</span>
                  {entry.documentName !== '—' && (
                    <span className="text-xs text-textsecondary truncate max-w-[200px]">{entry.documentName}</span>
                  )}
                </div>
                {entry.detail && <p className="text-xs text-textsecondary mt-0.5">{entry.detail}</p>}
              </div>
              <span className="text-xs text-textsecondary whitespace-nowrap flex-shrink-0">
                {new Date(entry.timestamp).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
              </span>
            </motion.div>
          );
        })}
      </Card>
    </div>
  );
}
