import { authenticator } from "otplib"; // Thư viện chuẩn TOTP

export async function onRequestPost({ request, env }) {
  const KV = env.KV_USER as KVNamespace;
  const KV_LOGGER = env.KV_LOGGER as KVNamespace;
  const now = new Date().toISOString();

  const { email, pass, otp, ip } = await request.json();

  if (!email || !pass || !otp)
    return Response.json({ error: "Thiếu email, mật khẩu hoặc mã OTP" }, { status: 400 });

  // Tìm user
  const userRaw = await KV.get(`user:${email}`);
  if (!userRaw) {
    await logLogin(KV_LOGGER, email, false, ip, "Không tồn tại");
    return Response.json({ error: "Sai tài khoản hoặc mật khẩu/OTP" }, { status: 401 });
  }
  const user = JSON.parse(userRaw);

  if (user.status === "lock") {
    await logLogin(KV_LOGGER, email, false, ip, "Tài khoản đã bị khóa");
    return Response.json({ error: "Tài khoản đã bị khóa" }, { status: 403 });
  }

  if (user.pass !== pass) {
    await logLogin(KV_LOGGER, email, false, ip, "Sai pass");
    return Response.json({ error: "Sai tài khoản hoặc mật khẩu/OTP" }, { status: 401 });
  }

  // **Kiểm tra mã OTP**
  if (!user.base32)
    return Response.json({ error: "Tài khoản chưa có mã 2FA. Liên hệ admin." }, { status: 403 });

  const otpOK = authenticator.check(otp, user.base32);
  if (!otpOK) {
    await logLogin(KV_LOGGER, email, false, ip, "Sai mã OTP");
    return Response.json({ error: "Sai mã OTP" }, { status: 401 });
  }

  // Cập nhật IP
  user.ip = ip || user.ip || "";
  await KV.put(`user:${email}`, JSON.stringify(user));

  // Trả về profile (ẩn pass)
  const apiKeyObj = JSON.parse(await KV.get(`api_key:${email}`) || "null");
  const profile = {
    email,
    api_key: user.api_key || null,
    base32: user.base32 || null,
    status: user.status || "live",
    ip: user.ip || "",
    api_key_expire: apiKeyObj?.time || null,
    api_key_status: apiKeyObj?.status || null,
    time: user.time || null
  };

  await logLogin(KV_LOGGER, email, true, ip);

  return Response.json({ success: true, profile });
}

// Hàm log login như trước...


export async function onRequestPost({ request, env }) {
  const KV = env.KV_USER as KVNamespace;
  const KV_LOGGER = env.KV_LOGGER as KVNamespace;
  const now = new Date().toISOString();

  const { email, pass, ip } = await request.json();

  // Validate input
  if (!email || !pass) return Response.json({ error: "Thiếu email hoặc mật khẩu" }, { status: 400 });

  // Tìm user
  const userRaw = await KV.get(`user:${email}`);
  if (!userRaw) {
    await logLogin(KV_LOGGER, email, false, ip);
    return Response.json({ error: "Sai tài khoản hoặc mật khẩu" }, { status: 401 });
  }

  const user = JSON.parse(userRaw);
  if (user.status === "lock") {
    await logLogin(KV_LOGGER, email, false, ip, "Tài khoản đã bị khóa");
    return Response.json({ error: "Tài khoản đã bị khóa" }, { status: 403 });
  }

  if (user.pass !== pass) {
    await logLogin(KV_LOGGER, email, false, ip);
    return Response.json({ error: "Sai tài khoản hoặc mật khẩu" }, { status: 401 });
  }

  // Cập nhật ip
  user.ip = ip || user.ip || "";
  await KV.put(`user:${email}`, JSON.stringify(user));

  // Trả về profile (ẩn pass)
  const apiKeyObj = JSON.parse(await KV.get(`api_key:${email}`) || "null");
  const profile = {
    email,
    api_key: user.api_key || null,
    base32: user.base32 || null,
    status: user.status || "live",
    ip: user.ip || "",
    api_key_expire: apiKeyObj?.time || null,
    api_key_status: apiKeyObj?.status || null,
    time: user.time || null
  };

  await logLogin(KV_LOGGER, email, true, ip);

  return Response.json({ success: true, profile });
}

// Hàm log login
async function logLogin(KV_LOGGER, email, ok, ip, errorMsg?) {
  const key = `logger:${email}`;
  const oldLogs = JSON.parse(await KV_LOGGER.get(key) || "[]");
  oldLogs.push({
    timestamp: new Date().toISOString(),
    action: "login",
    by: email,
    meta: { ok, ip, error: errorMsg }
  });
  if (oldLogs.length > 500) oldLogs.shift();
  await KV_LOGGER.put(key, JSON.stringify(oldLogs), { expirationTtl: 30 * 86400 });
}
