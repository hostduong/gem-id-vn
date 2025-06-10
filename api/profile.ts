// src/api/profile.ts

export async function onRequestPost({ request, env }) {
  const KV = env.KV_USER as KVNamespace;
  const KV_LOGGER = env.KV_LOGGER as KVNamespace;

  const { email, api_key, ip } = await request.json();
  if (!email || !api_key) return Response.json({ error: "Thiếu thông tin xác thực" }, { status: 401 });

  // Lấy user
  const userRaw = await KV.get(`user:${email}`);
  if (!userRaw) return Response.json({ error: "Không tìm thấy user" }, { status: 404 });
  const user = JSON.parse(userRaw);

  // Kiểm tra key hợp lệ
  if (!user.api_key || user.api_key !== api_key) {
    await addLogger(KV_LOGGER, email, {
      action: "profile_fail",
      by: email,
      meta: { ip, msg: "Sai api_key" }
    });
    return Response.json({ error: "Sai api_key" }, { status: 403 });
  }

  // Lấy trạng thái TTL key
  const apiKeyObj = JSON.parse(await KV.get(`api_key:${email}`) || "null");
  const profile = {
    email,
    api_key: user.api_key,
    base32: user.base32,
    status: user.status || "live",
    ip: user.ip || "",
    api_key_expire: apiKeyObj?.time || null,
    api_key_status: apiKeyObj?.status || null,
    time: user.time || null
  };

  await addLogger(KV_LOGGER, email, {
    action: "profile",
    by: email,
    meta: { ip }
  });

  return Response.json({ success: true, profile });
}

// Ghi logger
async function addLogger(KV_LOGGER, email_user, logObj) {
  const key = `logger:${email_user}`;
  const oldLogs = JSON.parse(await KV_LOGGER.get(key) || "[]");
  oldLogs.push({ timestamp: new Date().toISOString(), ...logObj });
  if (oldLogs.length > 500) oldLogs.shift();
  await KV_LOGGER.put(key, JSON.stringify(oldLogs), { expirationTtl: 30 * 86400 });
}
