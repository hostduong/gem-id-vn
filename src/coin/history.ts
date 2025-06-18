// ✅ coin/history.ts – Lịch sử giao dịch
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const username = url.searchParams.get("username") || "";
  const prefix = `KHOAI/\/coin/\/user:${username}`;
  const list = await context.env.KHOAI_KV_COIN.list({ prefix });
  const result = [];

  for (const entry of list.keys) {
    const data = await context.env.KHOAI_KV_COIN.get(entry.name, "json");
    if (data) result.push(data);
  }

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  });
}
