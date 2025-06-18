// ✅ admin/logger.ts - Trả log thao tác của user
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const username = url.searchParams.get("username");
  const prefix = `KHOAI/\/log/\/user:${username}`;
  const list = await context.env.KHOAI_KV_USER.list({ prefix });
  return new Response(JSON.stringify(list.keys.map(k => k.name)), {
    headers: { "Content-Type": "application/json" }
  });
}
