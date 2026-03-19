export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
export type DocumentType = 'FACTURE' | 'DEVIS' | 'KBIS' | 'URSSAF' | 'RIB' | 'SIRET_ATTESTATION' | 'UNKNOWN';

export interface ExtractedEntities {
  documentId: string;
  documentType?: string;
  siret?: string;
  tva?: string;
  iban?: string;
  bic?: string;
  montant_ht?: string;
  montant_ttc?: string;
  date_emission?: string;
  date_expiration?: string;
  rawEntities?: Array<{ text: string; label: string }>;
}

export interface Document {
  _id: string;
  originalName: string;
  fileSize: number;
  status: DocumentStatus;
  documentType: DocumentType;
  userId?: string;
  createdAt: string;
}

export interface PaginatedDocuments {
  data: Document[];
  total: number;
  page: number;
  limit: number;
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
