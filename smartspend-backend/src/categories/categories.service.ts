import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, type?: string) {
    return this.prisma.category.findMany({
      where: {
        OR: [{ userId: null }, { userId }],
        ...(type ? { type: { in: [type, 'both'] } } : {}),
      },
      orderBy: [{ isSystem: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      include: { children: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async create(userId: string, dto: CreateCategoryDto) {
    const slug = `${dto.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${userId.slice(-4)}`;
    const existing = await this.prisma.category.findFirst({ where: { slug, userId } });
    if (existing) throw new ConflictException('A category with this name already exists');

    return this.prisma.category.create({
      data: { ...dto, userId, slug, isSystem: false },
    });
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const cat = await this.prisma.category.findFirst({ where: { id, userId } });
    if (!cat) throw new NotFoundException('Category not found');
    if (cat.isSystem) throw new ForbiddenException('System categories cannot be modified');
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const cat = await this.prisma.category.findFirst({ where: { id, userId } });
    if (!cat) throw new NotFoundException('Category not found');
    if (cat.isSystem) throw new ForbiddenException('System categories cannot be deleted');
    // Move transactions to "Other Expense/Income" before deleting
    const other = await this.prisma.category.findFirst({
      where: { isSystem: true, slug: cat.type === 'income' ? 'other-income' : 'other-expense' },
    });
    if (other) {
      await this.prisma.transaction.updateMany({
        where: { categoryId: id },
        data: { categoryId: other.id },
      });
    }
    await this.prisma.category.delete({ where: { id } });
    return { message: 'Category deleted' };
  }
}
