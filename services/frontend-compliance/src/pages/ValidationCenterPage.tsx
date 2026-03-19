import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle } from 'lucide-react';
import { DocTypeIcon, Card, PageHeader } from '../components/ui';
import { ValidationResultPanel } from '../components/ValidationResultPanel';
import { EntitiesPanel } from '../components/EntitiesPanel';
import type { Document, PaginatedDocuments } from '../types';
import api from '../api';

export function ValidationCenterPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [approved, setApproved] = useState<Set<string>>(new Set());
  const [rejected, setRejected] = useState<Set<string>>(new Set());

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => (await api.get<PaginatedDocuments>('/documents')).data.data,
    refetchInterval: 10_000,
  });

  const processedDocs = documents.filter(d => d.status === 'PROCESSED');
  const selectedDoc = documents.find(d => d._id === selectedId);

  function handleApprove(id: string) {
    setApproved(prev => new Set([...prev, id]));
    setRejected(prev => { const s = new Set(prev); s.delete(id); return s; });
  }
  function handleReject(id: string) {
    setRejected(prev => new Set([...prev, id]));
    setApproved(prev => { const s = new Set(prev); s.delete(id); return s; });
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
              const isApproved = approved.has(doc._id);
              const isRejected = rejected.has(doc._id);
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
                    {isApproved && <CheckCircle size={14} className="text-success flex-shrink-0" />}
                    {isRejected && <XCircle size={14} className="text-danger flex-shrink-0" />}
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
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => handleApprove(selectedDoc._id)}
                    className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors ${
                      approved.has(selectedDoc._id) ? 'bg-success text-white' : 'bg-success/20 hover:bg-success/30 text-success border border-success/30'
                    }`}>
                    <CheckCircle size={16} /> {approved.has(selectedDoc._id) ? '✓ Approuvé' : 'Approuver'}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => handleReject(selectedDoc._id)}
                    className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors ${
                      rejected.has(selectedDoc._id) ? 'bg-danger text-white' : 'bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30'
                    }`}>
                    <XCircle size={16} /> {rejected.has(selectedDoc._id) ? '✗ Rejeté' : 'Rejeter'}
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
