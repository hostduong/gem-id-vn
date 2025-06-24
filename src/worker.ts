export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname === "/api/register" && request.method === "POST") {
      return new Response(JSON.stringify({ ok: true, message: "API OK" }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    // Để test, trả về trang đơn giản luôn (KHÔNG dùng fetch để loại trừ lỗi proxy file tĩnh):
    return new Response('<h1>Worker UI Test</h1>', { headers: { 'content-type': 'text/html' } });
  }
}
