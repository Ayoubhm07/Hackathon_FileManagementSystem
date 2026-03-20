import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { KafkaConsumerService } from './kafka.consumer';
import { DocflowNotification, NotificationSchema } from './notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocflowNotification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway, KafkaConsumerService],
})
export class NotificationModule {}
