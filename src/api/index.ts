// ✅ src/api/index.ts – Static /api route handler

export async function onRequestGet(context) {
  const kv = context.env.KHOAI_KV_ROUTE;
  const latestRoute = await kv.get("route_latest");

  if (!latestRoute) {
    return new Response("Không có route động.", { status: 503 });
  }

  return new Response(JSON.stringify({
    route: `/api/${latestRoute}`
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
