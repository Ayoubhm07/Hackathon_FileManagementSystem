import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer } from 'kafkajs';
import { NotificationService, ValidationEvent } from './notification.service';

@Injectable()
export class KafkaConsumerService implements OnModuleInit {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private consumer!: Consumer;

  constructor(
    private readonly config: ConfigService,
    private readonly notificationService: NotificationService,
  ) {}

  onModuleInit(): void {
    const broker = this.config.get<string>('KAFKA_BROKER', 'kafka:9092');
    const kafka = new Kafka({
      clientId: 'notification-service',
      brokers: [broker],
      retry: { retries: 8, initialRetryTime: 3000 },
    });
    this.consumer = kafka.consumer({ groupId: 'notification-group' });
    // Run in background — do not block NestJS startup
    this.connectWithRetry().catch(err =>
      this.logger.error(`Kafka consumer fatal: ${(err as Error).message}`),
    );
  }

  private async connectWithRetry(attempt = 1): Promise<void> {
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: 'document.validated', fromBeginning: false });
      await this.consumer.run({
        eachMessage: async ({ message }) => {
          if (!message.value) return;
          try {
            const event = JSON.parse(message.value.toString()) as ValidationEvent;
            await this.notificationService.processValidationEvent(event);
          } catch (err) {
            this.logger.error(`Failed to process message: ${(err as Error).message}`);
          }
        },
      });
      this.logger.log('Kafka consumer connected → listening on document.validated');
    } catch (err) {
      this.logger.warn(`Kafka connect failed (attempt ${attempt}): ${(err as Error).message}`);
      if (attempt <= 12) {
        await new Promise<void>(r => setTimeout(r, Math.min(attempt * 3000, 30_000)));
        await this.connectWithRetry(attempt + 1);
      } else {
        this.logger.error('Kafka consumer gave up after 12 attempts');
      }
    }
  }
}
