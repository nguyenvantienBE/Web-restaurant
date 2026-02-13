export default () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    database: {
        url: process.env.DATABASE_URL,
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'change-me-in-production',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh',
        accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
        refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    },
    frontend: {
        url: process.env.FRONTEND_URL || 'http://localhost:5173',
    },
});
