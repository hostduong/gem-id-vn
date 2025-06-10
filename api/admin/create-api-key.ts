import { authenticator } from "otplib";

// src/api/admin/create-api-key.ts
export async function onRequestPost({ request, env }) {
  const KV = env.KV_USER as KVNamespace;
  const KV_LOGGER = env.KV_LOGGER as KVNamespace;

  const { admin_email, admin_pass, admin_otp, email_user, ttl_days } = await request.json();

  // Chỉ cho phép đúng email admin
  if (admin_email !== "admin@gem.id.vn") return Response.json({ error: "Chỉ admin được phép" }, { status: 403 });

  // Xác thực admin (pass + otp 2FA)
  const adminRaw = await KV.get(`user:${admin_email}`);
  if (!adminRaw) return Response.json({ error: "Admin không tồn tại" }, { status: 404 });
  const admin = JSON.parse(adminRaw);

  if (admin.pass !== admin_pass) return Response.json({ error: "Sai pass admin" }, { status: 403 });
  if (!admin.base32) return Response.json({ error: "Admin chưa có mã 2FA" }, { status: 403 });
  if (!admin_otp) return Response.json({ error: "Thiếu mã OTP admin" }, { status: 400 });
  const otpOK = authenticator.check(admin_otp, admin.base32);
  if (!otpOK) return Response.json({ error: "Sai mã OTP admin" }, { status: 403 });

  // Kiểm tra user target
  const userRaw = await KV.get(`user:${email_user}`);
  if (!userRaw) return Response.json({ error: "User không tồn tại" }, { status: 404 });
  const user = JSON.parse(userRaw);

  // Sinh api_key mới và TTL
  const api_key = crypto.randomUUID().replace(/-/g, "");
  const time = Date.now() + (Number(ttl_days) || 90) * 86400_000; // mặc định 90 ngày nếu không gửi
  user.api_key = api_key;
  await KV.put(`user:${email_user}`, JSON.stringify(user));
  await KV.put(`api_key:${email_user}`, JSON.stringify({
    email: email_user,
    time,
    status: "active"
  }));

  // Logger
  await addLogger(KV_LOGGER, email_user, {
    action: "admin_create_api_key",
    by: admin_email,
    meta: { api_key, time }
  });
  await addLogger(KV_LOGGER, admin_email, {
    action: "create_api_key",
    by: admin_email,
    meta: { target: email_user, api_key, time }
  });

  return Response.json({ success: true, api_key, time });
}

// Logger helper
async function addLogger(KV_LOGGER, email_user, logObj) {
  const key = `logger:${email_user}`;
  const oldLogs = JSON.parse(await KV_LOGGER.get(key) || "[]");
  oldLogs.push({ timestamp: new Date().toISOString(), ...logObj });
  if (oldLogs.length > 500) oldLogs.shift();
  await KV_LOGGER.put(key, JSON.stringify(oldLogs), { expirationTtl: 30 * 86400 });
}



// ─────────────────────────────────────────────
// 📌 MẪU YÊU CẦU (chỉ dùng để tham khảo):
// Gửi JSON qua POST body để cập nhật thông tin user
/*
{
  "admin_email": "admin@gem.id.vn",
  "admin_pass": "supersecurepassword",
  "admin_otp": "123456",        // Mã 6 số vừa thấy trên app 2FA
  "email_user": "user1@example.com",
  "ttl_days": 90                // Tuỳ chọn, số ngày hiệu lực api_key
}
*/
// ─────────────────────────────────────────────

