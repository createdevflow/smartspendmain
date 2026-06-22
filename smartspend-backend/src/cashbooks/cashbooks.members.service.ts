import {
  Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { randomBytes } from 'crypto';

@Injectable()
export class CashbookMembersService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  // ── Check if user is owner of a cashbook ──────────────────────────────────
  private async assertOwner(userId: string, cashbookId: string) {
    const book = await this.prisma.cashbook.findFirst({
      where: { id: cashbookId, userId, deletedAt: null },
    });
    if (!book) throw new ForbiddenException('You are not the owner of this cashbook');
    return book;
  }

  // ── Check global feature flag ──────────────────────────────────────────────
  private async assertFeatureEnabled() {
    // Fixed: use appConfig instead of the non-existent systemSetting
    const setting = await this.prisma.appConfig.findUnique({
      where: { key: 'feature_shared_cashbooks_active' },
    });
    if (setting?.value === 'false') {
      throw new ForbiddenException('Shared cashbooks feature is currently disabled');
    }
  }

  // ── List members of a cashbook ─────────────────────────────────────────────
  async getMembers(userId: string, cashbookId: string) {
    const book = await this.prisma.cashbook.findFirst({
      where: { id: cashbookId, deletedAt: null },
    });
    if (!book) throw new NotFoundException('Cashbook not found');

    const isMember = book.userId === userId || await this.prisma.cashbookMember.findFirst({
      where: { cashbookId, userId, status: 'accepted' },
    });
    if (!isMember) throw new ForbiddenException('Access denied');

    const members = await this.prisma.cashbookMember.findMany({
      where: { cashbookId },
      include: { user: { select: { id: true, fullName: true, email: true, avatar: true } } },
      orderBy: { invitedAt: 'asc' },
    });

    const owner = await this.prisma.user.findUnique({
      where: { id: book.userId },
      select: { id: true, fullName: true, email: true, avatar: true },
    });

    return {
      owner: { ...owner, role: 'OWNER' },
      members,
    };
  }

  // ── Invite a member ────────────────────────────────────────────────────────
  async inviteMember(userId: string, cashbookId: string, dto: { email: string; role: 'EDITOR' | 'VIEWER' }) {
    await this.assertFeatureEnabled();
    const book = await this.assertOwner(userId, cashbookId);

    const inviter = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, fullName: true } });
    if (inviter?.email.toLowerCase() === dto.email.toLowerCase()) {
      throw new BadRequestException('You cannot invite yourself');
    }

    const existing = await this.prisma.cashbookMember.findUnique({
      where: { cashbookId_email: { cashbookId, email: dto.email } },
    });
    const token = randomBytes(32).toString('hex');
    const targetUser = await this.prisma.user.findUnique({ where: { email: dto.email } });

    let member;
    if (existing) {
      if (existing.status === 'accepted') throw new ConflictException('This user is already a member');
      member = await this.prisma.cashbookMember.update({
        where: { id: existing.id },
        data: { role: dto.role as any, inviteToken: token, invitedAt: new Date() },
      });
    } else {
      member = await this.prisma.cashbookMember.create({
        data: {
          cashbookId,
          email: dto.email,
          role: dto.role as any,
          inviteToken: token,
          userId: targetUser?.id,
        },
      });
    }

    const inviteLink = `https://cashtro.in/join/${token}`;

    if (targetUser) {
      await this.prisma.notification.create({
        data: {
          userId: targetUser.id,
          type: 'IN_APP',
          title: 'Cashbook Invite',
          body: `${inviter?.fullName || 'Someone'} invited you to join '${book.name}' as a ${dto.role.toLowerCase()}.`,
          data: { cashbookId, token },
          actionUrl: inviteLink,
        },
      });
    }

    // Send email invite (non-fatal if it fails)
    await this.sendInviteEmail(dto.email, inviter?.fullName || 'Someone', book.name, inviteLink);

    return { message: 'Invite sent', token };
  }

  // ── Create generic invite link ─────────────────────────────────────────────
  async createInviteLink(userId: string, cashbookId: string) {
    await this.assertFeatureEnabled();
    await this.assertOwner(userId, cashbookId);

    const token = randomBytes(16).toString('hex');

    await this.prisma.cashbookMember.create({
      data: {
        cashbookId,
        email: `link_${token}@shared.local`,
        role: 'VIEWER',
        inviteToken: token,
      },
    });

    // Return a proper HTTPS domain link — not a deep link
    return { token, link: `https://cashtro.in/join/${token}` };
  }

  // ── Accept invite via token ────────────────────────────────────────────────
  async acceptInvite(userId: string, token: string) {
    const member = await this.prisma.cashbookMember.findUnique({ where: { inviteToken: token } });
    if (!member) throw new NotFoundException('Invalid or expired invite link');
    if (member.status === 'accepted') throw new ConflictException('Invite already accepted');

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    const isGenericLink = member.email.startsWith('link_') && member.email.endsWith('@shared.local');

    if (!isGenericLink && member.email.toLowerCase() !== user?.email?.toLowerCase()) {
      throw new ForbiddenException('This invite was sent to a different email address');
    }

    await this.prisma.cashbookMember.update({
      where: { id: member.id },
      data: { userId, status: 'accepted', acceptedAt: new Date(), inviteToken: null },
    });

    return { message: 'You have joined the cashbook', cashbookId: member.cashbookId };
  }

  // ── Remove a member ────────────────────────────────────────────────────────
  async removeMember(userId: string, cashbookId: string, memberId: string) {
    await this.assertOwner(userId, cashbookId);
    const member = await this.prisma.cashbookMember.findFirst({ where: { id: memberId, cashbookId } });
    if (!member) throw new NotFoundException('Member not found');
    await this.prisma.cashbookMember.delete({ where: { id: memberId } });
    return { message: 'Member removed' };
  }

  // ── Update member role ─────────────────────────────────────────────────────
  async updateMemberRole(userId: string, cashbookId: string, memberId: string, role: 'EDITOR' | 'VIEWER') {
    await this.assertOwner(userId, cashbookId);
    const member = await this.prisma.cashbookMember.findFirst({ where: { id: memberId, cashbookId } });
    if (!member) throw new NotFoundException('Member not found');
    return this.prisma.cashbookMember.update({ where: { id: memberId }, data: { role: role as any } });
  }

  // ── Leave a shared cashbook ────────────────────────────────────────────────
  async leaveBook(userId: string, cashbookId: string) {
    const member = await this.prisma.cashbookMember.findFirst({ where: { cashbookId, userId } });
    if (!member) throw new NotFoundException('You are not a member of this cashbook');
    await this.prisma.cashbookMember.delete({ where: { id: member.id } });
    return { message: 'You have left the cashbook' };
  }

  // ── Send invite email (non-fatal) ──────────────────────────────────────────
  private async sendInviteEmail(toEmail: string, inviterName: string, bookName: string, inviteLink: string) {
    try {
      await this.mail.sendCashbookInvite(toEmail, inviterName, bookName, inviteLink);
    } catch (e) {
      console.error('[CashbookInvite] Failed to send invite email:', e?.message);
    }
  }
}
