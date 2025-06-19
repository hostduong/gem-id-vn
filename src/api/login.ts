import { sha256, randomBase62 } from "../../utils/hash";

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();
  const { uid = "", pass = "", token = "", user_agent = "", ip = "" } = body;

  // ✅ 1. Kiểm tra token SHA-256 tạm
  const now = new Date();
  const expected = await sha256("abc123" + now.getUTCHours());
  if (token !== expected) {
    return new Response(JSON.stringify({ message: "Sai token tạm thời" }), { status: 403 });
  }

  // ✅ 2. Tìm user qua email hoặc username
  const emailKey = `KHOAI/\\/profile/\\/email:${uid}`;
  const emailMap = await env.KHOAI_KV_USER.get(emailKey, "json");

  const username = emailMap?.user || uid;
  const userKey = `KHOAI/\\/profile/\\/user:${username}`;
  const user = await env.KHOAI_KV_USER.get(userKey, "json");

  if (!user || user.status === "lock")
    return new Response(JSON.stringify({ message: "Tài khoản không tồn tại hoặc bị khóa" }), { status: 403 });

  const hashed = await sha256(pass + user.salt);
  if (hashed !== user.pass)
    return new Response(JSON.stringify({ message: "Sai mật khẩu" }), { status: 401 });

  // ✅ 3. Tạo cookie mới
  const cookie = randomBase62(60);
  const salt = randomBase62(15);
  const hashedBrowser = await sha256(user_agent + salt);
  const time = Math.floor(Date.now() / 1000);

  await env.KHOAI_KV_COOKIE.put(
    `KHOAI/\\/cookie/\\/user:${username}:${cookie}`,
    JSON.stringify({ salt, browser: hashedBrowser, time }),
    { expirationTtl: 60 * 60 * 24 * 7 }
  );

  // ✅ 4. Trả cookie HTTPOnly
  return new Response(
    JSON.stringify({ success: true, user: username }),
    {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `session=${cookie}; Path=/; Max-Age=604800; HttpOnly; SameSite=Lax`
      }
    }
  );
}
