// src/api/reset-api-key.ts

export async function onRequestPost({ request, env }) {
  const KV = env.KV_USER as KVNamespace;
  const KV_LOGGER = env.KV_LOGGER as KVNamespace;
  const { email, pass, api_key } = await request.json();

  if (!email) return Response.json({ error: "Thiếu email" }, { status: 400 });

  // Lấy user
  const userRaw = await KV.get(`user:${email}`);
  if (!userRaw) return Response.json({ error: "User không tồn tại" }, { status: 404 });
  const user = JSON.parse(userRaw);

  // Xác thực: pass hoặc api_key cũ
  let valid = false;
  if (pass && user.pass === pass) valid = true;
  if (api_key && user.api_key === api_key) valid = true;
  if (!valid) return Response.json({ error: "Sai thông tin xác thực" }, { status: 403 });

  // Lấy TTL cũ
  const apiKeyObj = JSON.parse(await KV.get(`api_key:${email}`) || "null");
  if (!apiKeyObj || !apiKeyObj.time) return Response.json({ error: "Chưa được admin cấp api_key" }, { status: 403 });

  // Sinh api_key mới, TTL giữ nguyên
  const old_api_key = user.api_key;
  const new_api_key = crypto.randomUUID().replace(/-/g, "");

  user.api_key = new_api_key;
  await KV.put(`user:${email}`, JSON.stringify(user));
  await KV.put(`api_key:${email}`, JSON.stringify({
    ...apiKeyObj,
    status: "active",
    email,
    // time giữ nguyên
  }));

  // Ghi logger
  await addLogger(KV_LOGGER, email, {
    action: "reset_api_key",
    by: email,
    meta: { old_api_key, new_api_key }
  });

  return Response.json({ success: true, api_key: new_api_key, time: apiKeyObj.time });
}

// Hàm logger
async function addLogger(KV_LOGGER, email_user, logObj) {
  const key = `logger:${email_user}`;
  const oldLogs = JSON.parse(await KV_LOGGER.get(key) || "[]");
  oldLogs.push({ timestamp: new Date().toISOString(), ...logObj });
  if (oldLogs.length > 500) oldLogs.shift();
  await KV_LOGGER.put(key, JSON.stringify(oldLogs), { expirationTtl: 30 * 86400 });
}
