import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwksRsa from 'jwks-rsa';

@Injectable()
export class JwksService implements OnModuleInit {
  private readonly logger = new Logger(JwksService.name);
  private client!: jwksRsa.JwksClient;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const keycloakUrl = this.configService.getOrThrow<string>('KEYCLOAK_URL');
    const realm = this.configService.getOrThrow<string>('KEYCLOAK_REALM');
    const jwksUri = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`;
    this.logger.log(`Initializing JWKS client: ${jwksUri}`);
    this.client = jwksRsa({
      jwksUri,
      cache: true,
      cacheMaxAge: 600000,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
    });
  }

  async getSigningKey(kid: string): Promise<string> {
    const key = await this.client.getSigningKey(kid);
    return key.getPublicKey();
  }
}
