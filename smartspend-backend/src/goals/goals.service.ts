import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService, private crypto: CryptoService) {}

  private async getSalt(userId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { encryptionKeySalt: true } });
    return u?.encryptionKeySalt || '';
  }

  async findAll(userId: string) {
    const salt = await this.getSalt(userId);
    const goals = await this.prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return goals.map(g => ({ ...g, name: this.crypto.decrypt(g.name, salt), description: g.description ? this.crypto.decrypt(g.description, salt) : null }));
  }

  async findOne(userId: string, id: string) {
    const g = await this.prisma.goal.findFirst({ where: { id, userId }, include: { contributions: { orderBy: { createdAt: 'desc' }, take: 5 } } });
    if (!g) throw new NotFoundException('Goal not found');
    const salt = await this.getSalt(userId);
    return { ...g, name: this.crypto.decrypt(g.name, salt), description: g.description ? this.crypto.decrypt(g.description, salt) : null };
  }

  async create(userId: string, dto: any) {
    const salt = await this.getSalt(userId);
    return this.prisma.goal.create({
      data: { userId, ...dto, name: this.crypto.encrypt(dto.name, salt), description: dto.description ? this.crypto.encrypt(dto.description, salt) : null, deadline: dto.deadline ? new Date(dto.deadline) : null },
    });
  }

  async update(userId: string, id: string, dto: any) {
    const g = await this.prisma.goal.findFirst({ where: { id, userId } });
    if (!g) throw new NotFoundException('Goal not found');
    const salt = await this.getSalt(userId);
    return this.prisma.goal.update({ where: { id }, data: { ...dto, ...(dto.name ? { name: this.crypto.encrypt(dto.name, salt) } : {}), ...(dto.description ? { description: this.crypto.encrypt(dto.description, salt) } : {}) } });
  }

  async remove(userId: string, id: string) {
    const g = await this.prisma.goal.findFirst({ where: { id, userId } });
    if (!g) throw new NotFoundException('Goal not found');
    await this.prisma.goal.delete({ where: { id } });
    return { message: 'Goal deleted' };
  }

  async contribute(userId: string, goalId: string, dto: { amount: number; note?: string }) {
    const g = await this.prisma.goal.findFirst({ where: { id: goalId, userId } });
    if (!g) throw new NotFoundException('Goal not found');
    const [contribution] = await this.prisma.$transaction([
      this.prisma.goalContribution.create({ data: { goalId, amount: dto.amount, note: dto.note } }),
      this.prisma.goal.update({ where: { id: goalId }, data: { currentAmount: { increment: dto.amount } } }),
    ]);
    // Auto-mark completed if target reached
    const updated = await this.prisma.goal.findUnique({ where: { id: goalId } });
    if (updated && Number(updated.currentAmount) >= Number(updated.targetAmount) && updated.status === 'ACTIVE') {
      await this.prisma.goal.update({ where: { id: goalId }, data: { status: 'COMPLETED' } });
    }
    return contribution;
  }

  async getHistory(userId: string, goalId: string) {
    const g = await this.prisma.goal.findFirst({ where: { id: goalId, userId } });
    if (!g) throw new NotFoundException('Goal not found');
    return this.prisma.goalContribution.findMany({ where: { goalId }, orderBy: { createdAt: 'desc' } });
  }
}
