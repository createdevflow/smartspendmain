export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL,
    poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
  },

  redis: {
    url: process.env.REDIS_URL,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  crypto: {
    serverKey: process.env.SERVER_ENCRYPTION_KEY,
  },

  mail: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    fromName: process.env.MAIL_FROM_NAME,
    fromAddress: process.env.MAIL_FROM_ADDRESS,
  },

  minio: {
    endpoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    bucketReceipts: process.env.MINIO_BUCKET_RECEIPTS || 'receipts',
    useSsl: process.env.MINIO_USE_SSL === 'true',
    publicUrl: process.env.MINIO_PUBLIC_URL,
  },

  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10),
    resendCooldown: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60', 10),
  },

  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
    loginTtl: parseInt(process.env.LOGIN_THROTTLE_TTL || '900', 10),
    loginLimit: parseInt(process.env.LOGIN_THROTTLE_LIMIT || '5', 10),
  },

  currency: {
    apiBase: process.env.EXCHANGE_RATE_API || 'https://api.frankfurter.app',
    refreshCron: process.env.EXCHANGE_RATE_REFRESH_CRON || '0 6 * * *',
  },

  app: {
    url: process.env.APP_URL || 'http://localhost:3000',
    adminUrl: process.env.ADMIN_PANEL_URL || 'http://localhost:3001',
    defaultCurrency: process.env.DEFAULT_CURRENCY || 'INR',
    defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata',
  },

  superAdmin: {
    email: process.env.SUPER_ADMIN_EMAIL,
    password: process.env.SUPER_ADMIN_PASSWORD,
  },
});
