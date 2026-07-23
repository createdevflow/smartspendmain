import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MediaService } from '../media/media.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    private prisma: PrismaService,
    private mediaService: MediaService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { plan: { select: { id: true, name: true, slug: true, color: true } } },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, encryptionKeySalt, ...safe } = user;
    return safe;
  }

  async updateProfile(userId: string, dto: any) {
    let { fullName, defaultCurrency, timezone, language, avatar, phone, pushNotifications, emailReports, preferences } = dto;
    
    // Get existing user to merge preferences
    const existingUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) throw new NotFoundException('User not found');

    if (avatar && (avatar.startsWith('data:') || avatar.length > 500)) {
      try {
        const uploadRes = await this.mediaService.uploadBase64(avatar, {
          module: 'users',
          ownerId: userId,
          generateResponsiveSizes: true,
        });
        avatar = uploadRes.url;
      } catch (e) {}
    }
    
    const mergedPreferences = preferences !== undefined 
      ? { ...(typeof existingUser.preferences === 'object' && existingUser.preferences !== null ? existingUser.preferences : {}), ...preferences }
      : undefined;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { ...(fullName ? { fullName } : {}), ...(defaultCurrency ? { defaultCurrency } : {}), ...(timezone ? { timezone } : {}), ...(language ? { language } : {}), ...(avatar !== undefined ? { avatar } : {}), ...(phone !== undefined ? { phone } : {}), ...(pushNotifications !== undefined ? { pushNotifications } : {}), ...(emailReports !== undefined ? { emailReports } : {}), ...(mergedPreferences !== undefined ? { preferences: mergedPreferences } : {}) },
    });
    const { passwordHash, encryptionKeySalt, ...safe } = updated;
    return safe;
  }

  async changePassword(userId: string, dto: { currentPassword: string; newPassword: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException('User not found');
    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new ForbiddenException('Current password is incorrect');
    const hash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    return { message: 'Password changed successfully' };
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const ts = Date.now();
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        status: 'SUSPENDED',
      },
    });
    // Invalidate all sessions so the user is logged out everywhere
    await this.prisma.session.updateMany({ where: { userId }, data: { isValid: false } });
    return { message: 'Account scheduled for deletion. Contact support within 30 days to restore it.' };
  }


  async getSessions(userId: string) {
    return this.prisma.session.findMany({ where: { userId, isValid: true, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' }, select: { id: true, deviceName: true, platform: true, ipAddress: true, createdAt: true, expiresAt: true } });
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.prisma.session.updateMany({ where: { id: sessionId, userId }, data: { isValid: false } });
    return { message: 'Session revoked' };
  }

  async revokeAllSessions(userId: string) {
    await this.prisma.session.updateMany({ where: { userId }, data: { isValid: false } });
    return { message: 'All sessions revoked' };
  }

  async uploadAvatar(userId: string, base64Image: string) {
    let avatarUrl = base64Image;
    if (base64Image && (base64Image.startsWith('data:') || base64Image.length > 500)) {
      try {
        const uploadRes = await this.mediaService.uploadBase64(base64Image, {
          module: 'users',
          ownerId: userId,
          generateResponsiveSizes: true,
        });
        avatarUrl = uploadRes.url;
      } catch (e) {
        this.logger.error('Avatar upload failed', e instanceof Error ? e.message : String(e));
        throw e;
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    });
    const { passwordHash, encryptionKeySalt, ...safe } = updated;
    return safe;
  }

  async updatePushToken(userId: string, token: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { expoPushToken: token } });
    return { message: 'Push token updated' };
  }

  async syncContacts(userId: string, phoneNumbers: string[]) {
    if (!phoneNumbers || phoneNumbers.length === 0) return [];
    
    // Basic normalization: remove spaces, dashes, parens
    const normalized = phoneNumbers
      .map(p => p.replace(/[\s\-\(\)]/g, ''))
      .filter(p => p.length >= 7); // minimum realistic phone length

    if (normalized.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: {
        phone: { in: normalized },
        id: { not: userId }, // Don't return the user themselves
        isEmailVerified: true, // Only return verified accounts
        deletedAt: null,
        status: 'ACTIVE',
      },
      // Return only safe fields — never expose email or raw phone number
      select: { id: true, fullName: true, avatar: true },
    });

    return users;
  }

  async getAiCredits(userId: string) {
    const credits = await this.prisma.userAiCredit.findUnique({
      where: { userId },
    });
    if (!credits) {
      return {
        balance: 0,
        monthlyUsage: 0,
        lifetimeUsage: 0,
        lastResetDate: new Date(),
      };
    }
    return credits;
  }
}
