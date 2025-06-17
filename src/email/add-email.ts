export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();
  const { username, email, password, type = "outlook", note = "" } = body;

  const kv = type === "gmail" ? env.KHOAI_KV_GMAIL : env.KHOAI_KV_OUTLOOK;
  const key = `KHOAI/\\/` + (type === "gmail" ? "gmail" : "email") + `/\\/user:${username}:${email}`;

  const exists = await kv.get(key);
  if (exists) return new Response("Email đã tồn tại", { status: 400 });

  const time = new Date().toISOString();
  await kv.put(key, JSON.stringify({
    password, refresh_token: "", access_token: "", client_id: "",
    recovery_phone: "", recovery_email: "", recovery_gmail: "",
    recovery_password: "", status_token: "Live", note, time_token: 0, time
  }));

  return new Response("Đã thêm email mới", { status: 200 });
}
