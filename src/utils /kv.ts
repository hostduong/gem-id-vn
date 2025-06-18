// ✅ utils/kv.ts - Hàm đọc/ghi/xoá KV dạng JSON cho namespace động
export async function getJson(env, key, namespace = "KHOAI_KV_USER") {
  return await env[namespace].get(key, "json");
}

export async function putJson(env, key, data, namespace = "KHOAI_KV_USER") {
  return await env[namespace].put(key, JSON.stringify(data));
}

export async function delKey(env, key, namespace = "KHOAI_KV_USER") {
  return await env[namespace].delete(key);
}
