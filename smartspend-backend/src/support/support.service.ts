import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async getTickets(userId: string) {
    return this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async createTicket(userId: string, dto: any) {
    return this.prisma.supportTicket.create({
      data: { userId, subject: dto.subject, message: dto.message, type: dto.type || 'contact_us', attachmentUrl: dto.attachmentUrl || null },
    });
  }

  async replyTicket(userId: string, ticketId: string, dto: any) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId, userId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    
    await this.prisma.supportTicket.update({ where: { id: ticketId }, data: { status: 'OPEN' } });
    
    return this.prisma.ticketReply.create({
      data: { ticketId, authorId: userId, message: dto.message, isAdmin: false },
    });
  }
}
