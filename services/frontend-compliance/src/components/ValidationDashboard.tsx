import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts';
import api from '../api';
import type { Document, DocumentType } from '../types';

const STATUS_COLORS: Record<string, string> = {
  PROCESSED: '#22c55e',
  PROCESSING: '#eab308',
  FAILED: '#ef4444',
  UPLOADED: '#3b82f6',
};

const TYPE_LABELS: Record<DocumentType, string> = {
  FACTURE: 'Factures',
  DEVIS: 'Devis',
  KBIS: 'KBIS',
  URSSAF: 'URSSAF',
  RIB: 'RIB',
  SIRET_ATTESTATION: 'SIRET',
  UNKNOWN: 'Inconnu',
};

export function ValidationDashboard() {
  const { data: documents } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => (await api.get<Document[]>('/documents')).data,
    refetchInterval: 10_000,
  });

  if (!documents) return <div className="text-gray-400 text-sm">Chargement…</div>;

  // Status distribution
  const statusCounts = documents.reduce<Record<string, number>>((acc, doc) => {
    acc[doc.status] = (acc[doc.status] ?? 0) + 1;
    return acc;
  }, {});
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Type distribution
  const typeCounts = documents.reduce<Record<string, number>>((acc, doc) => {
    const label = TYPE_LABELS[doc.documentType] ?? doc.documentType;
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});
  const typeData = Object.entries(typeCounts).map(([name, count]) => ({ name, count }));

  const total = documents.length;
  const processed = statusCounts['PROCESSED'] ?? 0;
  const failed = statusCounts['FAILED'] ?? 0;

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total documents', value: total, color: 'text-gray-800' },
          { label: 'Traités', value: processed, color: 'text-green-600' },
          { label: 'Échecs', value: failed, color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm p-6 text-center">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Répartition par statut</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Documents par type</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={typeData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
