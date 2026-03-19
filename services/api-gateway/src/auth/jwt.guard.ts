import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwksService } from './jwks.service';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  sub: string;
  realm_access?: { roles?: string[] };
  preferred_username?: string;
  exp: number;
}

@Injectable()
export class JwtGuard implements CanActivate {
  private readonly logger = new Logger(JwtGuard.name);

  constructor(private readonly jwksService: JwksService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.slice(7);
    try {
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
        throw new UnauthorizedException('Invalid token format');
      }

      const publicKey = await this.jwksService.getSigningKey(decoded.header.kid);
      const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as JwtPayload;

      request.headers['x-user-id'] = payload.sub;
      const roles = payload.realm_access?.roles ?? [];
      request.headers['x-user-role'] = roles.find((r) => r.startsWith('ROLE_')) ?? '';
      request.headers['x-user-name'] = payload.preferred_username ?? '';

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token validation failed';
      this.logger.warn(`JWT validation failed: ${message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
