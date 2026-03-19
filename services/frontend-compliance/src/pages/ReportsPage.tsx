import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileBarChart, Download, Calendar, Building2, FileText } from 'lucide-react';
import { Card, PageHeader, ComplianceScore } from '../components/ui';
import { mockDocuments, mockValidations } from '../data/mock-data';

const TEMPLATES = [
  { id: 'monthly', label: 'Rapport mensuel', icon: Calendar, desc: 'Synthèse de conformité — Mars 2026' },
  { id: 'supplier', label: 'Par fournisseur', icon: Building2, desc: 'Conformité groupée par fournisseur' },
  { id: 'doctype', label: 'Par type de document', icon: FileText, desc: 'Analyse par catégorie documentaire' },
];

export function ReportsPage() {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  function handleGenerate() {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 1500);
  }

  const rows = mockValidations.map(v => {
    const doc = mockDocuments.find(d => d._id === v.documentId);
    return { doc, v };
  }).filter(r => r.doc != null);

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Rapports" subtitle="Génération et export des rapports de conformité" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {TEMPLATES.map(t => (
          <Card key={t.id} className="p-4 cursor-pointer hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                <t.icon size={15} className="text-primary" />
              </div>
              <p className="font-medium text-textprimary text-sm">{t.label}</p>
            </div>
            <p className="text-xs text-textsecondary">{t.desc}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-textprimary">Aperçu — Rapport Mars 2026</h3>
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
            >
              <FileBarChart size={14} />
              {generating ? 'Génération...' : 'Générer'}
            </motion.button>
            {generated && (
              <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 bg-success/20 hover:bg-success/30 text-success border border-success/30 rounded-lg text-sm font-medium transition-colors">
                <Download size={14} /> Exporter PDF
              </motion.button>
            )}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Document', 'Type', 'Score', 'Statut', 'Validé le'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-textsecondary uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(({ doc, v }) => (
              <tr key={v.documentId} className="hover:bg-white/3 transition-colors">
                <td className="px-3 py-2.5 text-textprimary truncate max-w-[200px]">{doc!.originalName}</td>
                <td className="px-3 py-2.5 text-textsecondary">{doc!.documentType}</td>
                <td className="px-3 py-2.5"><ComplianceScore score={v.score} /></td>
                <td className="px-3 py-2.5">
                  <span className={`text-xs font-semibold ${v.isValid ? 'text-success' : 'text-danger'}`}>
                    {v.isValid ? '✓ Valide' : '✗ Non conforme'}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs text-textsecondary">{new Date(v.validatedAt).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
