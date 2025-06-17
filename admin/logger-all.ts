
// ✅ admin/logger-all.ts
export async function onRequestGet(context) {
  const list = await context.env.KHOAI_KV_USER.list({ prefix: "KHOAI/\/log/" });
  return new Response(JSON.stringify(list.keys.map(k => k.name)), {
    headers: { "Content-Type": "application/json" }
  });
}
