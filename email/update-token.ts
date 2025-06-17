export async function onRequestPost(context) {
  const { request, env } = context;
  const { username, email, refresh_token, access_token, type = "outlook" } = await request.json();

  const kv = type === "gmail" ? env.KHOAI_KV_GMAIL : env.KHOAI_KV_OUTLOOK;
  const key = `KHOAI/\\/` + (type === "gmail" ? "gmail" : "email") + `/\\/user:${username}:${email}`;
  const record = await kv.get(key, "json");

  if (!record) return new Response("Email không tồn tại", { status: 404 });

  record.refresh_token = refresh_token;
  record.access_token = access_token;
  record.time_token = Math.floor(Date.now() / 1000);

  await kv.put(key, JSON.stringify(record));
  return new Response("✅ Token đã được cập nhật", { status: 200 });
}
