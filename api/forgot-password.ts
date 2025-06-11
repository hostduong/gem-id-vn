import { authenticator } from "otplib";

// Giới hạn rate-limit
const MAX_IP_FIRST = 10, MAX_IP_REPEAT = 5;
const MAX_EMAIL_FIRST = 10, MAX_EMAIL_REPEAT = 5;
const LOCK_TIME = 10 * 60 * 1000;
const MAX_FORGOT_FIRST = 10, MAX_FORGOT_REPEAT = 3;
const FORGOT_LOCK_TIME = 10 * 60 * 1000;

export async function onRequestPost({ request, env }) {
  const KV = env.KV_USER as KVNamespace;
  const KV_LOGGER = env.KV_LOGGER as KVNamespace;
  const KV_RATE_LIMIT = env.KV_RATE_LIMIT as KVNamespace;

  const { email, otp, new_pass } = await request.json();
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "";
  const now = Date.now();

  // ---- Rate-limit IP và Email cho forgot-password ----
  const limitForgotIPKey = `limitForgotIP:/api/forgot-password:${ip}`;
  const limitForgotEmailKey = `limitForgot:/api/forgot-password:${email}`;

  // Check IP block
  let stateForgotIP = { count: 0, until: 0, mode: "first" };
  let rawForgotIP = await KV_RATE_LIMIT.get(limitForgotIPKey);
  if (rawForgotIP) {
    stateForgotIP = JSON.parse(rawForgotIP);
    if (stateForgotIP.until && now < stateForgotIP.until)
      return Response.json({ error: "IP đã thực hiện quá nhiều lần quên mật khẩu, thử lại sau.", code: "IP_LOCK" }, { status: 429 });
  }

  // Check Email block
  let stateForgotEmail = { count: 0, until: 0, mode: "first", ips: [] };
  let rawForgotEmail = await KV_RATE_LIMIT.get(limitForgotEmailKey);
  if (rawForgotEmail) {
    stateForgotEmail = JSON.parse(rawForgotEmail);
    if (stateForgotEmail.until && now < stateForgotEmail.until)
      return Response.json({ error: "Tài khoản bị tạm khóa đổi mật khẩu, thử lại sau.", code: "EMAIL_LOCK" }, { status: 429 });
    if (!Array.isArray(stateForgotEmail.ips)) stateForgotEmail.ips = [];
  }

  if (!email || !otp || !new_pass)
    return Response.json({ error: "Thiếu thông tin" }, { status: 400 });

  const userRaw = await KV.get(`user:${email}`);
  if (!userRaw) return Response.json({ error: "User không tồn tại" }, { status: 404 });
  const user = JSON.parse(userRaw);

  // 2FA bắt buộc
  if (!user.base32)
    return Response.json({ error: "User chưa có 2FA" }, { status: 403 });

  // Sai mã OTP → tăng đếm block forgot-pass
  if (!authenticator.check(otp, user.base32)) {
    // Block IP
    stateForgotIP.count = (stateForgotIP.count || 0) + 1;
    let maxIP = stateForgotIP.mode === "repeat" ? MAX_IP_REPEAT : MAX_IP_FIRST;
    if (stateForgotIP.count >= maxIP) {
      stateForgotIP.until = now + FORGOT_LOCK_TIME;
      stateForgotIP.count = 0;
      stateForgotIP.mode = "repeat";
    } else {
      stateForgotIP.until = 0;
    }
    await KV_RATE_LIMIT.put(limitForgotIPKey, JSON.stringify(stateForgotIP), { expirationTtl: 3600 });

    // Block email + lưu IP
    stateForgotEmail.count = (stateForgotEmail.count || 0) + 1;
    if (!stateForgotEmail.ips) stateForgotEmail.ips = [];
    if (!stateForgotEmail.ips.includes(ip)) stateForgotEmail.ips.push(ip);
    let maxEmail = stateForgotEmail.mode === "repeat" ? MAX_FORGOT_REPEAT : MAX_FORGOT_FIRST;
    if (stateForgotEmail.count >= maxEmail) {
      stateForgotEmail.until = now + FORGOT_LOCK_TIME;
      stateForgotEmail.count = 0;
      stateForgotEmail.mode = "repeat";
    } else {
      stateForgotEmail.until = 0;
    }
    await KV_RATE_LIMIT.put(limitForgotEmailKey, JSON.stringify(stateForgotEmail), { expirationTtl: 3600 });

    return Response.json({ error: "Sai mã OTP" }, { status: 403 });
  }

  // Thành công → reset toàn bộ lock forgot-pass và login cho email & mọi IP liên quan
  // Reset block forgot-pass
  await KV_RATE_LIMIT.delete(limitForgotIPKey);
  const raw = await KV_RATE_LIMIT.get(limitForgotEmailKey);
  if (raw) {
    const state = JSON.parse(raw);
    for (const oldIP of state.ips || []) {
      await KV_RATE_LIMIT.delete(`limitIP:/api/login:${oldIP}`); // Xóa block login cũ
      await KV_RATE_LIMIT.delete(`limitForgotIP:/api/forgot-password:${oldIP}`); // Xóa block forgot cũ
    }
    await KV_RATE_LIMIT.delete(limitForgotEmailKey); // Xóa block email forgot
    await KV_RATE_LIMIT.delete(`limitEmail:/api/login:${email}`); // Xóa block email login
  }

  // Đổi pass
  const before = { ...user };
  user.pass = new_pass;
  await KV.put(`user:${email}`, JSON.stringify(user));
  await addLogger(KV_LOGGER, email, {
    action: "forgot_password",
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
