import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  async markAsRead(userId: string, id: string) {
    return this.prisma.notification.update({ where: { id, userId }, data: { isRead: true } });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
    return { message: 'All marked as read' };
  }

  async remove(userId: string, id: string) {
    await this.prisma.notification.delete({ where: { id, userId } });
    return { message: 'Notification deleted' };
  }

  async create(userId: string, title: string, body: string, type: any) {
    return this.prisma.notification.create({ data: { userId, title, body, type } });
    // In production: Also send push notification via Expo
  }
}
