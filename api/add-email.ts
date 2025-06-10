// src/api/add-email.ts

export async function onRequestPost({ request, env }) {
  const KV = env.KV_USER as KVNamespace;
  const KV_OUTLOOK = env.KV_OUTLOOK as KVNamespace;
  const KV_INDEX = env.KV_INDEX_OUTLOOK as KVNamespace;
  const KV_LOGGER = env.KV_LOGGER as KVNamespace;

  const { email_user, api_key, email, pass, refresh_token, access_token, client_id, status_token, time_token } = await request.json();

  if (!email_user || !api_key || !email)
    return Response.json({ error: "Thiếu thông tin xác thực hoặc email" }, { status: 400 });

  // Xác thực user
  const userRaw = await KV.get(`user:${email_user}`);
  if (!userRaw) return Response.json({ error: "Không tìm thấy user" }, { status: 404 });
  const user = JSON.parse(userRaw);
  if (!user.api_key || user.api_key !== api_key)
    return Response.json({ error: "Sai api_key" }, { status: 403 });

  // Kiểm tra email đã tồn tại trong hệ thống chưa (không cho 2 user trùng email quản lý)
  const existIndex = await KV_INDEX.get(`index:${email}`);
  if (existIndex) return Response.json({ error: "Email này đã được user khác quản lý" }, { status: 409 });

  // Tạo record email cho user
  await KV_OUTLOOK.put(
    `user:${email_user}:${email}`,
    JSON.stringify({ pass, refresh_token, access_token, client_id, status_token, time_token })
  );
  // Tạo index ngược
  await KV_INDEX.put(`index:${email}`, JSON.stringify({ user: email_user }));

  // Logger
  await addLogger(KV_LOGGER, email_user, {
    action: "add_email",
    by: email_user,
    meta: { email }
  });

  return Response.json({ success: true });
}

// Ghi logger
async function addLogger(KV_LOGGER, email_user, logObj) {
  const key = `logger:${email_user}`;
  const oldLogs = JSON.parse(await KV_LOGGER.get(key) || "[]");
  oldLogs.push({ timestamp: new Date().toISOString(), ...logObj });
  if (oldLogs.length > 500) oldLogs.shift();
  await KV_LOGGER.put(key, JSON.stringify(oldLogs), { expirationTtl: 30 * 86400 });
}
