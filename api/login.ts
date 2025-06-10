import { authenticator } from "otplib";

// Các ngưỡng rate-limit
const MAX_FIRST = 10;
const MAX_REPEAT = 5;
const LOCK_TIME = 10 * 60 * 1000; // 10 phút

export async function onRequestPost({ request, env }) {
  const KV = env.KV_USER as KVNamespace;
  const KV_LOGGER = env.KV_LOGGER as KVNamespace;
  const KV_LIMIT = env.KV_LOGIN_LIMIT as KVNamespace; // KV Namespace riêng cho rate-limit

  const { email, pass, otp } = await request.json();
  // Lấy IP client
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for") ||
    "";

  if (!email || !pass)
    return Response.json({ error: "Thiếu email hoặc pass" }, { status: 400 });

  const isAdmin = email === "admin@gem.id.vn";
  const limitKey = `fail:${email}:${ip}`;
  const now = Date.now();

  // Lấy trạng thái rate-limit
  let state: { count: number; until: number; mode: "first" | "repeat" } =
    { count: 0, until: 0, mode: "first" };
  const limitRaw = await KV_LIMIT.get(limitKey);
  if (limitRaw) {
    state = JSON.parse(limitRaw);
    // Nếu vẫn đang trong thời gian khóa, trả lỗi và không cho login
    if (state.until && now < state.until) {
      await logLogin(KV_LOGGER, email, false, ip, "Rate limit");
      return Response.json({
        error: `Tạm khóa đăng nhập tới ${new Date(state.until).toLocaleTimeString()}`,
      }, { status: 429 });
    }
  }

  // Tìm user
  const userRaw = await KV.get(`user:${email}`);
  if (!userRaw) {
    await handleFail(email, ip, KV_LIMIT, KV_LOGGER, limitKey, state, "Sai tài khoản hoặc mật khẩu");
    return Response.json({ error: "Tài khoản hoặc mật khẩu không đúng" }, { status: 401 });
  }
  const user = JSON.parse(userRaw);

  if (user.status === "lock") {
    await logLogin(KV_LOGGER, email, false, ip, "Tài khoản bị khóa");
    return Response.json({ error: "Tài khoản đã bị khóa" }, { status: 403 });
  }

  if (user.pass !== pass) {
    await handleFail(email, ip, KV_LIMIT, KV_LOGGER, limitKey, state, "Sai tài khoản hoặc mật khẩu");
    return Response.json({ error: "Tài khoản hoặc mật khẩu không đúng" }, { status: 401 });
  }

  // Nếu là admin, bắt buộc 2FA
  if (isAdmin) {
    if (!otp) {
      await handleFail(email, ip, KV_LIMIT, KV_LOGGER, limitKey, state, "Thiếu mã OTP admin");
      return Response.json({ error: "Thiếu mã OTP cho admin" }, { status: 400 });
    }
    if (!user.base32) {
      await handleFail(email, ip, KV_LIMIT, KV_LOGGER, limitKey, state, "Admin chưa có 2FA");
      return Response.json({ error: "Admin chưa có 2FA" }, { status: 403 });
    }
    if (!authenticator.check(otp, user.base32)) {
      await handleFail(email, ip, KV_LIMIT, KV_LOGGER, limitKey, state, "Sai mã OTP admin");
      return Response.json({ error: "Mã OTP không đúng" }, { status: 401 });
    }
  }

  // Đăng nhập thành công: reset rate-limit, lưu IP
  await KV_LIMIT.delete(limitKey);
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

// Xử lý login sai: tăng đếm, rate-limit đúng logic yêu cầu
async function handleFail(email, ip, KV_LIMIT, KV_LOGGER, limitKey, state, errorMsg) {
  const now = Date.now();
  state.count = (state.count || 0) + 1;
  let max = state.mode === "repeat" ? MAX_REPEAT : MAX_FIRST;
  if (state.count >= max) {
    state.until = now + LOCK_TIME;
    state.count = 0;
    state.mode = "repeat";
    await KV_LIMIT.put(limitKey, JSON.stringify(state), { expirationTtl: 3600 });
  } else {
    state.until = 0;
    await KV_LIMIT.put(limitKey, JSON.stringify(state), { expirationTtl: 3600 });
  }
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
