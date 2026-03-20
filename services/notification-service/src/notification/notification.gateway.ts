import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  transports: ['websocket', 'polling'],
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(NotificationGateway.name);

  handleConnection(client: Socket): void {
    const userId = (client.handshake.auth?.userId ?? client.handshake.query['userId']) as string | undefined;
    if (userId) {
      void client.join(`user:${userId}`);
      this.logger.log(`WS connected: userId=${userId} id=${client.id}`);
    } else {
      this.logger.warn(`WS connected without userId: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`WS disconnected: ${client.id}`);
  }

  emitToUser(userId: string, notification: unknown): void {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
    this.logger.log(`Emitted notification:new → user:${userId}`);
  }
}
