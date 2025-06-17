export async function onRequestPost(context) {
  const { request, env } = context;
  const { username, email, type = "outlook" } = await request.json();

  const kv = type === "gmail" ? env.KHOAI_KV_GMAIL : env.KHOAI_KV_OUTLOOK;
  const key = `KHOAI/\\/` + (type === "gmail" ? "gmail" : "email") + `/\\/user:${username}:${email}`;

  await kv.delete(key);
  return new Response("✅ Đã xoá email", { status: 200 });
}
