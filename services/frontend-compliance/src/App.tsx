import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import keycloak from './keycloak';
import { ValidationDashboard } from './components/ValidationDashboard';
import { ValidationResultPanel } from './components/ValidationResultPanel';
import api from './api';
import type { Document } from './types';

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: documents } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => (await api.get<Document[]>('/documents')).data,
    refetchInterval: 10_000,
  });

  const processedDocs = documents?.filter((d) => d.status === 'PROCESSED') ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-brand-600">DocFlow</span>
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-500">Compliance</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{keycloak.tokenParsed?.preferred_username ?? 'Utilisateur'}</span>
            <button onClick={() => keycloak.logout()} className="text-sm text-red-500 hover:text-red-700 transition-colors">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Tableau de bord</h2>
          <ValidationDashboard />
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Résultats de validation</h2>
          <div className="grid grid-cols-3 gap-6">
            {/* Document list */}
            <div className="col-span-1 bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Documents traités ({processedDocs.length})
              </div>
              <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {processedDocs.map((doc) => (
                  <li
                    key={doc._id}
                    onClick={() => setSelectedId(doc._id)}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedId === doc._id ? 'bg-brand-50 border-l-2 border-brand-500' : ''
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-800 truncate">{doc.originalName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{doc.documentType}</p>
                  </li>
                ))}
                {processedDocs.length === 0 && (
                  <li className="px-4 py-6 text-xs text-gray-400 text-center">Aucun document traité</li>
                )}
              </ul>
            </div>

            {/* Validation detail */}
            <div className="col-span-2">
              {selectedId ? (
                <ValidationResultPanel documentId={selectedId} />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                  Sélectionnez un document pour voir son rapport
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
