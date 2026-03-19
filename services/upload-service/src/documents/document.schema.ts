import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DocumentDoc = HydratedDocument<DocFlowDocument>;

export enum DocumentStatus {
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export type DocumentType = 'FACTURE' | 'DEVIS' | 'KBIS' | 'URSSAF' | 'RIB' | 'SIRET_ATTESTATION' | 'UNKNOWN';

@Schema({ timestamps: true, collection: 'documents' })
export class DocFlowDocument {
  @Prop({ required: true }) filename!: string;
  @Prop({ required: true }) originalName!: string;
  @Prop({ default: 'UNKNOWN' }) documentType!: DocumentType;
  @Prop({ required: true }) storagePath!: string;
  @Prop({ required: true }) mimeType!: string;
  @Prop({ required: true }) fileSize!: number;
  @Prop({ type: String, enum: Object.values(DocumentStatus), default: DocumentStatus.UPLOADED })
  status!: DocumentStatus;
  @Prop() userId?: string;
  @Prop({ type: [{ status: String, timestamp: Date, service: String }], default: [] })
  statusHistory!: Array<{ status: string; timestamp: Date; service: string }>;
}

export const DocumentSchema = SchemaFactory.createForClass(DocFlowDocument);
DocumentSchema.index({ status: 1 });
DocumentSchema.index({ documentType: 1 });
DocumentSchema.index({ createdAt: -1 });
