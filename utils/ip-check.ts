// ✅ utils/ip-check.ts - Hàm isIPAllowed() để kiểm tra IP theo cấu hình use
export function isIPAllowed(user, ip) {
  if (user.open_ip !== "on") return true;
  return Array.isArray(user.on_ip) && user.on_ip.includes(ip);
}
