// src/api/delete-email.ts

export async function onRequestPost({ request, env }) {
  const KV = env.KV_USER as KVNamespace;
  const KV_OUTLOOK = env.KV_OUTLOOK as KVNamespace;
  const KV_INDEX = env.KV_INDEX_OUTLOOK as KVNamespace;
  const KV_LOGGER = env.KV_LOGGER as KVNamespace;

  const { email_user, pass, api_key, email } = await request.json();

  if (!email_user || !email)
    return Response.json({ error: "Thiếu thông tin email_user hoặc email" }, { status: 400 });

  // Xác thực user (pass hoặc api_key)
  const userRaw = await KV.get(`user:${email_user}`);
  if (!userRaw) return Response.json({ error: "Không tìm thấy user" }, { status: 404 });
  const user = JSON.parse(userRaw);

  let valid = false;
  if (pass && user.pass === pass) valid = true;
  if (api_key && user.api_key === api_key) valid = true;
  if (!valid)
    return Response.json({ error: "Sai thông tin xác thực" }, { status: 403 });

  // Lấy thông tin email
  const emailKey = `user:${email_user}:${email}`;
  const oldRaw = await KV_OUTLOOK.get(emailKey);
  if (!oldRaw) return Response.json({ error: "Email chưa tồn tại" }, { status: 404 });
  const oldObj = JSON.parse(oldRaw);

  // Xóa khỏi KV_OUTLOOK và KV_INDEX_OUTLOOK
  await KV_OUTLOOK.delete(emailKey);
  await KV_INDEX.delete(`index:${email}`);

  // Logger
  await addLogger(KV_LOGGER, email_user, {
    action: "delete_email",
    by: email_user,
    meta: { email, before: oldObj }
  });

  return Response.json({ success: true });
}

// Logger helper
async function addLogger(KV_LOGGER, email_user, logObj) {
  const key = `logger:${email_user}`;
  const oldLogs = JSON.parse(await KV_LOGGER.get(key) || "[]");
  oldLogs.push({ timestamp: new Date().toISOString(), ...logObj });
  if (oldLogs.length > 500) oldLogs.shift();
  await KV_LOGGER.put(key, JSON.stringify(oldLogs), { expirationTtl: 30 * 86400 });
}
