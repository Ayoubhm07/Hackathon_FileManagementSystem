import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Building2 } from 'lucide-react';
import { Card, PageHeader } from '../components/ui';
import { mockSuppliers } from '../data/mock-data';

const FIELDS = [
  { key: 'raisonSociale', label: 'Raison sociale', source: 'KBIS', delay: 0 },
  { key: 'siret', label: 'SIRET', source: 'KBIS / Facture', delay: 0.4 },
  { key: 'tva', label: 'N° TVA Intracommunautaire', source: 'Facture', delay: 0.8 },
  { key: 'iban', label: 'IBAN', source: 'RIB', delay: 1.2 },
  { key: 'bic', label: 'BIC', source: 'RIB', delay: 1.6 },
  { key: 'adresse', label: 'Adresse', source: 'KBIS', delay: 2.0 },
];

export function SupplierFormPage() {
  const supplier = mockSuppliers[0]!;
  const [values, setValues] = useState<Record<string, string>>({});
  const [filling, setFilling] = useState(false);
  const [done, setDone] = useState(false);

  function startAutofill() {
    setFilling(true);
    setValues({});
    setDone(false);

    FIELDS.forEach(({ key, delay }) => {
      setTimeout(() => {
        const target = supplier[key as keyof typeof supplier] as string;
        let i = 0;
        const interval = setInterval(() => {
          i++;
          setValues(prev => ({ ...prev, [key]: target.slice(0, i) }));
          if (i >= target.length) {
            clearInterval(interval);
            if (key === FIELDS[FIELDS.length - 1]!.key) setDone(true);
          }
        }, 30);
      }, delay * 1000);
    });
  }

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Nouveau fournisseur" subtitle="Remplissage automatique depuis les documents traités" />

      <div className="grid grid-cols-2 gap-5">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
              <Building2 size={16} className="text-primary" />
            </div>
            <h3 className="font-semibold text-textprimary">Fiche fournisseur</h3>
          </div>

          {FIELDS.map(({ key, label, source }) => (
            <div key={key}>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-textsecondary">{label}</label>
                <span className="text-xs text-primary/60 font-mono">{source}</span>
              </div>
              <input
                value={values[key] ?? ''}
                onChange={e => setValues(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-full px-3 py-2 bg-navy/60 border border-border rounded-lg text-sm text-textprimary font-mono focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="—"
              />
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            {!filling && (
              <button
                onClick={startAutofill}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
              >
                ✨ Remplissage automatique IA
              </button>
            )}
            {done && (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex-1 py-2.5 bg-success/20 hover:bg-success/30 text-success border border-success/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle size={14} /> Confirmer le fournisseur
              </motion.button>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-textprimary mb-4">Sources documentaires</h3>
          <div className="space-y-3">
            {['Kbis_Renov_Express_2026.pdf', 'Facture_RenovExpress_F2026-201.pdf', 'RIB_BatiPro_CreditAgricole.pdf'].map(name => (
              <div key={name} className="flex items-center gap-3 p-3 bg-navy/40 border border-border rounded-lg">
                <div className="w-7 h-7 bg-primary/20 rounded text-primary flex items-center justify-center text-xs font-bold">
                  {name.startsWith('K') ? 'K' : name.startsWith('F') ? 'F' : 'R'}
                </div>
                <p className="text-xs text-textprimary truncate">{name}</p>
                <CheckCircle size={12} className="text-success ml-auto flex-shrink-0" />
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
            <p className="text-xs text-success font-medium">✓ Cohérence cross-documents vérifiée</p>
            <p className="text-xs text-textsecondary mt-0.5">SIRET identique dans 2 documents • IBAN validé</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
