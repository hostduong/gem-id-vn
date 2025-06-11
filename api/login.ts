import { authenticator } from "otplib";

// Ngưỡng giới hạn login sai
const MAX_IP_FIRST = 10, MAX_IP_REPEAT = 5;
const MAX_EMAIL_FIRST = 10, MAX_EMAIL_REPEAT = 5;
const LOCK_TIME = 10 * 60 * 1000; // 10 phút

export async function onRequestPost({ request, env }) {
  const KV = env.KV_USER as KVNamespace;
  const KV_LOGGER = env.KV_LOGGER as KVNamespace;
  const KV_RATE_LIMIT = env.KV_RATE_LIMIT as KVNamespace; // Dùng 1 KV duy nhất

  const { email, pass, otp } = await request.json();
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "";
  const now = Date.now();

  // Giới hạn login cho IP và email
  const limitIPKey = `limitIP:/api/login:${ip}`;
  const limitEmailKey = `limitEmail:/api/login:${email}`;

  // Check block IP
  let stateIP = { count: 0, until: 0, mode: "first" };
  let rawIP = await KV_RATE_LIMIT.get(limitIPKey);
  if (rawIP) {
    stateIP = JSON.parse(rawIP);
    if (stateIP.until && now < stateIP.until) {
      await logLogin(KV_LOGGER, email, false, ip, "IP bị khóa");
      return Response.json({ error: `IP của bạn bị block, thử lại sau`, code: "IP_LOCK" }, { status: 429 });
    }
  }
  // Check block email
  let stateEmail = { count: 0, until: 0, mode: "first" };
  let rawEmail = await KV_RATE_LIMIT.get(limitEmailKey);
  if (rawEmail) {
    stateEmail = JSON.parse(rawEmail);
    if (stateEmail.until && now < stateEmail.until) {
      await logLogin(KV_LOGGER, email, false, ip, "Email bị khóa");
      return Response.json({ error: `Tài khoản bị khóa, thử lại sau`, code: "EMAIL_LOCK" }, { status: 429 });
    }
  }

  if (!email || !pass)
    return Response.json({ error: "Thiếu email hoặc pass" }, { status: 400 });

  const isAdmin = email === "admin@gem.id.vn";
  const userRaw = await KV.get(`user:${email}`);
  if (!userRaw) {
    await handleFail(stateIP, stateEmail, ip, email, KV_RATE_LIMIT, KV_LOGGER, "Sai tài khoản hoặc mật khẩu");
    return Response.json({ error: "Tài khoản hoặc mật khẩu không đúng" }, { status: 401 });
  }
  const user = JSON.parse(userRaw);

  if (user.status === "lock") {
    await logLogin(KV_LOGGER, email, false, ip, "Tài khoản bị khóa");
    return Response.json({ error: "Tài khoản đã bị khóa" }, { status: 403 });
  }

  if (user.pass !== pass) {
    await handleFail(stateIP, stateEmail, ip, email, KV_RATE_LIMIT, KV_LOGGER, "Sai tài khoản hoặc mật khẩu");
    return Response.json({ error: "Tài khoản hoặc mật khẩu không đúng" }, { status: 401 });
  }

  // Admin phải có 2FA
  if (isAdmin) {
    if (!otp) {
      await handleFail(stateIP, stateEmail, ip, email, KV_RATE_LIMIT, KV_LOGGER, "Thiếu mã OTP admin");
      return Response.json({ error: "Thiếu mã OTP cho admin" }, { status: 400 });
    }
    if (!user.base32) {
      await handleFail(stateIP, stateEmail, ip, email, KV_RATE_LIMIT, KV_LOGGER, "Admin chưa có 2FA");
      return Response.json({ error: "Admin chưa có 2FA" }, { status: 403 });
    }
    if (!authenticator.check(otp, user.base32)) {
      await handleFail(stateIP, stateEmail, ip, email, KV_RATE_LIMIT, KV_LOGGER, "Sai mã OTP admin");
      return Response.json({ error: "Mã OTP không đúng" }, { status: 401 });
    }
  }

  // Đăng nhập thành công: reset rate-limit login cho cả IP và email
  await KV_RATE_LIMIT.delete(limitIPKey);
  await KV_RATE_LIMIT.delete(limitEmailKey);
  user.ip = ip;
  await KV.put(`user:${email}`, JSON.stringify(user));

  // Trả profile
  const apiKeyObj = JSON.parse(await KV.get(`api_key:${email}`) || "null");
  const profile = {
    email,
    api_key: user.api_key || null,
    base32: user.base32 || null,
    status: user.status || "live",
    ip: user.ip,
    api_key_expire: apiKeyObj?.time || null,
    api_key_status: apiKeyObj?.status || null,
    time: user.time || null,
  };

  await logLogin(KV_LOGGER, email, true, ip);
  return Response.json({ success: true, profile });
}

// Xử lý login sai: tăng đếm cho cả IP và Email
async function handleFail(stateIP, stateEmail, ip, email, KV_RATE_LIMIT, KV_LOGGER, errorMsg) {
  const now = Date.now();
  // Cập nhật IP
  let maxIP = stateIP.mode === "repeat" ? MAX_IP_REPEAT : MAX_IP_FIRST;
  stateIP.count = (stateIP.count || 0) + 1;
  if (stateIP.count >= maxIP) {
    stateIP.until = now + LOCK_TIME;
    stateIP.count = 0;
    stateIP.mode = "repeat";
  } else {
    stateIP.until = 0;
  }
  await KV_RATE_LIMIT.put(`limitIP:/api/login:${ip}`, JSON.stringify(stateIP), { expirationTtl: 3600 });

  // Cập nhật Email
  let maxEmail = stateEmail.mode === "repeat" ? MAX_EMAIL_REPEAT : MAX_EMAIL_FIRST;
  stateEmail.count = (stateEmail.count || 0) + 1;
  if (stateEmail.count >= maxEmail) {
    stateEmail.until = now + LOCK_TIME;
    stateEmail.count = 0;
    stateEmail.mode = "repeat";
  } else {
    stateEmail.until = 0;
  }
  await KV_RATE_LIMIT.put(`limitEmail:/api/login:${email}`, JSON.stringify(stateEmail), { expirationTtl: 3600 });

  await logLogin(KV_LOGGER, email, false, ip, errorMsg);
}

async function logLogin(KV_LOGGER, email_user, ok, ip, errorMsg?) {
  const key = `logger:${email_user}`;
  const oldLogs = JSON.parse(await KV_LOGGER.get(key) || "[]");
  oldLogs.push({
    timestamp: new Date().toISOString(),
    action: "login",
    by: email_user,
    meta: { ok, ip, error: errorMsg },
  });
  if (oldLogs.length > 500) oldLogs.shift();
  await KV_LOGGER.put(key, JSON.stringify(oldLogs), { expirationTtl: 30 * 86400 });
}
