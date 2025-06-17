Dưới đây là nội dung mẫu cho `README.md` phù hợp với toàn bộ hệ thống KHOAI bạn đã xây dựng:

---

```markdown
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

## 🧠 Tính năng nổi bật

- ✅ Route API động `/api/<Base62>` auto-update mỗi phiên
- ✅ Bảo vệ bằng cookie 7 ngày, gia hạn tự động, IP check, 2FA
- ✅ Email automation theo người dùng (token, recovery, ghi log)
- ✅ Quản trị phân quyền: user & admin
- ✅ Lưu toàn bộ giao dịch coin & hoạt động hệ thống

---

## ⚙️ Cài đặt & Deploy

### 1. Clone project và cấu hình `wrangler.toml`
```bash
git clone https://github.com/your-org/khoai-workers.git
cd khoai-workers
```

Cập nhật:
- `account_id`
- `kv_namespaces`
- `routes` (route tạm ban đầu)

---

### 2. Cập nhật route mới và push

```bash
node update-route.js
# Tự động sửa wrangler.toml + push GitHub
```

---

### 3. Deploy bằng GitHub Actions

File `.github/workflows/deploy.yml` sẽ:
- Auto deploy mỗi khi `wrangler.toml` thay đổi
- Dùng `CLOUDFLARE_API_TOKEN` từ GitHub Secrets

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

- Mỗi user có 1 `api_key` (sha256 + salt)
- Cookie hash + TTL tự gia hạn 7 ngày
- Tự động ghi log IP, hành vi
- Quản lý bằng Cloudflare KV, không cần database

---

## 📄 License

MIT – Code by [your team].
```

---

📌 Mình có thể:
- Đưa `README.md` vào root repo
- Gói toàn bộ project `.zip` kèm file này

Chỉ cần nói **"Tạo repo zip kèm README"** là mình đóng gói ngay.
