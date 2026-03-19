export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'APPROVED' | 'REJECTED';

export type DocumentType =
  | 'FACTURE'
  | 'DEVIS'
  | 'KBIS'
  | 'URSSAF'
  | 'RIB'
  | 'SIRET_ATTESTATION'
  | 'UNKNOWN';

export interface StatusHistoryEntry {
  status: DocumentStatus;
  updatedAt: string;
  updatedBy: string;
}

export interface ExtractedEntities {
  documentId: string;
  documentType?: string;
  companyName?: string;
  siret?: string;
  siren?: string;
  tvaNumber?: string;
  address?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  amountHT?: number;
  amountTVA?: number;
  amountTTC?: number;
  tvaRate?: number;
  currency?: string;
  iban?: string;
  bic?: string;
  bankName?: string;
  urssafPeriod?: string;
  urssafExpirationDate?: string;
  urssafStatus?: string;
  registrationNumber?: string;
  registrationCourt?: string;
  legalForm?: string;
  shareCapital?: number;
  incorporationDate?: string;
  rawEntities?: { orgs: string[]; locations: string[] };
}

export interface Document {
  _id: string;
  filename: string;
  originalName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  status: DocumentStatus;
  documentType: DocumentType;
  userId?: string;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}
