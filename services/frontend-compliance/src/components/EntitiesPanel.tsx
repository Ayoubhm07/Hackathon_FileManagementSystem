import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
import type { ExtractedEntities } from '../types';

interface Props {
  documentId: string;
}

const FIELD_LABELS: Record<string, string> = {
  documentType:         'Type de document',
  companyName:          'Raison sociale',
  siret:                'SIRET',
  siren:                'SIREN',
  tvaNumber:            'N° TVA',
  address:              'Adresse',
  // Facture / Devis
  invoiceNumber:        'N° Facture',
  invoiceDate:          "Date d'émission",
  dueDate:              "Date d'échéance",
  amountHT:             'Montant HT',
  amountTVA:            'Montant TVA',
  amountTTC:            'Montant TTC',
  tvaRate:              'Taux TVA (%)',
  currency:             'Devise',
  // RIB
  iban:                 'IBAN',
  bic:                  'BIC',
  bankName:             'Banque',
  // URSSAF
  urssafPeriod:         'Période URSSAF',
  urssafExpirationDate: "Date d'expiration",
  urssafStatus:         'Statut URSSAF',
  // KBIS
  registrationNumber:   'N° RCS',
  registrationCourt:    'Greffe',
  legalForm:            'Forme juridique',
  shareCapital:         'Capital social',
  incorporationDate:    "Date d'immatriculation",
};

const DISPLAY_FIELDS = Object.keys(FIELD_LABELS);

export function EntitiesPanel({ documentId }: Props) {
  const { data, isLoading, error } = useQuery<ExtractedEntities>({
    queryKey: ['entities', documentId],
    queryFn: async () => (await api.get<ExtractedEntities>(`/entities/${documentId}`)).data,
  });

  if (isLoading) return <div className="text-gray-400 text-sm p-4">Chargement des entités…</div>;
  if (error || !data)
    return <div className="text-gray-400 text-sm p-4">Aucune entité extraite.</div>;

  const fields = DISPLAY_FIELDS.filter((k) => data[k as keyof ExtractedEntities] != null);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Entités extraites
      </h4>
      {fields.length === 0 ? (
        <p className="text-sm text-gray-400">Aucun champ structuré identifié.</p>
      ) : (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          {fields.map((key) => (
            <div key={key}>
              <dt className="text-xs text-gray-400">{FIELD_LABELS[key]}</dt>
              <dd className="text-sm font-medium text-gray-800 font-mono break-all">
                {String(data[key as keyof ExtractedEntities])}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
