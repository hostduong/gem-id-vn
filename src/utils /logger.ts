// ✅ utils/logger.ts - Ghi log thao tác vào KHOAI_KV_LOGGER
export async function writeLog(env, username, data) {
  const ts = Date.now();
  const key = `KHOAI/\/logger/\/user:${username}:${ts}`;
  return await env.KHOAI_KV_LOGGER.put(key, JSON.stringify({
    ...data,
    time: new Date(ts).toISOString()
  }));
}
