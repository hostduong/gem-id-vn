import { sha256 } from "../utils/hash";

export async function onRequestGet(context) {
  const { request, env } = context;
  const cookieHeader = request.headers.get("cookie") || "";
  const authHeader = request.headers.get("authorization") || "";
  const userAgent = request.headers.get("user-agent") || "";

  const cookieMatch = cookieHeader.match(/KHOAI=([a-zA-Z0-9]{60})/);
  const apiKey = authHeader.replace("Bearer ", "").trim();

  let username = "";

  // Ưu tiên xác thực bằng cookie
  if (cookieMatch) {
    const cookie = cookieMatch[1];
    const list = await env.KHOAI_KV_USER.list({ prefix: "KHOAI/\\/profile/\\/user:" });
    for (const key of list.keys) {
      const uname = key.name.split(":").pop();
      const data = await env.KHOAI_KV_COOKIE.get(`KHOAI/\\/cookie/\\/user:${uname}:${cookie}`, "json");
      if (data && data.browser === await sha256(userAgent + data.salt)) {
        username = uname;
        break;
      }
    }
  } else if (apiKey) {
    const salt = await env.KHOAI_KV_API_KEY.get(`KHOAI/\\/api_key/\\/token:${apiKey}`, "json");
    if (!salt) return new Response("API key không hợp lệ", { status: 403 });
    const hashKey = await sha256(apiKey + salt.salt);
    const apiData = await env.KHOAI_KV_API_KEY.get(`KHOAI/\\/api_key/\\/token:${hashKey}`, "json");
    if (apiData?.status === "active") {
      username = apiData.user;
    }
  }

  if (!username) return new Response("Không xác thực được người dùng", { status: 401 });

  const profile = await env.KHOAI_KV_USER.get(`KHOAI/\\/profile/\\/user:${username}`, "json");
  if (!profile) return new Response("Không tìm thấy hồ sơ người dùng", { status: 404 });

  return new Response(JSON.stringify({
    username,
    email: profile.email,
    name: profile.name,
    phone: profile.phone,
    coin: profile.coin,
    status: profile.status
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
