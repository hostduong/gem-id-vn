// ✅ admin/disable-api-key.ts - Vô hiệu hoá API key
export async function onRequestPost(context) {
  const { api_key } = await context.request.json();
  const salt = await context.env.KHOAI_KV_API_KEY.get(`KHOAI/\/api_key/\/token:${api_key}`, "json");
  if (!salt) return new Response("API key không hợp lệ", { status: 400 });
  const hash = await sha256(api_key + salt.salt);
  const data = await context.env.KHOAI_KV_API_KEY.get(`KHOAI/\/api_key/\/token:${hash}`, "json");
  if (!data) return new Response("Không tìm thấy thông tin key", { status: 404 });
  data.status = "revoked";
  await context.env.KHOAI_KV_API_KEY.put(`KHOAI/\/api_key/\/token:${hash}`, JSON.stringify(data));
  return new Response("✅ Đã vô hiệu hoá key", { status: 200 });
}
