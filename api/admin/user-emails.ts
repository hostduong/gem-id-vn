import { authenticator } from "otplib";

export async function onRequestPost({ request, env }) {
  const KV = env.KV_USER as KVNamespace;
  const KV_OUTLOOK = env.KV_OUTLOOK as KVNamespace;

  const { admin_email, admin_pass, admin_otp, email_user } = await request.json();

  if (admin_email !== "admin@gem.id.vn")
    return Response.json({ error: "Chỉ admin được phép" }, { status: 403 });

  const adminRaw = await KV.get(`user:${admin_email}`);
  if (!adminRaw) return Response.json({ error: "Admin không tồn tại" }, { status: 404 });
  const admin = JSON.parse(adminRaw);

  if (admin.pass !== admin_pass)
    return Response.json({ error: "Sai pass admin" }, { status: 403 });

  if (!admin.base32 || !admin_otp)
    return Response.json({ error: "Thiếu mã 2FA admin" }, { status: 400 });

  if (!authenticator.check(admin_otp, admin.base32))
    return Response.json({ error: "Sai mã OTP admin" }, { status: 403 });

  // Lấy toàn bộ email của user này
  const list = await KV_OUTLOOK.list({ prefix: `user:${email_user}:` });
  const emails = [];
  for (const key of list.keys) {
    const mail = key.name.split(":").slice(-1)[0];
    const raw = await KV_OUTLOOK.get(key.name);
    if (!raw) continue;
    const emailObj = JSON.parse(raw);
    emails.push({ email: mail, ...emailObj });
  }
  return Response.json({ success: true, emails });
}


// ─────────────────────────────────────────────
// 📌 MẪU YÊU CẦU (chỉ dùng để tham khảo):
// Gửi JSON qua POST body để cập nhật thông tin user
/*
{
{
  "admin_email": "admin@gem.id.vn",
  "admin_pass": "supersecurepassword",
  "admin_otp": "123456",
  "email_user": "user1@example.com"
}
}
*/
// ─────────────────────────────────────────────
