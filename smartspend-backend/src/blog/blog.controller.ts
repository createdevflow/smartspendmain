import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('blog')
@Controller({ path: 'blog', version: '1' })
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // ── Public Routes (no auth) ─────────────────────────────
  @Public()
  @Get('published')
  @ApiOperation({ summary: 'Get published blog posts (public)' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'category', required: false })
  getPublished(
    @Query('limit') limit?: number,
    @Query('page') page?: number,
    @Query('category') category?: string,
  ) {
    return this.blogService.getPublishedPosts(Number(limit) || 10, Number(page) || 1, category);
  }

  @Public()
  @Get('categories/public')
  @ApiOperation({ summary: 'Get all blog categories (public)' })
  getCategoriesPublic() { return this.blogService.getCategories(); }

  @Public()
  @Get('tags/public')
  @ApiOperation({ summary: 'Get all blog tags (public)' })
  getTagsPublic() { return this.blogService.getTags(); }

  @Public()
  @Get(':slug/public')
  @ApiOperation({ summary: 'Get a published blog post by slug (public)' })
  getBySlug(@Param('slug') slug: string) {
    return this.blogService.getPostBySlug(slug);
  }

  // ── Admin Routes (JWT + ADMIN role) ────────────────────
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Admin: list all blog posts' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  getAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.blogService.getAllPosts(Number(page) || 1, Number(limit) || 20, status, search);
  }

  // ── Categories CRUD ─────────────────────────────────────
  @Get('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  getCategories() { return this.blogService.getCategories(); }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  createCategory(@Body() body: { name: string; color?: string }) {
    return this.blogService.createCategory(body.name, body.color);
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  updateCategory(@Param('id') id: string, @Body() body: { name?: string; color?: string }) {
    return this.blogService.updateCategory(id, body);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  deleteCategory(@Param('id') id: string) { return this.blogService.deleteCategory(id); }

  // ── Tags CRUD ───────────────────────────────────────────
  @Get('tags')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  getTags() { return this.blogService.getTags(); }

  @Post('tags')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  createTag(@Body() body: { name: string }) { return this.blogService.createTag(body.name); }

  @Patch('tags/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  updateTag(@Param('id') id: string, @Body() body: { name?: string }) {
    return this.blogService.updateTag(id, body);
  }

  @Delete('tags/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  deleteTag(@Param('id') id: string) { return this.blogService.deleteTag(id); }

  // ── Admin Post Routes (Dynamic :id below static routes) ──
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Admin: get blog post by ID' })
  getById(@Param('id') id: string) { return this.blogService.getPostById(id); }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Admin: create blog post' })
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.blogService.createPost(body, user?.sub || user?.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Admin: update blog post' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.blogService.updatePost(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: delete blog post' })
  delete(@Param('id') id: string) { return this.blogService.deletePost(id); }
}
