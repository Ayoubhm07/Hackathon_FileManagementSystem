export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
export type DocumentType = 'FACTURE' | 'DEVIS' | 'KBIS' | 'URSSAF' | 'RIB' | 'SIRET_ATTESTATION' | 'UNKNOWN';

export interface MockDocument {
  _id: string;
  originalName: string;
  documentType: DocumentType;
  status: DocumentStatus;
  fileSize: number;
  createdAt: string;
  siret?: string;
  tva?: string;
  iban?: string;
  montant_ht?: string;
  montant_ttc?: string;
  confidence?: number;
  complianceScore?: number;
}

export interface ValidationRule {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
}

export interface MockValidation {
  documentId: string;
  isValid: boolean;
  rules: ValidationRule[];
  score: number;
  validatedAt: string;
}

export interface AlertItem {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  documentId: string;
  documentName: string;
  documentType: DocumentType;
  rule: string;
  message: string;
  field?: string;
  createdAt: string;
  dismissed: boolean;
}

export interface AuditEntry {
  id: string;
  user: string;
  action: string;
  documentName: string;
  documentId: string;
  timestamp: string;
  detail?: string;
}

export interface TrendPoint { date: string; score: number; validated: number; failed: number; }

export const mockDocuments: MockDocument[] = [
  { _id: 'doc001', originalName: 'Facture_BatiPro_2024_089.pdf',         documentType: 'FACTURE',           status: 'PROCESSED', fileSize: 245000, createdAt: '2026-03-19T08:12:00Z', siret: '52312178900042', tva: 'FR76523121789', montant_ht: '4850.00', montant_ttc: '5820.00', confidence: 0.97, complianceScore: 94 },
  { _id: 'doc002', originalName: 'Kbis_Renov_Express_2026.pdf',           documentType: 'KBIS',              status: 'PROCESSED', fileSize: 189000, createdAt: '2026-03-19T09:05:00Z', siret: '83741256900018', confidence: 0.99, complianceScore: 100 },
  { _id: 'doc003', originalName: 'Attestation_URSSAF_Q1_2026.pdf',        documentType: 'URSSAF',            status: 'PROCESSING', fileSize: 134000, createdAt: '2026-03-19T10:22:00Z' },
  { _id: 'doc004', originalName: 'RIB_ElectroBat_Societe_Generale.pdf',   documentType: 'RIB',               status: 'PROCESSED', fileSize: 78000,  createdAt: '2026-03-18T14:30:00Z', iban: 'FR7630003000408765432100041', confidence: 0.95, complianceScore: 88 },
  { _id: 'doc005', originalName: 'Devis_ChauffagePlus_2026_D112.pdf',     documentType: 'DEVIS',             status: 'FAILED',    fileSize: 312000, createdAt: '2026-03-18T11:15:00Z', complianceScore: 0 },
  { _id: 'doc006', originalName: 'Attestation_SIRET_PlomberieLyon.pdf',   documentType: 'SIRET_ATTESTATION', status: 'PROCESSED', fileSize: 95000,  createdAt: '2026-03-18T09:45:00Z', siret: '71234567800091', confidence: 0.98, complianceScore: 100 },
  { _id: 'doc007', originalName: 'Facture_IsolatechFrance_F2026-441.pdf', documentType: 'FACTURE',           status: 'PROCESSED', fileSize: 198000, createdAt: '2026-03-17T16:20:00Z', siret: '61458932100027', tva: 'FR45614589321', montant_ht: '12400.00', montant_ttc: '14880.00', confidence: 0.94, complianceScore: 72 },
  { _id: 'doc008', originalName: 'Kbis_IsolatechFrance_2026.pdf',         documentType: 'KBIS',              status: 'UPLOADED',  fileSize: 167000, createdAt: '2026-03-17T15:10:00Z' },
  { _id: 'doc009', originalName: 'RIB_BatiPro_CreditAgricole.pdf',        documentType: 'RIB',               status: 'PROCESSED', fileSize: 82000,  createdAt: '2026-03-17T11:00:00Z', iban: 'FR7617206000426484839288742', confidence: 0.99, complianceScore: 96 },
  { _id: 'doc010', originalName: 'Facture_SolarEco_F2026-088.pdf',        documentType: 'FACTURE',           status: 'PROCESSED', fileSize: 276000, createdAt: '2026-03-16T13:45:00Z', siret: '44512378600055', tva: 'FR22445123786', montant_ht: '7200.00', montant_ttc: '8640.00', confidence: 0.96, complianceScore: 65 },
];

