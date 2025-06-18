export async function onRequestPost(context) {
  const { request, env } = context;
  const { username, email, type = "outlook", updates = {} } = await request.json();

  const kv = type === "gmail" ? env.KHOAI_KV_GMAIL : env.KHOAI_KV_OUTLOOK;
  const key = `KHOAI/\\/` + (type === "gmail" ? "gmail" : "email") + `/\\/user:${username}:${email}`;
  const record = await kv.get(key, "json");

  if (!record) return new Response("Email không tồn tại", { status: 404 });

  for (const [k, v] of Object.entries(updates)) {
    record[k] = v;
  }

  await kv.put(key, JSON.stringify(record));
  return new Response("✅ Đã cập nhật email", { status: 200 });
}
