// ✅ utils/cookie.ts - Gia hạn TTL cookie, sinh cookie mới, giữ cookie cũ thêm 5 phút
export async function renewCookie(env, username, cookie, userAgent) {
  const oldKey = `KHOAI/\/cookie/\/user:${username}:${cookie}`;
  const old = await env.KHOAI_KV_COOKIE.get(oldKey, "json");
  if (!old) return null;

  const newCookie = randomBase62(60);
  const newSalt = randomBase62(15);
  const newBrowserHash = await sha256(userAgent + newSalt);
  const now = Math.floor(Date.now() / 1000);

  await env.KHOAI_KV_COOKIE.put(`KHOAI/\/cookie/\/user:${username}:${newCookie}`, JSON.stringify({
    salt: newSalt,
    browser: newBrowserHash,
    time: now
  }), { expirationTtl: 60 * 60 * 24 * 7 });

  // giữ cookie cũ sống thêm 5 phút
  await env.KHOAI_KV_COOKIE.put(oldKey, JSON.stringify(old), { expirationTtl: 60 * 5 });
  return newCookie;
}
