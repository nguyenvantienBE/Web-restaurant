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
    /** Next.js dev thường chạy 3001; có thể khai báo nhiều URL cách nhau bởi dấu phẩy trong FRONTEND_URL */
    url: process.env.FRONTEND_URL || 'http://localhost:3001',
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
  },
  restaurant: {
    name: process.env.RESTAURANT_NAME || 'The Albion',
    phone: process.env.RESTAURANT_PHONE || '',
    website: process.env.RESTAURANT_WEBSITE || '',
    address: process.env.RESTAURANT_ADDRESS || '',
    /** Đến trước giờ đặt tối đa bao nhiêu phút (lưu ý trong mail) */
    arrivalBufferMinutes: parseInt(process.env.RESTAURANT_ARRIVAL_BUFFER_MINUTES || '15', 10),
    /** Hủy/đổi — hiển thị dạng "24 giờ" */
    cancelLimitHours: parseInt(process.env.RESTAURANT_CANCEL_LIMIT_HOURS || '24', 10),
  },
});
