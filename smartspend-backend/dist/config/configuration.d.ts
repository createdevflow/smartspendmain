declare const _default: () => {
    port: number;
    nodeEnv: string;
    database: {
        url: string | undefined;
        poolSize: number;
    };
    redis: {
        url: string | undefined;
    };
    jwt: {
        accessSecret: string | undefined;
        refreshSecret: string | undefined;
        accessExpiresIn: string;
        refreshExpiresIn: string;
    };
    crypto: {
        serverKey: string | undefined;
    };
    mail: {
        host: string | undefined;
        port: number;
        secure: boolean;
        user: string | undefined;
        pass: string | undefined;
        fromName: string | undefined;
        fromAddress: string | undefined;
    };
    minio: {
        endpoint: string | undefined;
        port: number;
        accessKey: string | undefined;
        secretKey: string | undefined;
        bucketReceipts: string;
        useSsl: boolean;
        publicUrl: string | undefined;
    };
    otp: {
        expiryMinutes: number;
        maxAttempts: number;
        resendCooldown: number;
    };
    throttle: {
        ttl: number;
        limit: number;
        loginTtl: number;
        loginLimit: number;
    };
    currency: {
        apiBase: string;
        refreshCron: string;
    };
    app: {
        url: string;
        adminUrl: string;
        defaultCurrency: string;
        defaultTimezone: string;
    };
    superAdmin: {
        email: string | undefined;
        password: string | undefined;
    };
};
export default _default;
