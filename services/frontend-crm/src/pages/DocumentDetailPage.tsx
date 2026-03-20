import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StatusBadge, DocTypeIcon, getDocTypeLabel, Card, PageHeader } from '../components/ui';
import type { Document } from '../types';
import api from '../api';
import keycloak from '../keycloak';

const ENTITY_LABELS: Record<string, string> = {
  documentType:         'Type de document',
  companyName:          'Raison sociale',
  siret:                'SIRET',
  siren:                'SIREN',
  tvaNumber:            'N° TVA',
  address:              'Adresse',
  invoiceNumber:        'N° Facture',
  invoiceDate:          "Date d'émission",
  dueDate:              "Date d'échéance",
  amountHT:             'Montant HT',
  amountTVA:            'Montant TVA',
  amountTTC:            'Montant TTC',
  tvaRate:              'Taux TVA (%)',
  currency:             'Devise',
  iban:                 'IBAN',
  bic:                  'BIC',
  bankName:             'Banque',
  urssafPeriod:         'Période URSSAF',
  urssafExpirationDate: "Date d'expiration",
  urssafStatus:         'Statut URSSAF',
  registrationNumber:   'N° RCS',
  registrationCourt:    'Greffe',
  legalForm:            'Forme juridique',
  shareCapital:         'Capital social',
  incorporationDate:    "Date d'immatriculation",
};