export const mockValidations: MockValidation[] = [
  { documentId: 'doc001', isValid: true,  score: 94, validatedAt: '2026-03-19T08:14:00Z', rules: [
    { id: 'r1', label: 'SIRET valide (14 chiffres)', status: 'pass' },
    { id: 'r2', label: 'Format TVA intracommunautaire correct', status: 'pass' },
    { id: 'r3', label: 'Cohérence montant HT + TVA = TTC', status: 'pass' },
    { id: 'r4', label: 'Date émission < 90 jours', status: 'pass' },
    { id: 'r5', label: 'Confiance OCR > 90%', status: 'pass' },
    { id: 'r6', label: 'Fournisseur référencé en base', status: 'warn', message: 'Fournisseur non encore confirmé' },
  ]},
  { documentId: 'doc007', isValid: false, score: 72, validatedAt: '2026-03-17T16:23:00Z', rules: [
    { id: 'r1', label: 'SIRET valide (14 chiffres)', status: 'pass' },
    { id: 'r2', label: 'Format TVA intracommunautaire correct', status: 'pass' },
    { id: 'r3', label: 'Cohérence montant HT + TVA = TTC', status: 'fail', message: 'TVA calculée: 2360€ ≠ TVA facturée: 2480€' },
    { id: 'r4', label: 'Date émission < 90 jours', status: 'pass' },
    { id: 'r5', label: 'Confiance OCR > 90%', status: 'warn', message: 'Confiance: 94% (limite: 95%)' },
    { id: 'r6', label: 'Fournisseur référencé en base', status: 'pass' },
  ]},
  { documentId: 'doc010', isValid: false, score: 65, validatedAt: '2026-03-16T13:48:00Z', rules: [
    { id: 'r1', label: 'SIRET valide (14 chiffres)', status: 'pass' },
    { id: 'r2', label: 'Format TVA intracommunautaire correct', status: 'fail', message: 'Numéro TVA non trouvé dans le registre VIES' },
    { id: 'r3', label: 'Cohérence montant HT + TVA = TTC', status: 'pass' },
    { id: 'r4', label: 'Date émission < 90 jours', status: 'pass' },
    { id: 'r5', label: 'Confiance OCR > 90%', status: 'pass' },
    { id: 'r6', label: 'Fournisseur référencé en base', status: 'fail', message: 'SolarEco Provence — dossier incomplet (URSSAF manquante)' },
  ]},
  { documentId: 'doc004', isValid: true, score: 88, validatedAt: '2026-03-18T14:32:00Z', rules: [
    { id: 'r1', label: 'Format IBAN français valide', status: 'pass' },
    { id: 'r2', label: 'Code BIC/SWIFT reconnu', status: 'pass' },
    { id: 'r3', label: 'Banque déclarée correspond au domiciliation', status: 'warn', message: 'Vérification manuelle recommandée' },
    { id: 'r4', label: 'Confiance OCR > 90%', status: 'pass' },
  ]},
  { documentId: 'doc009', isValid: true, score: 96, validatedAt: '2026-03-17T11:02:00Z', rules: [
    { id: 'r1', label: 'Format IBAN français valide', status: 'pass' },
    { id: 'r2', label: 'Code BIC/SWIFT reconnu', status: 'pass' },
    { id: 'r3', label: 'Banque déclarée correspond au domiciliation', status: 'pass' },
    { id: 'r4', label: 'Confiance OCR > 90%', status: 'pass' },
  ]},
  { documentId: 'doc002', isValid: true, score: 100, validatedAt: '2026-03-19T09:07:00Z', rules: [
    { id: 'r1', label: 'SIRET valide (14 chiffres)', status: 'pass' },
    { id: 'r2', label: 'Extrait Kbis < 3 mois', status: 'pass' },
    { id: 'r3', label: 'Siège social présent', status: 'pass' },
    { id: 'r4', label: 'Capital social mentionné', status: 'pass' },
  ]},
  { documentId: 'doc006', isValid: true, score: 100, validatedAt: '2026-03-18T09:47:00Z', rules: [
    { id: 'r1', label: 'SIRET valide (14 chiffres)', status: 'pass' },
    { id: 'r2', label: 'Attestation < 6 mois', status: 'pass' },
    { id: 'r3', label: 'Confiance OCR > 90%', status: 'pass' },
  ]},
];

