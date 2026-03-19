import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { DocTypeIcon, Card, PageHeader } from '../components/ui';
import { ValidationResultPanel } from '../components/ValidationResultPanel';
import { EntitiesPanel } from '../components/EntitiesPanel';
import type { Document, PaginatedDocuments } from '../types';
import api from '../api';

export function ValidationCenterPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => (await api.get<PaginatedDocuments>('/documents')).data.data,
    refetchInterval: 10_000,
  });

  const processedDocs = documents.filter(d => ['PROCESSED', 'APPROVED', 'REJECTED'].includes(d.status));
  const selectedDoc = documents.find(d => d._id === selectedId);

  async function updateStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    setPending(id + status);
    try {
      await api.patch(`/documents/${id}/status`, { status });
      await queryClient.invalidateQueries({ queryKey: ['documents'] });
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Centre de validation" subtitle={`${processedDocs.length} documents prêts à valider`} />

      <div className="grid grid-cols-5 gap-5 h-[calc(100vh-200px)]">
        {/* Doc list */}
        <Card className="col-span-2 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border text-xs font-semibold text-textsecondary uppercase tracking-wide">
            Documents traités
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-border">
            {processedDocs.map(doc => {
              return (
                <motion.div key={doc._id} whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                  onClick={() => setSelectedId(doc._id)}
                  className={`px-4 py-3 cursor-pointer transition-colors ${selectedId === doc._id ? 'bg-primary/10 border-l-2 border-primary' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <DocTypeIcon type={doc.documentType} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-textprimary truncate">{doc.originalName}</p>
                      <span className="text-xs text-textsecondary">{doc.documentType}</span>
                    </div>
                    {doc.status === 'APPROVED' && <CheckCircle size={14} className="text-success flex-shrink-0" />}
                    {doc.status === 'REJECTED' && <XCircle size={14} className="text-danger flex-shrink-0" />}
                  </div>
                </motion.div>
              );
            })}
            {processedDocs.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-textsecondary">
                Aucun document traité
              </div>
            )}
          </div>
        </Card>

        {/* Detail */}
        <div className="col-span-3 flex flex-col gap-4 overflow-y-auto">
          <AnimatePresence mode="wait">
            {selectedDoc ? (
              <motion.div key={selectedDoc._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
                <EntitiesPanel documentId={selectedDoc._id} />
                <ValidationResultPanel documentId={selectedDoc._id} />

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    disabled={!!pending || selectedDoc.status === 'APPROVED' || selectedDoc.status === 'REJECTED'}
                    onClick={() => updateStatus(selectedDoc._id, 'APPROVED')}
                    className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedDoc.status === 'APPROVED' ? 'bg-success text-white' : 'bg-success/20 hover:bg-success/30 text-success border border-success/30'
                    }`}>
                    {pending === selectedDoc._id + 'APPROVED'
                      ? <Loader2 size={16} className="animate-spin" />
                      : <CheckCircle size={16} />}
                    {selectedDoc.status === 'APPROVED' ? '✓ Approuvé' : 'Approuver'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    disabled={!!pending || selectedDoc.status === 'APPROVED' || selectedDoc.status === 'REJECTED'}
                    onClick={() => updateStatus(selectedDoc._id, 'REJECTED')}
                    className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedDoc.status === 'REJECTED' ? 'bg-danger text-white' : 'bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30'
                    }`}>
                    {pending === selectedDoc._id + 'REJECTED'
                      ? <Loader2 size={16} className="animate-spin" />
                      : <XCircle size={16} />}
                    {selectedDoc.status === 'REJECTED' ? '✗ Rejeté' : 'Rejeter'}
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-16 h-16 rounded-full bg-slate-600/20 flex items-center justify-center text-3xl">🛡️</div>
                <p className="text-textprimary font-medium">Sélectionnez un document</p>
                <p className="text-xs text-textsecondary">Cliquez sur un document pour voir le rapport de conformité</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
