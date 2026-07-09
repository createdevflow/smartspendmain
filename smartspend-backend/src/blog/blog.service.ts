import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlogStatus, Prisma } from '@prisma/client';

function toSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function estimateReadingTime(content: any[]): number {
  const text = content
    .map((b: any) => {
      if (b.type === 'paragraph' || b.type === 'heading') return b.text || '';
      if (b.type === 'list') return (b.items || []).join(' ');
      return '';
    })
    .join(' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  // ── Public ─────────────────────────────────────────────────
  async getPublishedPosts(limit = 10, page = 1, categorySlug?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.BlogWhereInput = {
      status: BlogStatus.PUBLISHED,
      publishedAt: { lte: new Date() },
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    };
    const [posts, total] = await Promise.all([
      this.prisma.blog.findMany({
        where, skip, take: limit,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: { select: { id: true, fullName: true, avatar: true } },
          category: true,
          tags: true,
        },
      }),
      this.prisma.blog.count({ where }),
    ]);
    return { posts, meta: { total, page, totalPages: Math.ceil(total / limit) } };
  }

  async getPostBySlug(slug: string) {
    const post = await this.prisma.blog.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, fullName: true, avatar: true, email: true } },
        category: true,
        tags: true,
      },
    });
    if (!post || post.status !== BlogStatus.PUBLISHED) throw new NotFoundException('Blog post not found');
    const related = await this.prisma.blog.findMany({
      where: { status: BlogStatus.PUBLISHED, categoryId: post.categoryId, id: { not: post.id } },
      take: 3, orderBy: { publishedAt: 'desc' },
      include: { author: { select: { id: true, fullName: true } }, category: true },
    });
    return { post, related };
  }

  // ── Admin ─────────────────────────────────────────────────
  async getAllPosts(page = 1, limit = 20, status?: string, search?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.BlogWhereInput = {
      ...(status ? { status: status as BlogStatus } : {}),
      ...(search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { excerpt: { contains: search, mode: 'insensitive' } },
        ]
      } : {}),
    };
    const [posts, total] = await Promise.all([
      this.prisma.blog.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, fullName: true } },
          category: true,
          tags: true,
        },
      }),
      this.prisma.blog.count({ where }),
    ]);
    return { posts, meta: { total, page, totalPages: Math.ceil(total / limit) } };
  }

  async getPostById(id: string) {
    const post = await this.prisma.blog.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, fullName: true } },
        category: true,
        tags: true,
      },
    });
    if (!post) throw new NotFoundException('Blog post not found');
    return post;
  }

  async createPost(data: any, authorId: string) {
    if (!authorId) throw new BadRequestException('Authenticated user ID (authorId) is required to create a post');
    const slug = data.slug || toSlug(data.title);
    const existing = await this.prisma.blog.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException(`Slug "${slug}" already exists`);

    const content = data.content || [];
    const readingTime = estimateReadingTime(content);

    let publishedAt: Date | undefined;
    if (data.status === BlogStatus.PUBLISHED && !data.scheduledAt) publishedAt = new Date();
    else if (data.status === BlogStatus.SCHEDULED && data.scheduledAt) publishedAt = new Date(data.scheduledAt);

    const tagConnections = data.tagIds?.map((id: string) => ({ id })) || [];

    return this.prisma.blog.create({
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt,
        content,
        coverImage: data.coverImage,
        ogImage: data.ogImage,
        seoTitle: data.seoTitle || data.title,
        seoDescription: data.seoDescription || data.excerpt,
        focusKeywords: data.focusKeywords,
        canonicalUrl: data.canonicalUrl,
        metaRobots: data.metaRobots || 'index,follow',
        status: data.status || BlogStatus.DRAFT,
        featured: data.featured || false,
        readingTime,
        publishedAt,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        authorId,
        categoryId: data.categoryId || undefined,
        tags: tagConnections.length ? { connect: tagConnections } : undefined,
      },
      include: { author: { select: { id: true, fullName: true } }, category: true, tags: true },
    });
  }

  async updatePost(id: string, data: any) {
    const post = await this.prisma.blog.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Blog post not found');

    if (data.slug && data.slug !== post.slug) {
      const existing = await this.prisma.blog.findUnique({ where: { slug: data.slug } });
      if (existing) throw new BadRequestException(`Slug "${data.slug}" already exists`);
    }

    const content = data.content ?? (post.content as any[]);
    const readingTime = estimateReadingTime(content);

    let publishedAt = post.publishedAt;
    if (data.status === BlogStatus.PUBLISHED && !post.publishedAt) publishedAt = new Date();

    return this.prisma.blog.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.slug && { slug: data.slug }),
        ...(data.excerpt !== undefined && { excerpt: data.excerpt }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
        ...(data.ogImage !== undefined && { ogImage: data.ogImage }),
        ...(data.seoTitle !== undefined && { seoTitle: data.seoTitle }),
        ...(data.seoDescription !== undefined && { seoDescription: data.seoDescription }),
        ...(data.focusKeywords !== undefined && { focusKeywords: data.focusKeywords }),
        ...(data.canonicalUrl !== undefined && { canonicalUrl: data.canonicalUrl }),
        ...(data.metaRobots && { metaRobots: data.metaRobots }),
        ...(data.status && { status: data.status }),
        ...(data.featured !== undefined && { featured: data.featured }),
        readingTime,
        publishedAt,
        ...(data.scheduledAt !== undefined && { scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.tagIds && { tags: { set: data.tagIds.map((id: string) => ({ id })) } }),
      },
      include: { author: { select: { id: true, fullName: true } }, category: true, tags: true },
    });
  }

  async deletePost(id: string) {
    const post = await this.prisma.blog.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Blog post not found');
    await this.prisma.blog.delete({ where: { id } });
    return { success: true };
  }

  // ── Categories ───────────────────────────────────────────
  async getCategories() {
    return this.prisma.blogCategory.findMany({ include: { _count: { select: { blogs: true } } }, orderBy: { name: 'asc' } });
  }

  async createCategory(name: string, color?: string) {
    const slug = toSlug(name);
    const existing = await this.prisma.blogCategory.findUnique({ where: { slug } });
    if (existing) return existing;
    return this.prisma.blogCategory.create({ data: { name, slug, color: color || '#2563EB' } });
  }

  async updateCategory(id: string, data: { name?: string; color?: string }) {
    const updateData: any = { ...data };
    if (data.name) updateData.slug = toSlug(data.name);
    return this.prisma.blogCategory.update({ where: { id }, data: updateData });
  }

  async deleteCategory(id: string) {
    await this.prisma.blogCategory.delete({ where: { id } });
    return { success: true };
  }

  // ── Tags ─────────────────────────────────────────────────
  async getTags() {
    return this.prisma.blogTag.findMany({ include: { _count: { select: { blogs: true } } }, orderBy: { name: 'asc' } });
  }

  async createTag(name: string) {
    const slug = toSlug(name);
    const existing = await this.prisma.blogTag.findUnique({ where: { slug } });
    if (existing) return existing;
    return this.prisma.blogTag.create({ data: { name, slug } });
  }

  async updateTag(id: string, data: { name?: string }) {
    const updateData: any = { ...data };
    if (data.name) updateData.slug = toSlug(data.name);
    return this.prisma.blogTag.update({ where: { id }, data: updateData });
  }

  async deleteTag(id: string) {
    await this.prisma.blogTag.delete({ where: { id } });
    return { success: true };
  }
}
