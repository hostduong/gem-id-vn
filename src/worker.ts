export default {
  async fetch(request: Request) {
    // Route API
    const url = new URL(request.url);
    if (url.pathname === "/api/register") {
      return new Response(JSON.stringify({ ok: true, message: "Đăng ký thành công demo!" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Route UI tĩnh
    // Cloudflare sẽ tự động trả về file tĩnh trong /public nếu không có export fetch override toàn bộ
    // Vì vậy, chỉ cần trả về Response 404 nếu không match
    return new Response("404 Not Found", { status: 404 });
  }
};
