export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname === "/api/register" && request.method === "POST") {
      // Bắt buộc phải return Response, ví dụ:
      return new Response(JSON.stringify({ok: true, message: "API OK"}), {
        headers: {"Content-Type": "application/json"}
      });
    }
    return fetch(request); // Fallback UI tĩnh
  }
}