const IGNORE_KEYS = new Set(['documentId', 'rawEntities', '__v', '_id']);

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deciding, setDeciding] = useState<'APPROVED' | 'REJECTED' | null>(null);

  const validatorName = keycloak.tokenParsed?.preferred_username ?? 'Validateur';

  async function decide(decision: 'APPROVED' | 'REJECTED') {
    if (!id) return;
    setDeciding(decision);
    try {
      await api.post(`/decisions/${id}`, { decision, validatorName });
      await queryClient.invalidateQueries({ queryKey: ['document', id] });
    } catch {
      // silent — backend may be unavailable during demo
    } finally {
      setDeciding(null);
    }
  }

  const { data: doc, isLoading: docLoading } = useQuery<Document>({
    queryKey: ['document', id],
    queryFn: async () => (await api.get<Document>(`/documents/${id}`)).data,
    enabled: !!id,
  });

  const { data: entities } = useQuery<Record<string, unknown>>({
    queryKey: ['entities', id],
    queryFn: async () => (await api.get<Record<string, unknown>>(`/entities/${id}`)).data,
    enabled: !!id,
    retry: false,
  });

  const { data: validation } = useQuery<{ isValid: boolean; errors: { message: string }[]; validatedAt: string }>({
    queryKey: ['validation', id],
    queryFn: async () => (await api.get(`/results/${id}`)).data,
    enabled: !!id,
    retry: false,
  });

  if (docLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64 gap-3">
        <div className="text-4xl">🔍</div>
        <p className="text-textprimary font-medium">Document introuvable</p>
        <button onClick={() => navigate('/documents')} className="text-sm text-primary hover:underline">
          Retour aux documents
        </button>
      </div>
    );
  }

  const entityEntries = entities
    ? Object.entries(entities).filter(
        ([k, v]) => !IGNORE_KEYS.has(k) && v != null && v !== '' && ENTITY_LABELS[k]
      )
    : [];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/documents')}
          className="p-1.5 rounded-lg border border-border text-textsecondary hover:text-textprimary transition-colors"
        >
          <ArrowLeft size={14} />
        </button>
        <PageHeader
          title={doc.originalName}
          subtitle={`Déposé le ${new Date(doc.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`}
        />
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left: metadata */}
        <div className="col-span-1 space-y-4">
          <Card className="p-5">
            <div className="aspect-[3/4] bg-navy/60 border border-border rounded-lg flex flex-col items-center justify-center gap-3 mb-4">
              <DocTypeIcon type={doc.documentType} size="lg" />
              <p className="text-xs text-textsecondary text-center">Aperçu<br />non disponible</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-textsecondary">Statut</span>
                <StatusBadge status={doc.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-textsecondary">Type</span>
                <span className="text-textprimary">{getDocTypeLabel(doc.documentType)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textsecondary">Taille</span>
                <span className="text-textprimary font-mono text-xs">
                  {(doc.fileSize / 1024).toFixed(0)} KB
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-textsecondary">Fichier</span>
                <span className="text-textprimary font-mono text-xs truncate max-w-[120px]">
                  {doc.mimeType}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: entities + validation */}
        <div className="col-span-2 space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-textprimary mb-4">Entités extraites</h3>
            {entityEntries.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {entityEntries.map(([key, value], i) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="p-3 bg-navy/40 rounded-lg border border-border"
                  >
                    <p className="text-xs text-textsecondary mb-1">{ENTITY_LABELS[key]}</p>
                    <p className="text-sm font-mono text-textprimary break-all">{String(value)}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-textsecondary text-sm py-4 text-center">
                {doc.status === 'PROCESSED'
                  ? 'Aucune entité extraite pour ce document.'
                  : 'Extraction en cours…'}
              </p>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-textprimary mb-4">Résultat de validation</h3>
            {validation ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 mb-3">
                  {validation.isValid
                    ? <CheckCircle size={18} className="text-success" />
                    : <XCircle size={18} className="text-danger" />}
                  <span className={`font-medium text-sm ${validation.isValid ? 'text-success' : 'text-danger'}`}>
                    {validation.isValid ? 'Document valide' : 'Document invalide'}
                  </span>
                </div>
                {validation.errors?.length > 0 && (
                  <div className="space-y-1">
                    {validation.errors.map((err, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-danger">
                        <XCircle size={13} className="mt-0.5 flex-shrink-0" />
                        <span>{err.message}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-textsecondary mt-2">
                  Validé le {new Date(validation.validatedAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            ) : (
              <p className="text-textsecondary text-sm">
                {doc.status === 'PROCESSED' ? 'Résultat de validation non disponible.' : 'Validation en cours…'}
              </p>
            )}
          </Card>

          {/* Validator action card */}
          {(doc.status === 'PROCESSED' || doc.status === 'APPROVED' || doc.status === 'REJECTED') && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 border"
              style={{
                background: doc.status === 'APPROVED'
                  ? 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.03) 100%)'
                  : doc.status === 'REJECTED'
                  ? 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.03) 100%)'
                  : 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.03) 100%)',
                borderColor: doc.status === 'APPROVED'
                  ? 'rgba(16,185,129,0.25)'
                  : doc.status === 'REJECTED'
                  ? 'rgba(239,68,68,0.25)'
                  : 'rgba(59,130,246,0.2)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-textprimary">Décision du validateur</h3>
              </div>

              {doc.status === 'APPROVED' && (
                <div className="flex items-center gap-3 py-2">
                  <CheckCircle size={22} className="text-emerald-400" />
                  <span className="font-semibold text-emerald-400">Document approuvé</span>
                </div>
              )}
              {doc.status === 'REJECTED' && (
                <div className="flex items-center gap-3 py-2">
                  <XCircle size={22} className="text-red-400" />
                  <span className="font-semibold text-red-400">Document rejeté</span>
                </div>
              )}
              {doc.status === 'PROCESSED' && (
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!!deciding}
                    onClick={() => decide('APPROVED')}
                    className="flex-1 py-3 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-colors disabled:opacity-50"
                  >
                    {deciding === 'APPROVED'
                      ? <Loader2 size={16} className="animate-spin" />
                      : <CheckCircle size={16} />}
                    Approuver
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!!deciding}
                    onClick={() => decide('REJECTED')}
                    className="flex-1 py-3 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors disabled:opacity-50"
                  >
                    {deciding === 'REJECTED'
                      ? <Loader2 size={16} className="animate-spin" />
                      : <XCircle size={16} />}
                    Rejeter
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
