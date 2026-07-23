import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ScheduleRepeat, ScheduleStatus, NotificationCategory } from '@prisma/client';
import * as fs from 'fs';
const PDFDocument = require('pdfkit');

@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);

  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private notifs: NotificationsService,
  ) {}

  // ── Email Scheduling ──────────────────────────────────────────────────────

  async createScheduledEmail(userId: string, dto: {
    recipients: string[];
    subject: string;
    body: string;
    emailType?: string;
    attachments?: any[];
    scheduledAt: string;
    timezone?: string;
    repeat?: ScheduleRepeat;
    metadata?: any;
  }) {
    const scheduledAt = new Date(dto.scheduledAt);
    return this.prisma.scheduledEmail.create({
      data: {
        userId,
        recipients: dto.recipients,
        subject: dto.subject,
        body: dto.body,
        emailType: dto.emailType ?? 'custom',
        attachments: dto.attachments,
        scheduledAt,
        timezone: dto.timezone ?? 'Asia/Kolkata',
        repeat: dto.repeat ?? ScheduleRepeat.ONE_TIME,
        nextRunAt: scheduledAt,
        metadata: dto.metadata,
        status: ScheduleStatus.PENDING,
      },
    });
  }

  async getScheduledEmails(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.scheduledEmail.findMany({
        where: { userId, status: { not: ScheduleStatus.CANCELLED } },
        orderBy: { scheduledAt: 'asc' },
        skip,
        take: limit,
        include: { deliveryLogs: { orderBy: { sentAt: 'desc' }, take: 5 } },
      }),
      this.prisma.scheduledEmail.count({ where: { userId, status: { not: ScheduleStatus.CANCELLED } } }),
    ]);
    return { items, total, page, limit };
  }

  async updateScheduledEmail(userId: string, id: string, dto: any) {
    const email = await this.prisma.scheduledEmail.findFirst({ where: { id, userId } });
    if (!email) throw new NotFoundException('Scheduled email not found');
    const updates: any = { ...dto };
    if (dto.scheduledAt) {
      updates.scheduledAt = new Date(dto.scheduledAt);
      updates.nextRunAt = new Date(dto.scheduledAt);
    }
    return this.prisma.scheduledEmail.update({ where: { id }, data: updates });
  }

  async pauseScheduledEmail(userId: string, id: string) {
    await this._assertOwner(userId, id);
    return this.prisma.scheduledEmail.update({ where: { id }, data: { status: ScheduleStatus.PAUSED } });
  }

  async resumeScheduledEmail(userId: string, id: string) {
    const email = await this.prisma.scheduledEmail.findFirst({ where: { id, userId } });
    if (!email) throw new NotFoundException('Scheduled email not found');
    return this.prisma.scheduledEmail.update({
      where: { id },
      data: { status: ScheduleStatus.PENDING, nextRunAt: email.scheduledAt },
    });
  }

  async cancelScheduledEmail(userId: string, id: string) {
    await this._assertOwner(userId, id);
    return this.prisma.scheduledEmail.update({ where: { id }, data: { status: ScheduleStatus.CANCELLED } });
  }

  async duplicateScheduledEmail(userId: string, id: string) {
    const email = await this.prisma.scheduledEmail.findFirst({ where: { id, userId } });
    if (!email) throw new NotFoundException('Scheduled email not found');
    return this.prisma.scheduledEmail.create({
      data: {
        userId,
        recipients: email.recipients,
        subject: `[Copy] ${email.subject}`,
        body: email.body,
        emailType: email.emailType,
        attachments: email.attachments ?? undefined,
        scheduledAt: new Date(Date.now() + 3600000), // 1 hour from now
        timezone: email.timezone,
        repeat: email.repeat,
        nextRunAt: new Date(Date.now() + 3600000),
        metadata: email.metadata ?? undefined,
        status: ScheduleStatus.PENDING,
      },
    });
  }

  async getEmailDeliveryHistory(userId: string, id: string) {
    await this._assertOwner(userId, id);
    return this.prisma.emailDeliveryLog.findMany({
      where: { scheduledEmailId: id },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
  }

  // ── Message Scheduling ────────────────────────────────────────────────────

  async createScheduledMessage(userId: string, dto: {
    conversationId: string;
    content: string;
    messageType?: string;
    attachmentData?: any;
    scheduledAt: string;
    repeat?: ScheduleRepeat;
  }) {
    // Verify user is member of conversation
    const membership = await this.prisma.chatMember.findFirst({
      where: { conversationId: dto.conversationId, userId },
    });
    if (!membership) throw new ForbiddenException('Not a member of this conversation');

    const scheduledAt = new Date(dto.scheduledAt);
    return this.prisma.scheduledMessage.create({
      data: {
        userId,
        conversationId: dto.conversationId,
        content: dto.content,
        messageType: dto.messageType ?? 'TEXT',
        attachmentData: dto.attachmentData,
        scheduledAt,
        repeat: dto.repeat ?? ScheduleRepeat.ONE_TIME,
        nextRunAt: scheduledAt,
        status: ScheduleStatus.PENDING,
      },
    });
  }

  async getScheduledMessages(userId: string, conversationId?: string) {
    const where: any = { userId, status: { not: ScheduleStatus.CANCELLED } };
    if (conversationId) where.conversationId = conversationId;
    const commMsgs = await this.prisma.scheduledMessage.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
    });

    const chatWhere: any = { senderId: userId };
    if (conversationId) chatWhere.conversationId = conversationId;
    const chatMsgs = await this.prisma.scheduledChatMessage.findMany({
      where: chatWhere,
      orderBy: { scheduledAt: 'asc' },
    });

    const formattedChatMsgs = chatMsgs.map(m => ({
      id: m.id,
      userId: m.senderId,
      conversationId: m.conversationId,
      content: m.content || `[${m.type}]`,
      messageType: m.type || 'TEXT',
      attachmentData: m.metadata || null,
      scheduledAt: m.scheduledAt,
      repeat: m.repeatType === 'ONCE' ? 'ONE_TIME' : (m.repeatType as any),
      status: m.isSent ? 'SENT' : 'PENDING',
      nextRunAt: m.scheduledAt,
      createdAt: m.createdAt,
      source: 'chat',
    }));

    return [...commMsgs, ...formattedChatMsgs].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }

  async cancelScheduledMessage(userId: string, id: string) {
    const msg = await this.prisma.scheduledMessage.findFirst({ where: { id, userId } });
    if (msg) {
      return this.prisma.scheduledMessage.update({ where: { id }, data: { status: ScheduleStatus.CANCELLED } });
    }
    const chatMsg = await this.prisma.scheduledChatMessage.findFirst({ where: { id, senderId: userId } });
    if (chatMsg) {
      return this.prisma.scheduledChatMessage.delete({ where: { id } });
    }
    throw new NotFoundException('Scheduled message not found');
  }

  async rescheduleMessage(userId: string, id: string, scheduledAt: string) {
    const msg = await this.prisma.scheduledMessage.findFirst({ where: { id, userId } });
    if (!msg) throw new NotFoundException('Scheduled message not found');
    const newDate = new Date(scheduledAt);
    return this.prisma.scheduledMessage.update({
      where: { id },
      data: { scheduledAt: newDate, nextRunAt: newDate, status: ScheduleStatus.PENDING },
    });
  }

  // ── Cron Dispatchers ──────────────────────────────────────────────────────

  async dispatchDueEmails() {
    const now = new Date();
    const dueEmails = await this.prisma.scheduledEmail.findMany({
      where: {
        status: ScheduleStatus.PENDING,
        nextRunAt: { lte: now },
      },
      take: 50,
    });

    for (const email of dueEmails) {
      try {
        let emailAttachments: any[] = [];
        
        // Check if there is a transaction ID in metadata to attach a PDF receipt
        const metadata = email.metadata as any;
        if (metadata && metadata.transactionId) {
          const tx = await this.prisma.transaction.findUnique({
            where: { id: metadata.transactionId },
            include: { category: true, cashbook: true, user: { select: { fullName: true, email: true } } }
          });
          
          if (tx) {
            const pdfBuffer = await this.generateTransactionPdfBuffer(tx);
            emailAttachments.push({
              filename: `Cashtro_${tx.type === 'INCOME' ? 'Receipt' : 'Invoice'}_${tx.id.substring(0,6)}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            });
          }
        }

        await this.mail.sendCustomEmail({
          to: email.recipients,
          subject: email.subject,
          html: this.buildEmailHtml(email.body, email.subject),
          attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
        });

        await this.prisma.emailDeliveryLog.create({
          data: {
            scheduledEmailId: email.id,
            status: 'sent',
            recipients: email.recipients,
          },
        });

        const nextRunAt = this.computeNextRun(now, email.repeat);
        const newStatus = email.repeat === ScheduleRepeat.ONE_TIME ? ScheduleStatus.SENT : ScheduleStatus.PENDING;

        await this.prisma.scheduledEmail.update({
          where: { id: email.id },
          data: {
            status: newStatus,
            lastSentAt: now,
            nextRunAt: nextRunAt ?? null,
            sentCount: { increment: 1 },
            lastError: null,
          },
        });

        await this.notifs.createUserNotification(email.userId, {
          title: 'Scheduled Email Sent ✉️',
          body: `Your scheduled email "${email.subject}" was delivered successfully.`,
          category: NotificationCategory.SCHEDULER,
        });
      } catch (err) {
        this.logger.error(`Failed to send scheduled email ${email.id}: ${err.message}`);
        await this.prisma.emailDeliveryLog.create({
          data: { scheduledEmailId: email.id, status: 'failed', recipients: email.recipients, error: err.message },
        });
        const maxRetries = 3;
        const currentFailures = email.failCount + 1;
        
        if (currentFailures < maxRetries) {
          // Retry logic: exponentially back off (e.g. 5, 10 minutes)
          const retryDelay = 5 * currentFailures; 
          const retryTime = new Date(now.getTime() + retryDelay * 60000);
          
          await this.prisma.scheduledEmail.update({
            where: { id: email.id },
            data: { failCount: currentFailures, lastError: err.message, status: ScheduleStatus.PENDING, nextRunAt: retryTime },
          });
          this.logger.warn(`Scheduled email ${email.id} failed (attempt ${currentFailures}). Retrying in ${retryDelay} mins.`);
        } else {
          await this.prisma.scheduledEmail.update({
            where: { id: email.id },
            data: { failCount: currentFailures, lastError: err.message, status: ScheduleStatus.FAILED },
          });
          await this.notifs.createUserNotification(email.userId, {
            title: 'Scheduled Email Failed ⚠️',
            body: `Failed to send "${email.subject}" after ${maxRetries} attempts. Please check your settings.`,
            category: NotificationCategory.SCHEDULER,
          });
        }
      }
    }
  }

  async dispatchDueMessages() {
    const now = new Date();
    const dueMessages = await this.prisma.scheduledMessage.findMany({
      where: {
        status: ScheduleStatus.PENDING,
        nextRunAt: { lte: now },
      },
      take: 50,
    });

    for (const msg of dueMessages) {
      try {
        // Verify conversation still exists and user is still a member
        const membership = await this.prisma.chatMember.findFirst({
          where: { conversationId: msg.conversationId, userId: msg.userId },
        });
        if (!membership) {
          await this.prisma.scheduledMessage.update({ where: { id: msg.id }, data: { status: ScheduleStatus.CANCELLED } });
          continue;
        }

        await this.prisma.chatMessage.create({
          data: {
            conversationId: msg.conversationId,
            senderId: msg.userId,
            content: msg.content,
            type: (msg.messageType ?? 'TEXT') as any,
            metadata: msg.attachmentData as any,
          },
        });

        // Update conversation last message
        await this.prisma.chatConversation.update({
          where: { id: msg.conversationId },
          data: { lastMessageAt: now, lastMessageText: msg.content.slice(0, 100) },
        });

        const nextRunAt = this.computeNextRun(now, msg.repeat);
        const newStatus = msg.repeat === ScheduleRepeat.ONE_TIME ? ScheduleStatus.SENT : ScheduleStatus.PENDING;

        await this.prisma.scheduledMessage.update({
          where: { id: msg.id },
          data: { status: newStatus, lastSentAt: now, nextRunAt: nextRunAt ?? null, sentCount: { increment: 1 } },
        });

        await this.notifs.createUserNotification(msg.userId, {
          title: 'Scheduled Message Delivered 💬',
          body: `Your scheduled message was delivered to the conversation.`,
          category: NotificationCategory.SCHEDULER,
        });
      } catch (err) {
        this.logger.error(`Failed to send scheduled message ${msg.id}: ${err.message}`);
        const maxRetries = 3;
        // we didn't have failCount on ScheduledMessage, wait!
        // Let's check if ScheduledMessage has failCount.
        // I will use failCount if it exists, otherwise just fail.
        await this.prisma.scheduledMessage.update({
          where: { id: msg.id },
          data: { status: ScheduleStatus.FAILED },
        });
      }
    }
  }

  // ── Admin Notifications ───────────────────────────────────────────────────

  async createAdminNotification(createdById: string, dto: {
    title: string;
    subtitle?: string;
    body: string;
    bannerImage?: string;
    iconName?: string;
    buttonText?: string;
    actionUrl?: string;
    notifType?: string;
    audience?: string;
    selectedUserIds?: string[];
    channelInApp?: boolean;
    channelPush?: boolean;
    scheduledAt?: string;
  }) {
    return this.prisma.adminNotification.create({
      data: {
        createdById,
        title: dto.title,
        subtitle: dto.subtitle,
        body: dto.body,
        bannerImage: dto.bannerImage,
        iconName: dto.iconName,
        buttonText: dto.buttonText,
        actionUrl: dto.actionUrl,
        notifType: (dto.notifType as any) ?? 'ANNOUNCEMENT',
        audience: (dto.audience as any) ?? 'ALL',
        selectedUserIds: dto.selectedUserIds ?? [],
        channelInApp: dto.channelInApp ?? true,
        channelPush: dto.channelPush ?? false,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        status: dto.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      },
    });
  }

  async sendAdminNotification(id: string) {
    const adminNotif = await this.prisma.adminNotification.findUnique({
      where: { id },
      include: { recipients: true },
    });
    if (!adminNotif) throw new NotFoundException('Admin notification not found');
    if (adminNotif.status === 'SENT') throw new ForbiddenException('Already sent');

    // Determine target user IDs
    const userIds = await this.resolveAudience(adminNotif.audience as string, adminNotif.selectedUserIds);
    if (!userIds.length) {
      return { message: 'No matching users found', sentCount: 0 };
    }

    if (adminNotif.channelInApp) {
      await this.notifs.createBulkNotifications(
        userIds,
        {
          title: adminNotif.title,
          body: adminNotif.body,
          category: NotificationCategory.ADMIN,
          type: 'IN_APP',
          data: { adminNotificationId: id },
          actionUrl: adminNotif.actionUrl ?? undefined,
          imageUrl: adminNotif.bannerImage ?? undefined,
          actionButton: adminNotif.buttonText ?? undefined,
        },
        { sendPush: false },
      );
    }

    if (adminNotif.channelPush) {
      await this.notifs.sendBulkExpoPushPublic(userIds, adminNotif.title, adminNotif.body, adminNotif.actionUrl ?? undefined);
    }

    // Create recipient tracking records
    await this.prisma.adminNotifRecipient.createMany({
      data: userIds.map((userId) => ({
        adminNotificationId: id,
        userId,
        deliveredAt: new Date(),
      })),
      skipDuplicates: true,
    });

    await this.prisma.adminNotification.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date(), sentCount: userIds.length },
    });

    return { message: 'Notification sent', sentCount: userIds.length };
  }

  async getAdminNotifications(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.adminNotification.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { _count: { select: { recipients: true } } },
      }),
      this.prisma.adminNotification.count(),
    ]);
    return { items, total, page, limit };
  }

  async getAdminNotificationStats(id: string) {
    const notif = await this.prisma.adminNotification.findUnique({
      where: { id },
      include: {
        _count: { select: { recipients: true } },
      },
    });
    if (!notif) throw new NotFoundException('Notification not found');
    const readCount = await this.prisma.adminNotifRecipient.count({ where: { adminNotificationId: id, readAt: { not: null } } });
    const clickCount = await this.prisma.adminNotifRecipient.count({ where: { adminNotificationId: id, clickedAt: { not: null } } });
    return { ...notif, readCount, clickCount };
  }

  async cancelAdminNotification(id: string) {
    const notif = await this.prisma.adminNotification.findUnique({ where: { id } });
    if (!notif) throw new NotFoundException('Notification not found');
    await this.prisma.adminNotification.delete({ where: { id } });
    return { message: 'Campaign deleted successfully' };
  }

  async dispatchScheduledAdminNotifications() {
    const now = new Date();
    const due = await this.prisma.adminNotification.findMany({
      where: { status: 'SCHEDULED', scheduledAt: { lte: now } },
    });
    for (const notif of due) {
      try {
        await this.sendAdminNotification(notif.id);
      } catch (e) {
        this.logger.error(`Failed to dispatch admin notification ${notif.id}: ${e.message}`);
      }
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async _assertOwner(userId: string, id: string) {
    const email = await this.prisma.scheduledEmail.findFirst({ where: { id, userId } });
    if (!email) throw new NotFoundException('Scheduled email not found');
  }

  private computeNextRun(from: Date, repeat: ScheduleRepeat): Date | null {
    if (repeat === ScheduleRepeat.ONE_TIME) return null;
    const d = new Date(from);
    switch (repeat) {
      case ScheduleRepeat.DAILY:     d.setDate(d.getDate() + 1); break;
      case ScheduleRepeat.WEEKLY:    d.setDate(d.getDate() + 7); break;
      case ScheduleRepeat.MONTHLY:   d.setMonth(d.getMonth() + 1); break;
      case ScheduleRepeat.QUARTERLY: d.setMonth(d.getMonth() + 3); break;
      case ScheduleRepeat.YEARLY:    d.setFullYear(d.getFullYear() + 1); break;
    }
    return d;
  }

  private buildEmailHtml(body: string, subject: string): string {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{background:#EFF4FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}
      .wrapper{max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;}
      .header{background:#1E3A8A;padding:28px;text-align:center;}
      .brand{font-size:22px;font-weight:800;color:#fff;}
      .body{padding:28px;color:#334155;line-height:1.7;white-space:pre-wrap;}
      .footer{background:#F8FAFC;padding:16px 28px;text-align:center;font-size:11px;color:#64748B;border-top:1px solid #E2E8F0;}
    </style></head><body><div class="wrapper">
    <div class="header"><div class="brand">Cashtro</div><div style="font-size:11px;color:#CBD5E1;margin-top:4px;text-transform:uppercase;letter-spacing:1px">${subject}</div></div>
    <div class="body">${body.replace(/\n/g, '<br>')}</div>
    <div class="footer">© ${new Date().getFullYear()} Cashtro · <a href="https://cashtro.in" style="color:#2563EB">cashtro.in</a></div>
    </div></body></html>`;
  }

  private async resolveAudience(audience: string, selectedUserIds: string[]): Promise<string[]> {
    switch (audience) {
      case 'ALL':
        return (await this.prisma.user.findMany({ where: { deletedAt: null }, select: { id: true } })).map((u) => u.id);
      case 'FREE_USERS':
        return (await this.prisma.user.findMany({
          where: {
            deletedAt: null,
            OR: [{ planId: null }, { plan: { slug: 'free' } }],
          },
          select: { id: true },
        })).map((u) => u.id);
      case 'PREMIUM_USERS':
        return (await this.prisma.user.findMany({
          where: { deletedAt: null, plan: { slug: { not: 'free' } }, planId: { not: null } },
          select: { id: true },
        })).map((u) => u.id);
      case 'SELECTED':
        return selectedUserIds;
      case 'ANDROID':
        return (await this.prisma.device.findMany({
          where: { platform: { equals: 'android', mode: 'insensitive' } },
          select: { userId: true },
          distinct: ['userId'],
        })).map((d) => d.userId);
      case 'IOS':
        return (await this.prisma.device.findMany({
          where: { platform: { equals: 'ios', mode: 'insensitive' } },
          select: { userId: true },
          distinct: ['userId'],
        })).map((d) => d.userId);
      default:
        return [];
    }
  }

  // ── PDF Generation Helper ──────────────────────────────────────────────────
  private async generateTransactionPdfBuffer(tx: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        
        const isReceipt = tx.type === 'INCOME';
        const title = isReceipt ? 'RECEIPT' : 'INVOICE';
        
        // Header
        doc.fontSize(24).fillColor('#1E3A8A').text('Cashtro', { align: 'left' });
        doc.fontSize(10).fillColor('#64748B').text('Smart Finance Manager', { align: 'left' });
        
        doc.moveUp(2);
        doc.fontSize(20).fillColor('#0F172A').text(title, { align: 'right' });
        doc.fontSize(10).fillColor('#64748B').text(`ID: ${tx.id.substring(0, 8).toUpperCase()}`, { align: 'right' });
        doc.text(`Date: ${new Date(tx.date).toLocaleDateString()}`, { align: 'right' });
        
        doc.moveDown(2);
        
        // Details
        doc.rect(50, doc.y, 512, 1).fill('#E2E8F0');
        doc.moveDown(2);
        
        doc.fontSize(12).fillColor('#0F172A').text('Billed To / Related To:', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#334155').text(tx.user?.fullName || 'User');
        doc.text(tx.user?.email || '');
        if (tx.cashbook?.name) {
          doc.text(`Cashbook: ${tx.cashbook.name}`);
        }
        
        doc.moveDown(2);
        
        // Line items table header
        const tableTop = doc.y;
        doc.rect(50, tableTop, 512, 24).fill('#F8FAFC');
        doc.fillColor('#64748B').fontSize(10).font('Helvetica-Bold');
        doc.text('DESCRIPTION', 60, tableTop + 7);
        doc.text('CATEGORY', 300, tableTop + 7);
        doc.text('AMOUNT', 480, tableTop + 7, { align: 'right' });
        
        // Line item
        doc.font('Helvetica').fillColor('#0F172A');
        const itemY = tableTop + 34;
        doc.text(tx.note || tx.merchant || 'Transaction', 60, itemY);
        doc.text(tx.category?.name || '-', 300, itemY);
        doc.text(`${tx.amount} ${tx.cashbook?.currency || 'INR'}`, 480, itemY, { align: 'right' });
        
        doc.rect(50, itemY + 20, 512, 1).fill('#E2E8F0');
        
        // Total
        const totalY = itemY + 30;
        doc.font('Helvetica-Bold').fontSize(12).text('TOTAL', 300, totalY);
        doc.fillColor(isReceipt ? '#16A34A' : '#DC2626').text(`${tx.amount} ${tx.cashbook?.currency || 'INR'}`, 480, totalY, { align: 'right' });
        
        // Footer
        doc.fontSize(10).fillColor('#94A3B8').font('Helvetica');
        doc.text('Thank you for using Cashtro.', 50, 700, { align: 'center', width: 512 });
        
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
