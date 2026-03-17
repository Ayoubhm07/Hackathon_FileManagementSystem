import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ExtractedEntityDocument = ExtractedEntity & Document;

@Schema({ collection: 'extracted_entities', timestamps: true })
export class ExtractedEntity {
  @Prop({ required: true, index: true })
  documentId!: string;

  @Prop({ required: true })
  documentType!: string;

  // Common fields across document types
  @Prop() siret?: string;
  @Prop() siren?: string;
  @Prop() tvaNumber?: string;
  @Prop() companyName?: string;
  @Prop() address?: string;

  // Invoice / quote fields
  @Prop() invoiceNumber?: string;
  @Prop() invoiceDate?: string;
  @Prop() dueDate?: string;
  @Prop() amountHT?: number;
  @Prop() amountTVA?: number;
  @Prop() amountTTC?: number;
  @Prop() tvaRate?: number;
  @Prop() currency?: string;

  // RIB fields
  @Prop() iban?: string;
  @Prop() bic?: string;
  @Prop() bankName?: string;
  @Prop() accountHolder?: string;

  // URSSAF fields
  @Prop() urssafPeriod?: string;
  @Prop() urssafExpirationDate?: string;
  @Prop() urssafStatus?: string;
  @Prop() cotisationsAmount?: number;

  // KBIS fields
  @Prop() registrationNumber?: string;
  @Prop() registrationCourt?: string;
  @Prop() incorporationDate?: string;
  @Prop() legalForm?: string;
  @Prop() shareCapital?: number;

  @Prop({ type: Object })
  rawEntities?: Record<string, unknown>;
}

export const ExtractedEntitySchema = SchemaFactory.createForClass(ExtractedEntity);
