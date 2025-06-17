// ✅ admin/update-user.ts
export async function onRequestPost(context) {
  const { username, updates = {} } = await context.request.json();
  const key = `KHOAI/\/profile/\/user:${username}`;
  const user = await context.env.KHOAI_KV_USER.get(key, "json");
  if (!user) return new Response("User không tồn tại", { status: 404 });
  for (const [k, v] of Object.entries(updates)) user[k] = v;
  await context.env.KHOAI_KV_USER.put(key, JSON.stringify(user));
  return new Response("✅ Đã cập nhật user", { status: 200 });
}
