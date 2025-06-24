export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname === "/api/register" && request.method === "POST") {
      // Xử lý API hoặc demo JSON
      return new Response(JSON.stringify({ ok: true, message: "API OK" }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    // Fallback: trả về file tĩnh (UI từ /public)
    return fetch(request);
  }
}
