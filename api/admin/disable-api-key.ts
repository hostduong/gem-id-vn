import { authenticator } from "otplib";

export async function onRequestPost({ request, env }) {
  const KV = env.KV_USER as KVNamespace;
  const KV_LOGGER = env.KV_LOGGER as KVNamespace;

  const { admin_email, admin_pass, admin_otp, email_user } = await request.json();

  // Check quyền admin + 2FA
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

  // Kiểm tra user
  const userRaw = await KV.get(`user:${email_user}`);
  if (!userRaw) return Response.json({ error: "User không tồn tại" }, { status: 404 });

  // Xử lý api_key
  const keyRaw = await KV.get(`api_key:${email_user}`);
  if (!keyRaw) return Response.json({ error: "User chưa có api_key" }, { status: 404 });
  const keyObj = JSON.parse(keyRaw);

  keyObj.status = "inactive";
  await KV.put(`api_key:${email_user}`, JSON.stringify(keyObj));

  // Logger cho cả user và admin
  await addLogger(KV_LOGGER, email_user, {
    action: "admin_disable_api_key",
    by: admin_email,
    meta: { before: keyRaw, after: keyObj }
  });
  await addLogger(KV_LOGGER, admin_email, {
    action: "disable_api_key",
    by: admin_email,
    meta: { target: email_user }
  });

  return Response.json({ success: true });
}

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
  "admin_otp": "123456",      // OTP từ app 2FA của admin
  "email_user": "user@..."
}
*/
//
