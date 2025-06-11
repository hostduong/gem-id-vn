import { authenticator } from "otplib";

export async function onRequestPost({ request, env }) {
  const KV = env.KV_USER as KVNamespace;
  const KV_LOGGER = env.KV_LOGGER as KVNamespace;
  const KV_RATE_LIMIT = env.KV_RATE_LIMIT as KVNamespace;

  const { email, otp, new_pass } = await request.json();
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "";

  if (!email || !otp || !new_pass) {
    await addLogger(KV_LOGGER, email, {
      action: "forgot_password",
      by: email,
      meta: { ok: false, error: "Thiếu thông tin" }
    });
    return Response.json({ error: "Thiếu thông tin" }, { status: 400 });
  }

  const userRaw = await KV.get(`user:${email}`);
  if (!userRaw) {
    await addLogger(KV_LOGGER, email, {
      action: "forgot_password",
      by: email,
      meta: { ok: false, error: "User không tồn tại" }
    });
    return Response.json({ error: "User không tồn tại" }, { status: 404 });
  }
  const user = JSON.parse(userRaw);

  if (!user.base32) {
    await addLogger(KV_LOGGER, email, {
      action: "forgot_password",
      by: email,
      meta: { ok: false, error: "User chưa có 2FA" }
    });
    return Response.json({ error: "User chưa có 2FA" }, { status: 403 });
  }
  if (!authenticator.check(otp, user.base32)) {
    await addLogger(KV_LOGGER, email, {
      action: "forgot_password",
      by: email,
      meta: { ok: false, error: "Sai mã OTP" }
    });
    return Response.json({ error: "Sai mã OTP" }, { status: 403 });
  }

  // Xóa lock login cho email & toàn bộ IP đã từng bị block login vào email này
  const ipListKey = `limitEmail:/api/login:${email}:ips`;
  const ipList = JSON.parse(await KV_RATE_LIMIT.get(ipListKey) || "[]");

  await KV_RATE_LIMIT.delete(`limitEmail:/api/login:${email}`);

  for (const oldIP of ipList) {
    await KV_RATE_LIMIT.delete(`limitIP:/api/login:${oldIP}`);
  }
  await KV_RATE_LIMIT.delete(ipListKey);

  const before = { ...user };
  user.pass = new_pass;
  await KV.put(`user:${email}`, JSON.stringify(user));
  await addLogger(KV_LOGGER, email, {
    action: "forgot_password",
    by: email,
    meta: { ok: true, before, after: user }
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
