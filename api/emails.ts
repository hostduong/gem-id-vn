// src/api/emails.ts

export async function onRequestPost({ request, env }) {
  const KV = env.KV_USER as KVNamespace;
  const KV_OUTLOOK = env.KV_OUTLOOK as KVNamespace;
  const KV_LOGGER = env.KV_LOGGER as KVNamespace;

  const { email, api_key } = await request.json();
  if (!email || !api_key)
    return Response.json({ error: "Thiếu thông tin xác thực" }, { status: 401 });

  // Lấy user và xác thực api_key
  const userRaw = await KV.get(`user:${email}`);
  if (!userRaw) return Response.json({ error: "Không tìm thấy user" }, { status: 404 });
  const user = JSON.parse(userRaw);
  if (!user.api_key || user.api_key !== api_key)
    return Response.json({ error: "Sai api_key" }, { status: 403 });

  // Truy vấn toàn bộ key email thuộc user này
  const list = await KV_OUTLOOK.list({ prefix: `user:${email}:` });
  const emails = [];
  for (const key of list.keys) {
    const raw = await KV_OUTLOOK.get(key.name);
    if (!raw) continue;
    const emailObj = JSON.parse(raw);
    // Ẩn field pass nếu muốn (ở đây giữ nguyên tất cả để bạn tùy chỉnh)
    const mail = key.name.split(":").slice(-1)[0];
    emails.push({ email: mail, ...emailObj });
  }

  // Ghi logger
  await addLogger(KV_LOGGER, email, {
    action: "list_emails",
    by: email,
    meta: { count: emails.length }
  });

  return Response.json({ success: true, emails });
}

// Hàm logger
async function addLogger(KV_LOGGER, email_user, logObj) {
  const key = `logger:${email_user}`;
  const oldLogs = JSON.parse(await KV_LOGGER.get(key) || "[]");
  oldLogs.push({ timestamp: new Date().toISOString(), ...logObj });
  if (oldLogs.length > 500) oldLogs.shift();
  await KV_LOGGER.put(key, JSON.stringify(oldLogs), { expirationTtl: 30 * 86400 });
}