export const mockAlerts: AlertItem[] = [
  { id: 'a1', severity: 'CRITICAL', documentId: 'doc005', documentName: 'Devis_ChauffagePlus_2026_D112.pdf',    documentType: 'DEVIS',   rule: 'OCR_FAILURE',   message: 'Échec OCR — document illisible ou corrompu. Traitement impossible.', createdAt: '2026-03-18T11:17:00Z', dismissed: false },
  { id: 'a2', severity: 'CRITICAL', documentId: 'doc007', documentName: 'Facture_IsolatechFrance_F2026-441.pdf', documentType: 'FACTURE', rule: 'TVA_MISMATCH',  message: 'Incohérence montant TVA — TVA calculée (2360€) ≠ TVA déclarée (2480€)', field: 'montant_ttc', createdAt: '2026-03-17T16:23:00Z', dismissed: false },
  { id: 'a3', severity: 'WARNING',  documentId: 'doc010', documentName: 'Facture_SolarEco_F2026-088.pdf',        documentType: 'FACTURE', rule: 'TVA_NOT_FOUND', message: 'Numéro TVA FR22445123786 non trouvé dans le registre VIES',             field: 'tva',         createdAt: '2026-03-16T13:48:00Z', dismissed: false },
  { id: 'a4', severity: 'WARNING',  documentId: 'doc003', documentName: 'Attestation_URSSAF_Q1_2026.pdf',        documentType: 'URSSAF', rule: 'EXPIRY_SOON',   message: "Attestation URSSAF expire dans 18 jours — renouvellement requis",                                   createdAt: '2026-03-19T10:30:00Z', dismissed: false },
  { id: 'a5', severity: 'INFO',     documentId: 'doc001', documentName: 'Facture_BatiPro_2024_089.pdf',          documentType: 'FACTURE', rule: 'SUPPLIER_NEW',  message: 'Nouveau fournisseur BatiPro SARL — vérification du dossier recommandée',                          createdAt: '2026-03-19T08:14:00Z', dismissed: false },
  { id: 'a6', severity: 'INFO',     documentId: 'doc004', documentName: 'RIB_ElectroBat_Societe_Generale.pdf',   documentType: 'RIB',     rule: 'MANUAL_CHECK',  message: 'Vérification manuelle recommandée pour la domiciliation bancaire',                               createdAt: '2026-03-18T14:32:00Z', dismissed: false },
];

export const trendData: TrendPoint[] = [
  { date: '18/02', score: 71, validated: 5,  failed: 2 },
  { date: '25/02', score: 74, validated: 8,  failed: 1 },
  { date: '04/03', score: 78, validated: 11, failed: 2 },
  { date: '11/03', score: 82, validated: 9,  failed: 1 },
  { date: '18/03', score: 79, validated: 12, failed: 3 },
  { date: '19/03', score: 84, validated: 7,  failed: 1 },
];

export const auditLog: AuditEntry[] = [
  { id: 'au01', user: 'jean.dupont',   action: 'VALIDATION_APPROVED', documentName: 'Kbis_Renov_Express_2026.pdf',           documentId: 'doc002', timestamp: '2026-03-19T09:15:00Z', detail: 'Score: 100/100' },
  { id: 'au02', user: 'marie.martin',  action: 'ALERT_DISMISSED',     documentName: 'Facture_BatiPro_2024_089.pdf',          documentId: 'doc001', timestamp: '2026-03-19T09:00:00Z', detail: 'Alerte INFO ignorée' },
  { id: 'au03', user: 'jean.dupont',   action: 'DOCUMENT_UPLOADED',   documentName: 'Attestation_URSSAF_Q1_2026.pdf',        documentId: 'doc003', timestamp: '2026-03-19T08:30:00Z' },
  { id: 'au04', user: 'admin',         action: 'VALIDATION_REJECTED', documentName: 'Facture_IsolatechFrance_F2026-441.pdf', documentId: 'doc007', timestamp: '2026-03-18T17:00:00Z', detail: 'TVA incohérente' },
  { id: 'au05', user: 'paul.bernard',  action: 'DOCUMENT_UPLOADED',   documentName: 'RIB_ElectroBat_Societe_Generale.pdf',   documentId: 'doc004', timestamp: '2026-03-18T14:30:00Z' },
  { id: 'au06', user: 'marie.martin',  action: 'VALIDATION_APPROVED', documentName: 'Attestation_SIRET_PlomberieLyon.pdf',   documentId: 'doc006', timestamp: '2026-03-18T10:00:00Z', detail: 'Score: 100/100' },
  { id: 'au07', user: 'jean.dupont',   action: 'REPORT_GENERATED',    documentName: 'Rapport_Mars_2026.pdf',                 documentId: 'rep001', timestamp: '2026-03-17T18:00:00Z', detail: 'Export PDF' },
  { id: 'au08', user: 'paul.bernard',  action: 'VALIDATION_APPROVED', documentName: 'RIB_BatiPro_CreditAgricole.pdf',        documentId: 'doc009', timestamp: '2026-03-17T11:30:00Z', detail: 'Score: 96/100' },
  { id: 'au09', user: 'admin',         action: 'USER_ROLE_UPDATED',   documentName: '—',                                     documentId: '',       timestamp: '2026-03-16T09:00:00Z', detail: 'paul.bernard → ROLE_VALIDATOR' },
  { id: 'au10', user: 'marie.martin',  action: 'VALIDATION_REJECTED', documentName: 'Facture_SolarEco_F2026-088.pdf',        documentId: 'doc010', timestamp: '2026-03-16T14:00:00Z', detail: 'TVA non vérifiable VIES' },
];
