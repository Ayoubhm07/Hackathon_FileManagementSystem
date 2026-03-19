import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ValidationResultDocument = ValidationResult & Document;

export interface ValidationError {
  code: string;
  field?: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

@Schema({ collection: 'validation_results', timestamps: true })
export class ValidationResult {
  @Prop({ required: true, index: true })
  documentId!: string;

  @Prop({ required: true })
  documentType!: string;

  @Prop({ required: true })
  isValid!: boolean;

  @Prop({ type: [Object], default: [] })
  errors!: ValidationError[];

  @Prop({ type: [Object], default: [] })
  warnings!: ValidationError[];

  @Prop({ required: true })
  validatedAt!: Date;

  @Prop()
  correlationId?: string;

  @Prop()
  validatorVersion!: string;
}

export const ValidationResultSchema = SchemaFactory.createForClass(ValidationResult);
ValidationResultSchema.index({ documentId: 1, createdAt: -1 });
