# 🍽️ Restaurant Backend — Hướng dẫn Setup cho Team

## ✅ Yêu cầu cài đặt

- [Node.js v18+](https://nodejs.org/)
- [Git](https://git-scm.com/)

> ❌ Không cần cài PostgreSQL — DB đã có online trên Neon (Singapore)

---

## 🚀 Các bước setup lần đầu

```bash
# 1. Clone repo
git clone https://github.com/nguyenvantienBE/Web-restaurant.git
cd Web-restaurant/back-end/back-end

# 2. Cài dependencies
npm install

# 2.1 Cài dependencies cho Phase 2 (Realtime, PDF, Email)
npm install socket.io-client nodemailer pdfkit
npm install -D @types/nodemailer @types/pdfkit

# 3. Tạo file .env
copy .env.example .env
```

Sau đó mở file `.env` và **điền DATABASE_URL** (lấy từ Team Lead qua Zalo/nhóm):

```env
DATABASE_URL="postgresql://neondb_owner:PASSWORD@ep-dry-river-a1ta8gdv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```

```bash
# 4. Generate Prisma Client
npx prisma@5.5.0 generate

# 5. Chạy server
npm run start:dev
```

---

## 🔑 Tài khoản Admin test

| | |
|--|--|
| **Email** | `admin@restaurant.com` |
| **Password** | `admin123` |

---

## 🔗 URL khi server chạy

| Mục | URL |
|-----|-----|
| API Server | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api |
| WebSocket | ws://localhost:3000 |

---

## 🔄 Workflow khi có thay đổi schema (Backend Lead)

```bash
# Sửa prisma/schema.prisma xong, chạy:
npx prisma@5.5.0 migrate dev --name ten_tinh_nang
git add prisma/migrations prisma/schema.prisma
git commit -m "feat: add migration ten_tinh_nang"
git push
```

## 🔄 Workflow khi pull code về có migration mới (Thành viên)

```bash
git pull
npx prisma@5.5.0 migrate deploy   # Apply migration mới lên DB chung
npx prisma@5.5.0 generate          # Cập nhật Prisma Client
npm run start:dev
```
