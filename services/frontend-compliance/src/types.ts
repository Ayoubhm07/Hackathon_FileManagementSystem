export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
export type DocumentType = 'FACTURE' | 'DEVIS' | 'KBIS' | 'URSSAF' | 'RIB' | 'SIRET_ATTESTATION' | 'UNKNOWN';

export interface Document {
  _id: string;
  originalName: string;
  fileSize: number;
  status: DocumentStatus;
  documentType: DocumentType;
  userId?: string;
  createdAt: string;
}

export interface ValidationError {
  code: string;
  field?: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

export interface ValidationResult {
  documentId: string;
  documentType: DocumentType;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  validatedAt: string;
}
