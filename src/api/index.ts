// ✅ src/api/index.ts – Entry point chuẩn cho Worker

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const kv = env.KHOAI_KV_ROUTE;
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
};
