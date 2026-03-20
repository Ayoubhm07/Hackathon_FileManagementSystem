import { Controller, Get, Patch, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  async getNotifications(@Query('userId') userId: string) {
    const [notifications, unreadCount] = await Promise.all([
      this.service.getByUser(userId),
      this.service.getUnreadCount(userId),
    ]);
    return { notifications, unreadCount };
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllAsRead(@Query('userId') userId: string): Promise<void> {
    await this.service.markAllAsRead(userId);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAsRead(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ): Promise<void> {
    await this.service.markAsRead(id, userId);
  }
}
