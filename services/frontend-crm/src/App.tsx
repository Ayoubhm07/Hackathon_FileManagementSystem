import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import keycloak from './keycloak';
import { UploadZone } from './components/UploadZone';
import { DocumentList } from './components/DocumentList';

export default function App() {
  const queryClient = useQueryClient();

  const handleUploadSuccess = () => {
    void queryClient.invalidateQueries({ queryKey: ['documents'] });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-brand-600">DocFlow</span>
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-500">CRM</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {keycloak.tokenParsed?.preferred_username ?? 'Utilisateur'}
            </span>
            <button
              onClick={() => keycloak.logout()}
              className="text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Upload section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Déposer un document</h2>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <UploadZone onSuccess={handleUploadSuccess} />
          </div>
        </section>

        {/* Documents list */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Mes documents</h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <DocumentList />
          </div>
        </section>
      </main>
    </div>
  );
}
