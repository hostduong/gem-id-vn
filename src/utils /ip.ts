// ✅ utils/ip.ts - Hàm isIPAllowed() để kiểm tra IP theo cấu hình use
export function isIPAllowed(user, ip) {
  if (user.open_ip !== "on") return true;
  return Array.isArray(user.on_ip) && user.on_ip.includes(ip);
}

export function logIP(env, username, ip, browser) {
  const key = `KHOAI/\/iplog/\/user:${username}:${Date.now()}`;
  const data = { ip, browser, time: new Date().toISOString() };
  return env.KHOAI_KV_LOGGER.put(key, JSON.stringify(data));
}
