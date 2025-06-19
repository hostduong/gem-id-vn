// src/auth/update-ip.ts
import { sha256 } from "../utils/hash";

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();

  const { cookie = "", open_ip = "", on_ip = "", password = "" } = body;
  if (!cookie || !password) {
    return new Response("Thiếu cookie hoặc password", { status: 400 });
  }

  // 1. Tìm user theo cookie
  const list = await env.KHOAI_KV_COOKIE.list({ prefix: "KHOAI/\\/cookie/\\/user:" });
  let username = "";
  for (const k of list.keys) {
    if (k.name.includes(`:${cookie}`)) {
      const parts = k.name.split(":");
      username = parts[1] || "";
      break;
    }
  }
  if (!username) return new Response("Cookie không hợp lệ", { status: 403 });

  const userKey = `KHOAI/\/profile/\/user:${username}`;
  const userData = await env.KHOAI_KV_USER.get(userKey, "json");
  if (!userData) return new Response("Tài khoản không tồn tại", { status: 404 });

  // 2. Kiểm tra password
  const hashed = await sha256(password + userData.salt);
  if (hashed !== userData.pass) return new Response("Sai password", { status: 401 });

  // 3. Xử lý IP
  if (open_ip === "on") {
    if (!on_ip || typeof on_ip !== "string") {
      return new Response("Vui lòng nhập danh sách IP", { status: 400 });
    }

    const ipList = on_ip.split(",").map(ip => ip.trim()).filter(Boolean);
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    for (const ip of ipList) {
      if (!ipRegex.test(ip)) {
        return new Response(`IP không hợp lệ: ${ip}`, { status: 400 });
      }
    }

    userData.open_ip = "on";
    userData.on_ip = ipList;
  } else {
    userData.open_ip = "off";
    userData.on_ip = [];
  }

  await env.KHOAI_KV_USER.put(userKey, JSON.stringify(userData));
  return new Response("\u2705 Cập nhật thành công", { status: 200 });
}
