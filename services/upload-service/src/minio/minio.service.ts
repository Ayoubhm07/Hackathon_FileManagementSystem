import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { Readable } from 'stream';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client!: Client;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    this.client = new Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'minio'),
      port: parseInt(this.configService.get<string>('MINIO_PORT', '9000'), 10),
      useSSL: this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.getOrThrow<string>('MINIO_ACCESS_KEY'),
      secretKey: this.configService.getOrThrow<string>('MINIO_SECRET_KEY'),
    });
    for (const bucket of ['raw', 'clean', 'curated']) {
      const exists = await this.client.bucketExists(bucket);
      if (!exists) {
        await this.client.makeBucket(bucket);
        this.logger.log(`Created bucket: ${bucket}`);
      }
    }
  }

  async uploadToRaw(path: string, buffer: Buffer, contentType: string): Promise<void> {
    await this.client.putObject('raw', path, buffer, buffer.length, { 'Content-Type': contentType });
  }
}
