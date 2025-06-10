import { authenticator } from "otplib";

export async function onRequestPost({ request, env }) {
  const KV = env.KV_USER as KVNamespace;

  const { admin_email, admin_pass, admin_otp } = await request.json();

  // Xác thực admin + 2FA
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

  // Lấy list user
  const list = await KV.list({ prefix: "user:" });
  const users = [];
  for (const key of list.keys) {
    // Loại bỏ các key không phải user:<email> thật (ví dụ: user:...:email nếu có)
    if (!/^user:[^:]+@[^:]+$/.test(key.name)) continue;
    const raw = await KV.get(key.name);
    if (!raw) continue;
    const u = JSON.parse(raw);
    users.push({
      email: key.name.replace("user:", ""),
      status: u.status,
      time: u.time,
      ip: u.ip
      // Không trả pass/base32/api_key ra ngoài!
    });
  }

  return Response.json({ success: true, users });
}
