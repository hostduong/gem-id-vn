import { authenticator } from "otplib";

export async function onRequestPost({ request, env }) {
  const KV = env.KV_USER as KVNamespace;
  const KV_LOGGER = env.KV_LOGGER as KVNamespace;

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

  const logsRaw = await KV_LOGGER.get(`logger:${email_user}`);
  const logs = JSON.parse(logsRaw || "[]");
  return Response.json({ success: true, logs });
}
