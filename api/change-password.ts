import { authenticator } from "otplib";

// Ngưỡng đổi pass tối đa mỗi ngày/email
const MAX_CHANGE_PASS_PER_DAY = 5;
const BLOCK_TIME_CHANGE = 24 * 60 * 60 * 1000; // 24h

export async function onRequestPost({ request, env }) {
  const KV = env.KV_USER as KVNamespace;
  const KV_LOGGER = env.KV_LOGGER as KVNamespace;
  const KV_RATE_LIMIT = env.KV_RATE_LIMIT as KVNamespace;

  const { email, old_pass, new_pass, otp } = await request.json();
  const now = Date.now();

  if (!email || !old_pass || !new_pass || !otp)
    return Response.json({ error: "Thiếu thông tin" }, { status: 400 });

  // Rate-limit đổi pass
  const limitChangeKey = `limitChangePass:${email}`;
  let changeState = { count: 0, until: 0 };
  let rawChange = await KV_RATE_LIMIT.get(limitChangeKey);
  if (rawChange) {
    changeState = JSON.parse(rawChange);
    if (changeState.until && now < changeState.until) {
      await addLogger(KV_LOGGER, email, {
        action: "change_password",
        by: email,
        meta: { ok: false, error: "Đổi mật khẩu quá nhiều lần trong ngày" }
      });
      return Response.json({ error: "Bạn đã đổi mật khẩu quá nhiều lần trong ngày, vui lòng thử lại sau 24h." }, { status: 429 });
    }
  }
  changeState.count = (changeState.count || 0) + 1;
  if (changeState.count >= MAX_CHANGE_PASS_PER_DAY) {
    changeState.until = now + BLOCK_TIME_CHANGE;
    changeState.count = 0;
  }
  await KV_RATE_LIMIT.put(limitChangeKey, JSON.stringify(changeState), { expirationTtl: 2 * 86400 });

  // Xác thực user
  const userRaw = await KV.get(`user:${email}`);
  if (!userRaw) return Response.json({ error: "User không tồn tại" }, { status: 404 });
  const user = JSON.parse(userRaw);

  if (user.pass !== old_pass)
    return Response.json({ error: "Sai mật khẩu cũ" }, { status: 403 });

  if (!user.base32) return Response.json({ error: "User chưa có 2FA" }, { status: 403 });
  if (!authenticator.check(otp, user.base32))
    return Response.json({ error: "Sai mã OTP" }, { status: 403 });

  // --- Dọn sạch block login cho email & IP liên quan ---
  const limitEmailLoginKey = `limitEmail:/api/login:${email}`;
  const rawEmailLogin = await KV_RATE_LIMIT.get(limitEmailLoginKey);
  if (rawEmailLogin) {
    const state = JSON.parse(rawEmailLogin);
    for (const oldIP of state.ips || []) {
      await KV_RATE_LIMIT.delete(`limitIP:/api/login:${oldIP}`);
    }
    await KV_RATE_LIMIT.delete(limitEmailLoginKey);
  }

  // Đổi pass
  const before = { ...user };
  user.pass = new_pass;
  await KV.put(`user:${email}`, JSON.stringify(user));
  await addLogger(KV_LOGGER, email, {
    action: "change_password",
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
