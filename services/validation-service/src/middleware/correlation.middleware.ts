import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    const correlationId = (req.headers['x-correlation-id'] as string) ?? uuidv4();
    res.setHeader('x-correlation-id', correlationId);
    next();
  }
}
