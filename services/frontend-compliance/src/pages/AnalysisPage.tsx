import React from 'react';
import { Card, PageHeader } from '../components/ui';
import { mockDocuments } from '../data/mock-data';

// Simple static supplier network visualization
const mockSuppliers = [
  { id: 'sup001', name: 'BatiPro SARL',       siret: '52312178900042', score: 96, docs: ['doc001', 'doc009'] },
  { id: 'sup002', name: 'Renov Express',       siret: '83741256900018', score: 78, docs: ['doc002', 'doc005'] },
  { id: 'sup003', name: 'Isolatech France',    siret: '61458932100027', score: 72, docs: ['doc007', 'doc008'] },
  { id: 'sup004', name: 'SolarEco Provence',  siret: '44512378600055', score: 65, docs: ['doc010', 'doc015'] },
];

const DOC_TYPE_SHORT: Record<string, string> = { FACTURE: 'FAC', KBIS: 'KBS', RIB: 'RIB', URSSAF: 'URS', DEVIS: 'DEV', SIRET_ATTESTATION: 'SIR' };

export function AnalysisPage() {
  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Analyse croisée" subtitle="Cohérence documentaire par fournisseur" />

      <div className="grid grid-cols-2 gap-5">
        {mockSuppliers.map(sup => {
          const relatedDocs = mockDocuments.filter(d => sup.docs.includes(d._id));
          const hasIssue = sup.score < 80;
          return (
            <Card key={sup.id} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-textprimary">{sup.name}</p>
                  <p className="text-xs font-mono text-textsecondary">{sup.siret}</p>
                </div>
                <span className={`text-lg font-bold font-mono ${sup.score >= 90 ? 'text-success' : sup.score >= 70 ? 'text-warning' : 'text-danger'}`}>
                  {sup.score}%
                </span>
              </div>

              {/* Network graph SVG */}
              <div className="relative h-36 mb-4">
                <svg width="100%" height="144">
                  {/* Center SIRET node */}
                  <ellipse cx="50%" cy="50%" rx="40" ry="20" fill="rgba(139,92,246,0.15)" stroke="#8B5CF6" strokeWidth="1.5" />
                  <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#C4B5FD" fontSize="11" fontFamily="JetBrains Mono, monospace">SIRET</text>

                  {/* Doc nodes */}
                  {relatedDocs.map((doc, i) => {
                    const angle = (i / relatedDocs.length) * Math.PI - Math.PI / 2;
                    const cx = 50 + 38 * Math.cos(angle);
                    const cy = 50 + 30 * Math.sin(angle);
                    const sx = cx + '%', sy = cy + '%';
                    const hasConflict = hasIssue && i === 0;
                    return (
                      <g key={doc._id}>
                        <line x1="50%" y1="50%" x2={sx} y2={sy} stroke={hasConflict ? '#EF4444' : '#374151'} strokeWidth="1.5" strokeDasharray={hasConflict ? '4 2' : undefined} />
                        <circle cx={sx} cy={sy} r="18" fill={hasConflict ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)'} stroke={hasConflict ? '#EF4444' : '#3B82F6'} strokeWidth="1.5" />
                        <text x={sx} y={sy} dominantBaseline="middle" textAnchor="middle" fill={hasConflict ? '#FCA5A5' : '#93C5FD'} fontSize="10" fontFamily="monospace">
                          {DOC_TYPE_SHORT[doc.documentType] ?? '?'}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {hasIssue && (
                <div className="px-3 py-2 bg-danger/10 border border-danger/20 rounded-lg text-xs text-danger">
                  ⚠ Incohérence détectée — vérification manuelle requise
                </div>
              )}
              {!hasIssue && (
                <div className="px-3 py-2 bg-success/10 border border-success/20 rounded-lg text-xs text-success">
                  ✓ Cohérence documentaire vérifiée
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
