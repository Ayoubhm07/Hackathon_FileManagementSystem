import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  await app.register(require('@fastify/multipart'), {
    limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);

  await app.listen(port, '0.0.0.0');
  logger.log(`Upload service running on port ${port}`);
}

void bootstrap();
