import { sha256, randomBase62 } from "../../utils/hash";

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();
  const {
    email = "",
    password = "",
    ip = "",
    user_agent = "",
    twofa = "",
  } = body;

  const emailKey = `KHOAI/\\/profile/\\/email:${email}`;
  const emailMap = await env.KHOAI_KV_USER.get(emailKey, "json");
  if (!emailMap || !emailMap.user)
    return new Response("Email không tồn tại", { status: 400 });

  const userKey = `KHOAI/\\/profile/\\/user:${emailMap.user}`;
  const userData = await env.KHOAI_KV_USER.get(userKey, "json");
  if (!userData || userData.status === "lock")
    return new Response("Tài khoản bị khóa hoặc không tồn tại", { status: 403 });

  const hashedPass = await sha256(password + userData.salt);
  if (hashedPass !== userData.pass)
    return new Response("Sai mật khẩu", { status: 401 });

  // 2FA xác thực
  if (userData.open_twofa === "on" && twofa !== userData.twofa)
    return new Response("Mã xác thực 2FA không hợp lệ", { status: 401 });

  // IP whitelist
  if (
    userData.open_ip === "on" &&
    Array.isArray(userData.on_ip) &&
    userData.on_ip.length > 0 &&
    !userData.on_ip.includes(ip)
  ) {
    return new Response("IP không nằm trong danh sách cho phép", { status: 403 });
  }

  // Cập nhật IP và browser
  const updateUser = { ...userData };
  updateUser.ip = Array.isArray(updateUser.ip) ? updateUser.ip : [];
  updateUser.browser = Array.isArray(updateUser.browser) ? updateUser.browser : [];
  if (!updateUser.ip.includes(ip)) updateUser.ip.push(ip);
  if (!updateUser.browser.includes(user_agent)) updateUser.browser.push(user_agent);
  await env.KHOAI_KV_USER.put(userKey, JSON.stringify(updateUser));

  // Tạo cookie xác thực
  const cookie = randomBase62(60);
  const salt = randomBase62(15);
  const hashedBrowser = await sha256(user_agent + salt);
  const time = Math.floor(Date.now() / 1000);
  await env.KHOAI_KV_COOKIE.put(
    `KHOAI/\\/cookie/\\/user:${emailMap.user}:${cookie}`,
    JSON.stringify({ salt, browser: hashedBrowser, time }),
    { expirationTtl: 60 * 60 * 24 * 7 } // TTL 7 ngày
  );

  // Trả route hiện tại
  const latestRoute = (await env.KHOAI_KV_ROUTE.get("route_latest")) || "route1";
  return new Response(
    JSON.stringify({
      cookie,
      route: `/api/${latestRoute}`,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
