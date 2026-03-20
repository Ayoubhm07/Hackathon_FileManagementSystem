import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DocflowDocumentDocument = DocflowDocument & Document;

/** Minimal projection of the documents collection (owned by upload-service). */
@Schema({ collection: 'documents' })
export class DocflowDocument {
  @Prop()
  originalName!: string;

  @Prop()
  userId?: string;

  @Prop()
  status!: string;
}

export const DocflowDocumentSchema = SchemaFactory.createForClass(DocflowDocument);
