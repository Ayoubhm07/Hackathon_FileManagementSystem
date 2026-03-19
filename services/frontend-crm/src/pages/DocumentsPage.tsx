import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { StatusBadge, DocTypeIcon, getDocTypeLabel, Card, PageHeader } from '../components/ui';
import type { Document, DocumentStatus, DocumentType } from '../types';
import api from '../api';

const PAGE_SIZE = 8;

export function DocumentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | ''>('');
  const [page, setPage] = useState(1);

  const { data } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => (await api.get<{ data: Document[] }>('/documents')).data.data,
    refetchInterval: 10_000,
  });

  const documents = data ?? [];

  const filtered = useMemo(() => {
    return documents.filter(d => {
      if (search && !d.originalName.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && d.status !== statusFilter) return false;
      if (typeFilter && d.documentType !== typeFilter) return false;
      return true;
    });
  }, [documents, search, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function formatBytes(b: number) {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b/1024).toFixed(0)} KB`;
    return `${(b/(1024*1024)).toFixed(1)} MB`;
  }

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Documents" subtitle={`${filtered.length} document(s) trouvé(s)`} />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textsecondary" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Rechercher..."
              className="w-full pl-9 pr-4 py-2 bg-navy/60 border border-border rounded-lg text-sm text-textprimary placeholder-textsecondary focus:outline-none focus:border-primary/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as DocumentStatus | ''); setPage(1); }}
            className="px-3 py-2 bg-navy/60 border border-border rounded-lg text-sm text-textprimary focus:outline-none focus:border-primary/50"
          >
            <option value="">Tous les statuts</option>
            <option value="UPLOADED">Déposé</option>
            <option value="PROCESSING">En cours</option>
            <option value="PROCESSED">Traité</option>
            <option value="FAILED">Échec</option>
          </select>
          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value as DocumentType | ''); setPage(1); }}
            className="px-3 py-2 bg-navy/60 border border-border rounded-lg text-sm text-textprimary focus:outline-none focus:border-primary/50"
          >
            <option value="">Tous les types</option>
            <option value="FACTURE">Facture</option>
            <option value="DEVIS">Devis</option>
            <option value="KBIS">KBIS</option>
            <option value="URSSAF">URSSAF</option>
            <option value="RIB">RIB</option>
            <option value="SIRET_ATTESTATION">SIRET</option>
          </select>
          {(search || statusFilter || typeFilter) && (
            <button onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); setPage(1); }}
              className="flex items-center gap-1 px-3 py-2 text-xs text-textsecondary hover:text-danger border border-border rounded-lg transition-colors">
              <X size={12} /> Réinitialiser
            </button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Document', 'Type', 'Taille', 'Statut', 'Date'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-textsecondary uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <AnimatePresence mode="wait">
              {paginated.map((doc, i) => (
                <motion.tr
                  key={doc._id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => navigate(`/documents/${doc._id}`)}
                  className="hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <DocTypeIcon type={doc.documentType} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-textprimary group-hover:text-primary transition-colors truncate max-w-[220px]">{doc.originalName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-textsecondary">{getDocTypeLabel(doc.documentType)}</td>
                  <td className="px-5 py-3 text-sm text-textsecondary font-mono">{formatBytes(doc.fileSize)}</td>
                  <td className="px-5 py-3"><StatusBadge status={doc.status} /></td>
                  <td className="px-5 py-3 text-xs text-textsecondary whitespace-nowrap">
                    {new Date(doc.createdAt).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' })}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {paginated.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-slate-600/30 flex items-center justify-center text-2xl">📄</div>
                    <p className="text-sm text-textsecondary">Aucun document trouvé</p>
                    <p className="text-xs text-textsecondary">Modifiez vos filtres ou déposez un nouveau document</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-textsecondary">Page {page} sur {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded border border-border text-textsecondary hover:text-textprimary disabled:opacity-30 transition-colors">
                <ChevronLeft size={14} />
              </button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded border border-border text-textsecondary hover:text-textprimary disabled:opacity-30 transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
