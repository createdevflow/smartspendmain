"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const helmet_1 = require("helmet");
const app_module_1 = require("./app.module");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log'],
    });
    const config = app.get(config_1.ConfigService);
    const port = config.get('PORT', 3000);
    const corsOrigins = config.get('CORS_ORIGINS', '').split(',').filter(Boolean);
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    app.use(compression());
    app.use(cookieParser());
    app.enableCors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });
    app.setGlobalPrefix('api');
    app.enableVersioning({
        type: common_1.VersioningType.URI,
        defaultVersion: '1',
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
    if (config.get('NODE_ENV') !== 'production') {
        const swaggerConfig = new swagger_1.DocumentBuilder()
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
        const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
        swagger_1.SwaggerModule.setup('api/docs', app, document, {
            swaggerOptions: { persistAuthorization: true },
        });
        console.log(`📖 Swagger docs: http://localhost:${port}/api/docs`);
    }
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 SmartSpend API running on port ${port}`);
    console.log(`   Environment: ${config.get('NODE_ENV')}`);
}
bootstrap();
//# sourceMappingURL=main.js.map