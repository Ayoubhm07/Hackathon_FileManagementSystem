import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = DocflowNotification & Document;

@Schema({ collection: 'notifications', timestamps: true })
export class DocflowNotification {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  documentId!: string;

  @Prop({ required: true })
  filename!: string;

  @Prop({ required: true, enum: ['APPROVED', 'REJECTED'] })
  decision!: 'APPROVED' | 'REJECTED';

  @Prop({ required: true })
  validatorName!: string;

  @Prop({ default: false })
  read!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(DocflowNotification);
NotificationSchema.index({ userId: 1, createdAt: -1 });
