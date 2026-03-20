import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DocflowNotification, NotificationDocument } from './notification.schema';
import { NotificationGateway } from './notification.gateway';

export interface ValidationEvent {
  documentId: string;
  filename: string;
  decision: 'APPROVED' | 'REJECTED';
  validatorName: string;
  operatorId: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(DocflowNotification.name)
    private readonly model: Model<NotificationDocument>,
    private readonly gateway: NotificationGateway,
  ) {}

  async processValidationEvent(event: ValidationEvent): Promise<void> {
    this.logger.log(`Processing: documentId=${event.documentId} decision=${event.decision} → operatorId=${event.operatorId}`);

    const notif = await this.model.create({
      userId: event.operatorId,
      documentId: event.documentId,
      filename: event.filename,
      decision: event.decision,
      validatorName: event.validatorName,
      read: false,
    });

    const payload = {
      _id: String(notif._id),
      userId: notif.userId,
      documentId: notif.documentId,
      filename: notif.filename,
      decision: notif.decision,
      validatorName: notif.validatorName,
      read: false,
      createdAt: notif.createdAt,
    };

    this.gateway.emitToUser(event.operatorId, payload);
    this.logger.log(`Notification created and pushed to user:${event.operatorId}`);
  }

  async getByUser(userId: string): Promise<NotificationDocument[]> {
    return this.model.find({ userId }).sort({ createdAt: -1 }).limit(100).exec();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.model.countDocuments({ userId, read: false });
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const result = await this.model.updateOne(
      { _id: notificationId, userId },
      { $set: { read: true } },
    );
    if (result.matchedCount === 0) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.model.updateMany({ userId, read: false }, { $set: { read: true } });
  }
}
