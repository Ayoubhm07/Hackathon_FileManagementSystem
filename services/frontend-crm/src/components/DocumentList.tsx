import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
import type { Document } from '../types';
import { StatusBadge } from './StatusBadge';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentList() {
  const { data, isLoading, error } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await api.get<Document[]>('/documents');
      return res.data;
    },
    refetchInterval: 5000,
  });

  if (isLoading) return <div className="text-gray-400 text-sm">Chargement…</div>;
  if (error) return <div className="text-red-500 text-sm">Erreur de chargement</div>;
  if (!data || data.length === 0)
    return <div className="text-gray-400 text-sm">Aucun document soumis.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Nom', 'Type', 'Taille', 'Statut', 'Soumis le'].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data.map((doc) => (
            <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{doc.originalName}</td>
              <td className="px-4 py-3 text-gray-600">{doc.documentType ?? '—'}</td>
              <td className="px-4 py-3 text-gray-600">{formatBytes(doc.fileSize)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={doc.status} />
              </td>
              <td className="px-4 py-3 text-gray-600">
                {new Date(doc.createdAt).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
