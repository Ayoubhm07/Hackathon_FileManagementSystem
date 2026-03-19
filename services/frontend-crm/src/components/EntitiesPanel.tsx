import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
import type { ExtractedEntities } from '../types';

interface Props {
  documentId: string;
}

const FIELD_LABELS: Record<string, string> = {
  siret: 'SIRET',
  tva: 'N° TVA',
  iban: 'IBAN',
  bic: 'BIC',
  montant_ht: 'Montant HT',
  montant_ttc: 'Montant TTC',
  date_emission: "Date d'émission",
  date_expiration: "Date d'expiration",
  documentType: 'Type de document',
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
