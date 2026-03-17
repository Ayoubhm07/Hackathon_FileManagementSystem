export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED';

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
