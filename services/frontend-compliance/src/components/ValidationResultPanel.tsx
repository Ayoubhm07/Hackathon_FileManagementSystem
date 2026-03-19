import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
import type { ValidationResult } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  documentId: string;
}

export function ValidationResultPanel({ documentId }: Props) {
  const { data, isLoading, error } = useQuery<ValidationResult>({
    queryKey: ['validation', documentId],
    queryFn: async () => (await api.get<ValidationResult>(`/results/${documentId}`)).data,
  });

  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Rapport de validation — ${documentId}`, 14, 20);
    doc.setFontSize(11);
    doc.text(`Type: ${data.documentType}`, 14, 32);
    doc.text(`Statut: ${data.isValid ? '✓ VALIDE' : '✗ INVALIDE'}`, 14, 40);
    doc.text(`Validé le: ${new Date(data.validatedAt).toLocaleDateString('fr-FR')}`, 14, 48);

    const rows = [...data.errors, ...data.warnings].map((e) => [
      e.severity,
      e.code,
      e.field ?? '—',
      e.message,
    ]);

    if (rows.length > 0) {
      autoTable(doc, {
        startY: 58,
        head: [['Sévérité', 'Code', 'Champ', 'Message']],
        body: rows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [22, 163, 74] },
      });
    } else {
      doc.text('Aucune erreur ni avertissement.', 14, 58);
    }

    doc.save(`validation-${documentId}.pdf`);
  };

  if (isLoading) return <div className="text-gray-400 text-sm">Chargement…</div>;
  if (error || !data) return <div className="text-red-500 text-sm">Résultat non disponible</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800">
            {data.isValid ? (
              <span className="text-green-600">✓ Document valide</span>
            ) : (
              <span className="text-red-600">✗ Document invalide</span>
            )}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {data.errors.length} erreur(s) · {data.warnings.length} avertissement(s)
          </p>
        </div>
        <button
          onClick={exportPDF}
          className="px-3 py-1.5 text-xs bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          Exporter PDF
        </button>
      </div>

      {data.errors.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Erreurs</h4>
          <ul className="space-y-1">
            {data.errors.map((e, i) => (
              <li key={i} className="text-sm text-red-700 bg-red-50 rounded p-2">
                <span className="font-mono text-xs text-red-400 mr-2">[{e.code}]</span>
                {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.warnings.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-2">Avertissements</h4>
          <ul className="space-y-1">
            {data.warnings.map((w, i) => (
              <li key={i} className="text-sm text-yellow-700 bg-yellow-50 rounded p-2">
                <span className="font-mono text-xs text-yellow-400 mr-2">[{w.code}]</span>
                {w.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
