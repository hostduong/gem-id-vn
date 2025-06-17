// ✅ admin/lock-user.ts - Khoá hoặc mở tài khoản
export async function onRequestPost(context) {
  const { username = "", lock = true } = await context.request.json();
  const userKey = `KHOAI/\/profile/\/user:${username}`;
  const user = await context.env.KHOAI_KV_USER.get(userKey, "json");
  if (!user) return new Response("Không tìm thấy user", { status: 404 });
  user.status = lock ? "lock" : "live";
  await context.env.KHOAI_KV_USER.put(userKey, JSON.stringify(user));
  return new Response(`✅ Tài khoản đã được ${lock ? "khoá" : "mở"}`, { status: 200 });
}
