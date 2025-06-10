import { authenticator } from "otplib";

export async function onRequestPost({ request, env }) {
  const KV = env.KV_USER as KVNamespace;
  const KV_OUTLOOK = env.KV_OUTLOOK as KVNamespace;
  const KV_LOGGER = env.KV_LOGGER as KVNamespace;

  const { email_user, pass, otp, email, refresh_token, access_token } = await request.json();

  if (!email_user || !email)
    return Response.json({ error: "Thiếu thông tin email_user hoặc email" }, { status: 400 });

  // Xác thực user (pass hoặc otp 2FA)
  const userRaw = await KV.get(`user:${email_user}`);
  if (!userRaw) return Response.json({ error: "User không tồn tại" }, { status: 404 });
  const user = JSON.parse(userRaw);

  let valid = false;
  if (pass && user.pass === pass) valid = true;
  if (otp && user.base32 && authenticator.check(otp, user.base32)) valid = true;
  if (!valid)
    return Response.json({ error: "Sai xác thực" }, { status: 403 });

  // Lấy thông tin email đã add
  const key = `user:${email_user}:${email}`;
  const oldRaw = await KV_OUTLOOK.get(key);
  if (!oldRaw) return Response.json({ error: "Email chưa tồn tại" }, { status: 404 });
  const oldObj = JSON.parse(oldRaw);

  // Chỉ cập nhật trường được gửi lên (không làm mất các trường khác)
  const updated = {
    ...oldObj,
    refresh_token: refresh_token !== undefined ? refresh_token : oldObj.refresh_token,
    access_token: access_token !== undefined ? access_token : oldObj.access_token
  };
  await KV_OUTLOOK.put(key, JSON.stringify(updated));

  // Ghi logger
  await addLogger(KV_LOGGER, email_user, {
    action: "update_token",
    by: email_user,
    meta: { email, before: oldObj, after: updated }
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
  "email_user": "user@...",
  "pass": "mật_khẩu"      // hoặc dùng "otp": "123456"
  "otp": "123456",        // (tùy chọn, dùng pass hoặc otp đều được)
  "email": "email_cần_update@...",
  "refresh_token": "refresh_token_mới",
  "access_token": "access_token_mới"
}

*/
// ─────────────────────────────────────────────
