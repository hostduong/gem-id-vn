export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();
  const { email } = body;

  const emailKey = `KHOAI/\\/profile/\\/email:${email}`;
  const map = await env.KHOAI_KV_USER.get(emailKey, "json");
  if (!map || !map.user) return new Response("Email không tồn tại", { status: 404 });

  const userKey = `KHOAI/\\/profile/\\/user:${map.user}`;
  const user = await env.KHOAI_KV_USER.get(userKey, "json");

  // Trả về mã 2FA đã đăng ký (bạn có thể gửi qua SMTP/mail nếu cần)
  return new Response(JSON.stringify({ username: map.user, twofa: user.twofa }), {
    headers: { "Content-Type": "application/json" }
  });
}
