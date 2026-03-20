import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit {
  private readonly logger = new Logger(KafkaProducerService.name);
  private producer!: Producer;
  private connected = false;

  constructor(private readonly config: ConfigService) {
    const broker = config.get<string>('KAFKA_BROKER', 'kafka:9092');
    const kafka = new Kafka({
      clientId: 'validation-service',
      brokers: [broker],
      retry: { retries: 5, initialRetryTime: 2000 },
    });
    this.producer = kafka.producer();
  }

  onModuleInit(): void {
    // Run in background — do not block NestJS startup
    this.connectWithRetry().catch(err =>
      this.logger.error(`Kafka producer fatal: ${(err as Error).message}`),
    );
  }

  private async connectWithRetry(attempt = 1): Promise<void> {
    try {
      await this.producer.connect();
      this.connected = true;
      this.logger.log('Kafka producer connected');
    } catch (err) {
      this.logger.warn(`Kafka connect failed (attempt ${attempt}): ${(err as Error).message}`);
      if (attempt <= 8) {
        await new Promise<void>(r => setTimeout(r, Math.min(attempt * 3000, 20_000)));
        await this.connectWithRetry(attempt + 1);
      } else {
        this.logger.error('Kafka producer gave up — notifications will be skipped');
      }
    }
  }

  async publish(topic: string, message: object): Promise<void> {
    if (!this.connected) {
      this.logger.warn(`Kafka not connected — skipping publish to ${topic}`);
      return;
    }
    try {
      await this.producer.send({ topic, messages: [{ value: JSON.stringify(message) }] });
      this.logger.log(`Published to ${topic}`);
    } catch (err) {
      this.logger.error(`Kafka publish failed: ${(err as Error).message}`);
    }
  }
}
