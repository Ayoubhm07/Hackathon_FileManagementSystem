export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
export type DocumentType = 'FACTURE' | 'DEVIS' | 'KBIS' | 'URSSAF' | 'RIB' | 'SIRET_ATTESTATION' | 'UNKNOWN';

export interface MockDocument {
  _id: string;
  originalName: string;
  documentType: DocumentType;
  status: DocumentStatus;
  fileSize: number;
  mimeType: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  storagePath: string;
  siret?: string;
  tva?: string;
  iban?: string;
  bic?: string;
  montant_ht?: string;
  montant_ttc?: string;
  confidence?: number;
}

export interface MockSupplier {
  id: string;
  raisonSociale: string;
  siret: string;
  tva: string;
  iban: string;
  bic: string;
  adresse: string;
  conformanceScore: number;
}

export interface DailyStats {
  date: string;
  processed: number;
  failed: number;
  uploaded: number;
}

export interface MockAlert {
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

export const mockDocuments: MockDocument[] = [
  { _id: 'doc001', originalName: 'Facture_BatiPro_2024_089.pdf', documentType: 'FACTURE', status: 'PROCESSED', fileSize: 245000, mimeType: 'application/pdf', userId: 'user1', createdAt: '2026-03-19T08:12:00Z', updatedAt: '2026-03-19T08:14:22Z', storagePath: 'doc001/original.pdf', siret: '52312178900042', tva: 'FR76523121789', montant_ht: '4850.00', montant_ttc: '5820.00', confidence: 0.97 },
  { _id: 'doc002', originalName: 'Kbis_Renov_Express_2026.pdf', documentType: 'KBIS', status: 'PROCESSED', fileSize: 189000, mimeType: 'application/pdf', userId: 'user1', createdAt: '2026-03-19T09:05:00Z', updatedAt: '2026-03-19T09:07:11Z', storagePath: 'doc002/original.pdf', siret: '83741256900018', confidence: 0.99 },
  { _id: 'doc003', originalName: 'Attestation_URSSAF_Q1_2026.pdf', documentType: 'URSSAF', status: 'PROCESSING', fileSize: 134000, mimeType: 'application/pdf', userId: 'user2', createdAt: '2026-03-19T10:22:00Z', updatedAt: '2026-03-19T10:22:00Z', storagePath: 'doc003/original.pdf' },
  { _id: 'doc004', originalName: 'RIB_ElectroBat_Societe_Generale.pdf', documentType: 'RIB', status: 'PROCESSED', fileSize: 78000, mimeType: 'application/pdf', userId: 'user1', createdAt: '2026-03-18T14:30:00Z', updatedAt: '2026-03-18T14:32:45Z', storagePath: 'doc004/original.pdf', iban: 'FR7630003000408765432100041', bic: 'SOGEFRPPXXX', confidence: 0.95 },
  { _id: 'doc005', originalName: 'Devis_ChauffagePlus_2026_D112.pdf', documentType: 'DEVIS', status: 'FAILED', fileSize: 312000, mimeType: 'application/pdf', userId: 'user2', createdAt: '2026-03-18T11:15:00Z', updatedAt: '2026-03-18T11:17:03Z', storagePath: 'doc005/original.pdf' },
  { _id: 'doc006', originalName: 'Attestation_SIRET_PlomberieLyon.pdf', documentType: 'SIRET_ATTESTATION', status: 'PROCESSED', fileSize: 95000, mimeType: 'application/pdf', userId: 'user1', createdAt: '2026-03-18T09:45:00Z', updatedAt: '2026-03-18T09:47:32Z', storagePath: 'doc006/original.pdf', siret: '71234567800091', confidence: 0.98 },
  { _id: 'doc007', originalName: 'Facture_IsolatechFrance_F2026-441.pdf', documentType: 'FACTURE', status: 'PROCESSED', fileSize: 198000, mimeType: 'application/pdf', userId: 'user3', createdAt: '2026-03-17T16:20:00Z', updatedAt: '2026-03-17T16:23:18Z', storagePath: 'doc007/original.pdf', siret: '61458932100027', tva: 'FR45614589321', montant_ht: '12400.00', montant_ttc: '14880.00', confidence: 0.94 },
  { _id: 'doc008', originalName: 'Kbis_IsolatechFrance_2026.pdf', documentType: 'KBIS', status: 'UPLOADED', fileSize: 167000, mimeType: 'application/pdf', userId: 'user3', createdAt: '2026-03-17T15:10:00Z', updatedAt: '2026-03-17T15:10:00Z', storagePath: 'doc008/original.pdf' },
  { _id: 'doc009', originalName: 'RIB_BatiPro_CreditAgricole.pdf', documentType: 'RIB', status: 'PROCESSED', fileSize: 82000, mimeType: 'application/pdf', userId: 'user1', createdAt: '2026-03-17T11:00:00Z', updatedAt: '2026-03-17T11:02:11Z', storagePath: 'doc009/original.pdf', iban: 'FR7617206000426484839288742', bic: 'AGRIFRPP872', confidence: 0.99 },
  { _id: 'doc010', originalName: 'Facture_SolarEco_F2026-088.pdf', documentType: 'FACTURE', status: 'PROCESSED', fileSize: 276000, mimeType: 'application/pdf', userId: 'user2', createdAt: '2026-03-16T13:45:00Z', updatedAt: '2026-03-16T13:48:02Z', storagePath: 'doc010/original.pdf', siret: '44512378600055', tva: 'FR22445123786', montant_ht: '7200.00', montant_ttc: '8640.00', confidence: 0.96 },
  { _id: 'doc011', originalName: 'Attestation_URSSAF_BatiPro_2026.pdf', documentType: 'URSSAF', status: 'PROCESSED', fileSize: 128000, mimeType: 'application/pdf', userId: 'user1', createdAt: '2026-03-16T10:30:00Z', updatedAt: '2026-03-16T10:32:44Z', storagePath: 'doc011/original.pdf', confidence: 0.91 },
  { _id: 'doc012', originalName: 'Facture_RenovExpress_F2026-201.pdf', documentType: 'FACTURE', status: 'FAILED', fileSize: 334000, mimeType: 'application/pdf', userId: 'user2', createdAt: '2026-03-15T14:20:00Z', updatedAt: '2026-03-15T14:22:15Z', storagePath: 'doc012/original.pdf' },
  { _id: 'doc013', originalName: 'Devis_PlomberieLyon_D2026-77.pdf', documentType: 'DEVIS', status: 'PROCESSED', fileSize: 156000, mimeType: 'application/pdf', userId: 'user3', createdAt: '2026-03-15T09:15:00Z', updatedAt: '2026-03-15T09:17:33Z', storagePath: 'doc013/original.pdf', confidence: 0.88 },
  { _id: 'doc014', originalName: 'Kbis_SolarEco_2026.pdf', documentType: 'KBIS', status: 'PROCESSING', fileSize: 172000, mimeType: 'application/pdf', userId: 'user1', createdAt: '2026-03-19T11:00:00Z', updatedAt: '2026-03-19T11:00:00Z', storagePath: 'doc014/original.pdf' },
  { _id: 'doc015', originalName: 'Attestation_SIRET_SolarEco.pdf', documentType: 'SIRET_ATTESTATION', status: 'PROCESSED', fileSize: 91000, mimeType: 'application/pdf', userId: 'user2', createdAt: '2026-03-14T16:00:00Z', updatedAt: '2026-03-14T16:02:08Z', storagePath: 'doc015/original.pdf', siret: '44512378600055', confidence: 0.97 },
];

export const mockSuppliers: MockSupplier[] = [
  { id: 'sup001', raisonSociale: 'BatiPro SARL', siret: '52312178900042', tva: 'FR76523121789', iban: 'FR7617206000426484839288742', bic: 'AGRIFRPP872', adresse: '14 Rue du Faubourg Saint-Antoine, 75011 Paris', conformanceScore: 96 },
  { id: 'sup002', raisonSociale: 'Renov Express SAS', siret: '83741256900018', tva: 'FR41837412569', iban: 'FR7630003000408765432100041', bic: 'SOGEFRPPXXX', adresse: '7 Avenue de la République, 69003 Lyon', conformanceScore: 78 },
  { id: 'sup003', raisonSociale: 'Isolatech France', siret: '61458932100027', tva: 'FR45614589321', iban: 'FR7614508400478498328590148', bic: 'CEPAFRPP751', adresse: '23 Bd Haussmann, 75009 Paris', conformanceScore: 82 },
  { id: 'sup004', raisonSociale: 'PlomberieLyon', siret: '71234567800091', tva: 'FR88712345678', iban: 'FR7610278060000020828380120', bic: 'CMCIFRPP', adresse: '45 Rue Garibaldi, 69006 Lyon', conformanceScore: 91 },
  { id: 'sup005', raisonSociale: 'SolarEco Provence', siret: '44512378600055', tva: 'FR22445123786', iban: 'FR7613106005004904437688185', bic: 'BNPAFRPPXXX', adresse: '8 Cours Mirabeau, 13100 Aix-en-Provence', conformanceScore: 67 },
];

export const dailyStats: DailyStats[] = [
  { date: '13/03', processed: 8, failed: 1, uploaded: 10 },
  { date: '14/03', processed: 12, failed: 0, uploaded: 13 },
  { date: '15/03', processed: 7, failed: 2, uploaded: 9 },
  { date: '16/03', processed: 15, failed: 1, uploaded: 16 },
  { date: '17/03', processed: 11, failed: 0, uploaded: 12 },
  { date: '18/03', processed: 9, failed: 2, uploaded: 11 },
  { date: '19/03', processed: 6, failed: 0, uploaded: 8 },
];

export const mockAlerts: MockAlert[] = [
  { id: 'alert001', severity: 'CRITICAL', documentId: 'doc005', documentName: 'Devis_ChauffagePlus_2026_D112.pdf', documentType: 'DEVIS', rule: 'OCR_FAILURE', message: 'Échec de la reconnaissance optique — document illisible ou corrompu', field: undefined, createdAt: '2026-03-18T11:17:03Z', dismissed: false },
  { id: 'alert002', severity: 'CRITICAL', documentId: 'doc012', documentName: 'Facture_RenovExpress_F2026-201.pdf', documentType: 'FACTURE', rule: 'OCR_FAILURE', message: 'OCR échoué après 3 tentatives — vérifiez la qualité du scan', createdAt: '2026-03-15T14:22:15Z', dismissed: false },
  { id: 'alert003', severity: 'WARNING', documentId: 'doc007', documentName: 'Facture_IsolatechFrance_F2026-441.pdf', documentType: 'FACTURE', rule: 'TVA_MISMATCH', message: 'Incohérence montant TVA — TVA calculée (2360€) ≠ TVA déclarée (2480€)', field: 'montant_ttc', createdAt: '2026-03-17T16:23:18Z', dismissed: false },
  { id: 'alert004', severity: 'WARNING', documentId: 'doc011', documentName: 'Attestation_URSSAF_BatiPro_2026.pdf', documentType: 'URSSAF', rule: 'EXPIRY_SOON', message: "Attestation URSSAF expire dans 18 jours — renouvellement requis avant le 06/04/2026", createdAt: '2026-03-16T10:32:44Z', dismissed: false },
  { id: 'alert005', severity: 'INFO', documentId: 'doc013', documentName: 'Devis_PlomberieLyon_D2026-77.pdf', documentType: 'DEVIS', rule: 'LOW_CONFIDENCE', message: 'Confiance OCR faible (88%) — vérification manuelle recommandée', createdAt: '2026-03-15T09:17:33Z', dismissed: false },
];
