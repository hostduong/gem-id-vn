import { authenticator } from "otplib";

export async function onRequestPost({ request, env }) {
  const KV = env.KV_USER as KVNamespace;
  const KV_LOGGER = env.KV_LOGGER as KVNamespace;

  const { email, old_pass, new_pass, otp } = await request.json();

  if (!email || !old_pass || !new_pass || !otp)
    return Response.json({ error: "Thiếu thông tin" }, { status: 400 });

  const userRaw = await KV.get(`user:${email}`);
  if (!userRaw) return Response.json({ error: "User không tồn tại" }, { status: 404 });
  const user = JSON.parse(userRaw);

  if (user.pass !== old_pass)
    return Response.json({ error: "Sai mật khẩu cũ" }, { status: 403 });

  if (!user.base32) return Response.json({ error: "User chưa có 2FA" }, { status: 403 });
  if (!authenticator.check(otp, user.base32))
    return Response.json({ error: "Sai mã OTP" }, { status: 403 });

  const before = { ...user };
  user.pass = new_pass;
  await KV.put(`user:${email}`, JSON.stringify(user));
  await addLogger(KV_LOGGER, email, {
    action: "change_password",
    by: email,
    meta: { before, after: user }
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
