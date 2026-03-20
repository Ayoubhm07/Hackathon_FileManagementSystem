import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function registerWithEureka(appName: string, port: number): Promise<void> {
  const logger = new Logger('Eureka');
  const eurekaUrl = process.env.EUREKA_URL ?? 'http://eureka-server:8761/eureka';
  const instanceId = `${appName.toLowerCase()}:${port}`;
  const hostname = appName.toLowerCase();
  const body = {
    instance: {
      instanceId,
      app: appName.toUpperCase(),
      hostName: hostname,
      ipAddr: hostname,
      status: 'UP',
      port: { $: port, '@enabled': 'true' },
      vipAddress: hostname,
      dataCenterInfo: {
        '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
        name: 'MyOwn',
      },
      healthCheckUrl: `http://${hostname}:${port}/health`,
      statusPageUrl: `http://${hostname}:${port}/health`,
    },
  };

  const register = async (): Promise<void> => {
    try {
      const res = await fetch(`${eurekaUrl}/apps/${appName.toUpperCase()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 204) logger.log(`Registered with Eureka as ${appName.toUpperCase()}`);
    } catch {
      logger.warn('Eureka unavailable — will retry in 30s');
    }
  };

  const heartbeat = async (): Promise<void> => {
    try {
      await fetch(`${eurekaUrl}/apps/${appName.toUpperCase()}/${instanceId}`, { method: 'PUT' });
    } catch { /* silent */ }
  };

  setTimeout(async () => {
    await register();
    setInterval(heartbeat, 30_000);
  }, 15_000);
}

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
  void registerWithEureka('upload-service', port);
}

void bootstrap();
