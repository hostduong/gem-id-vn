import { authenticator } from "otplib";

export async function onRequestPost({ request, env }) {
  const KV = env.KV_USER as KVNamespace;
  const KV_LOGGER = env.KV_LOGGER as KVNamespace;

  const { admin_email, admin_pass, admin_otp, email_user, pass, base32, status } = await request.json();

  // Xác thực admin
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
  const user = JSON.parse(userRaw);

  const before = { ...user };

  // Cập nhật các trường được gửi lên
  if (pass !== undefined) user.pass = pass;
  if (base32 !== undefined) user.base32 = base32;
  if (status !== undefined) {
    if (!["live", "lock"].includes(status)) return Response.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
    user.status = status;
  }

  await KV.put(`user:${email_user}`, JSON.stringify(user));

  // Logger cho cả user và admin
  await addLogger(KV_LOGGER, email_user, {
    action: "admin_update_user",
    by: admin_email,
    meta: { before, after: user }
  });
  await addLogger(KV_LOGGER, admin_email, {
    action: "update_user",
    by: admin_email,
    meta: { target: email_user, before, after: user }
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
