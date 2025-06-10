// src/api/admin/lock-user.ts

export async function onRequestPost({ request, env }) {
  const KV = env.KV_USER as KVNamespace;
  const KV_LOGGER = env.KV_LOGGER as KVNamespace;

  const { admin_email, admin_pass, email_user, new_status } = await request.json();

  // Chỉ cho phép admin gốc (hardcode hoặc kiểm tra role)
  if (admin_email !== "admin@gem.id.vn") return Response.json({ error: "Chỉ admin được phép" }, { status: 403 });

  // Xác thực admin
  const adminRaw = await KV.get(`user:${admin_email}`);
  if (!adminRaw) return Response.json({ error: "Admin không tồn tại" }, { status: 404 });
  const admin = JSON.parse(adminRaw);
  if (admin.pass !== admin_pass) return Response.json({ error: "Sai pass admin" }, { status: 403 });

  // Kiểm tra user
  const userRaw = await KV.get(`user:${email_user}`);
  if (!userRaw) return Response.json({ error: "User không tồn tại" }, { status: 404 });
  const user = JSON.parse(userRaw);

  const old_status = user.status || "live";
  if (!["live", "lock"].includes(new_status))
    return Response.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });

  user.status = new_status;
  await KV.put(`user:${email_user}`, JSON.stringify(user));

  // Ghi logger cho user và admin
  await addLogger(KV_LOGGER, email_user, {
    action: "lock_user",
    by: admin_email,
    meta: { old_status, new_status }
  });
  await addLogger(KV_LOGGER, admin_email, {
    action: "lock_user",
    by: admin_email,
    meta: { target: email_user, old_status, new_status }
  });

  return Response.json({ success: true });
}

// Logger helper (giữ nguyên như các file trước)
async function addLogger(KV_LOGGER, email_user, logObj) {
  const key = `logger:${email_user}`;
  const oldLogs = JSON.parse(await KV_LOGGER.get(key) || "[]");
  oldLogs.push({ timestamp: new Date().toISOString(), ...logObj });
  if (oldLogs.length > 500) oldLogs.shift();
  await KV_LOGGER.put(key, JSON.stringify(oldLogs), { expirationTtl: 30 * 86400 });
}
