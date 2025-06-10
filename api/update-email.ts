// src/api/update-email.ts

export async function onRequestPost({ request, env }) {
  const KV = env.KV_USER as KVNamespace;
  const KV_OUTLOOK = env.KV_OUTLOOK as KVNamespace;
  const KV_LOGGER = env.KV_LOGGER as KVNamespace;

  const {
    email_user,
    pass,
    api_key,
    email,
    refresh_token,
    access_token,
    client_id,
    status_token,
    time_token
  } = await request.json();

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

  // Lấy thông tin email cần sửa
  const emailKey = `user:${email_user}:${email}`;
  const oldRaw = await KV_OUTLOOK.get(emailKey);
  if (!oldRaw) return Response.json({ error: "Email chưa tồn tại" }, { status: 404 });
  const oldObj = JSON.parse(oldRaw);

  // Cập nhật các trường được gửi lên (giữ nguyên trường cũ nếu không gửi)
  const updatedObj = {
    refresh_token: refresh_token !== undefined ? refresh_token : oldObj.refresh_token,
    access_token: access_token !== undefined ? access_token : oldObj.access_token,
    client_id: client_id !== undefined ? client_id : oldObj.client_id,
    status_token: status_token !== undefined ? status_token : oldObj.status_token,
    time_token: time_token !== undefined ? time_token : oldObj.time_token
  };

  await KV_OUTLOOK.put(emailKey, JSON.stringify(updatedObj));

  // Logger
  await addLogger(KV_LOGGER, email_user, {
    action: "update_email",
    by: email_user,
    meta: {
      email,
      before: oldObj,
      after: updatedObj
    }
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
