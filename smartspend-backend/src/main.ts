import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3000);
  const corsOrigins = config.get<string>('CORS_ORIGINS', '').split(',').filter(Boolean);

  // ── Security ────────────────────────────────────────────────────
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  app.use(compression());
  app.use(cookieParser());

  // ── CORS ────────────────────────────────────────────────────────
  app.enableCors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // ── Versioning ──────────────────────────────────────────────────
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ── Global Pipes & Filters ──────────────────────────────────────
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // ── Swagger (dev + staging only) ────────────────────────────────
  if (config.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SmartSpend API')
      .setDescription('Personal Finance Platform — Complete API Documentation')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User profile management')
      .addTag('cashbooks', 'Cashbook management')
      .addTag('transactions', 'Transaction tracking')
      .addTag('categories', 'Category management')
      .addTag('passbook', 'Passbook and exports')
      .addTag('budgets', 'Budget management')
      .addTag('goals', 'Savings goals')
      .addTag('analytics', 'Analytics and insights')
      .addTag('currency', 'Currency conversion')
      .addTag('plans', 'Subscription plans')
      .addTag('notifications', 'Notifications')
      .addTag('uploads', 'File uploads')
      .addTag('support', 'Support tickets')
      .addTag('admin', 'Admin operations')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    console.log(`📖 Swagger docs: http://localhost:${port}/api/docs`);
  }

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 SmartSpend API running on port ${port}`);
  console.log(`   Environment: ${config.get('NODE_ENV')}`);
}

bootstrap();
