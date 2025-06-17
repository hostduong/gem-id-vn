// ✅ admin/create-api-key.ts
import { randomBase62, sha256 } from "../utils/hash";
export async function onRequestPost(context) {
  const { username } = await context.request.json();
  const newKey = randomBase62(60);
  const salt = randomBase62(15);
  const hash = await sha256(newKey + salt);
  await context.env.KHOAI_KV_API_KEY.put(`KHOAI/\/api_key/\/token:${newKey}`, JSON.stringify({ salt }));
  await context.env.KHOAI_KV_API_KEY.put(`KHOAI/\/api_key/\/token:${hash}`, JSON.stringify({
    user: username,
    status: "active",
    time: Math.floor(Date.now() / 1000)
  }));
  return new Response(JSON.stringify({ api_key: newKey }), {
    headers: { "Content-Type": "application/json" }
  });
}
