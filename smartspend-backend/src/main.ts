import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            winston.format.json(),
          ),
        }),
      ],
    }),
    bodyParser: false,
  });

  // Trust first proxy (Nginx) so throttler and auth see real client IPs
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));


  const config = app.get(ConfigService);
  const port = 3010; // Forced port to avoid local conflicts
  const corsOrigins = config.get<string>('CORS_ORIGINS', '').split(',').filter(Boolean);

  // ── Security ────────────────────────────────────────────────────
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  app.use(compression());
  app.use(cookieParser());

  // ── CORS ────────────────────────────────────────────────────────
  const isProduction = config.get('NODE_ENV') === 'production';
  app.enableCors({
    // In production restrict to configured origins; in dev/staging allow all
    origin: isProduction
      ? (origin, callback) => {
          if (!origin || corsOrigins.length === 0 || corsOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`CORS: Origin "${origin}" not allowed`));
          }
        }
      : true,
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
      .setTitle('Cashtro API')
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
    logger.log(`📖 Swagger docs: http://localhost:${port}/api/docs`);
  }


  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 SmartSpend API running on port ${port}`);
  logger.log(`   Environment: ${config.get('NODE_ENV')}`);
  if (!isProduction) {
    logger.log(`📖 Swagger docs: http://localhost:${port}/api/docs`);
  }
}

bootstrap();
