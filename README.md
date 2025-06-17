# 🥔 KHOAI Workers – Email Automation & User Auth via Cloudflare Workers

## 🔧 Giới thiệu

KHOAI là hệ thống được xây dựng trên **Cloudflare Workers**, sử dụng **KV Storage** để quản lý:
- Đăng ký, đăng nhập, 2FA, cookie, IP whitelist
- Quản lý email Outlook/Gmail theo user
- API key động với TTL
- Nạp/trừ coin và lịch sử giao dịch
- Route động để tránh spam quota

---

## 🚀 Cấu trúc dự án

```
├── wrangler.toml
├── update-route.js
├── src/
│   ├── api/
│   │   └── index.ts
│   ├── auth/
│   │   ├── login.ts
│   │   ├── profile.ts
│   │   ├── change-password.ts
│   │   ├── reset-api-key.ts
│   │   └── forgot-password.ts
│   ├── email/
│   │   ├── add-email.ts
│   │   ├── update-token.ts
│   │   ├── update-email.ts
│   │   ├── delete-email.ts
│   │   └── read-email-code.ts
│   ├── admin/
│   │   ├── lock-user.ts
│   │   ├── update-user.ts
│   │   ├── list-users.ts
│   │   ├── user-emails.ts
│   │   ├── logger.ts
│   │   ├── logger-all.ts
│   │   ├── create-api-key.ts
│   │   └── disable-api-key.ts
│   ├── coin/
│   │   ├── add.ts
│   │   ├── deduct.ts
│   │   └── history.ts
│   └── utils/
│       ├── hash.ts
│       ├── cookie.ts
│       ├── ip.ts
│       ├── kv.ts
│       └── logger.ts
└── .github/
    └── workflows/deploy.yml
```

---

## ⚙️ Cài đặt & Deploy

### 1. Clone project và cấu hình `wrangler.toml`
```bash
git clone https://github.com/your-org/khoai-workers.git
cd khoai-workers
```

### 2. Cập nhật route mới và push

```bash
node update-route.js
```

### 3. Deploy bằng GitHub Actions

Tự động triển khai mỗi khi bạn push thay đổi lên `main`.

---

## 🧪 API mẫu

```bash
POST /api/<dynamic>
{
  "email": "abc@example.com",
  "password": "123456",
  "ip": "1.2.3.4",
  "user_agent": "Mozilla...",
  "twofa": "ABC123"
}
```

Response:
```json
{
  "cookie": "abcxyz...",
  "route": "/api/XYZ678"
}
```

---

## 🛡️ Bảo mật

- API key hash + salt
- Cookie TTL gia hạn 7 ngày
- Ghi log IP, browser, hành vi
- Tách biệt user & admin
