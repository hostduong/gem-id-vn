// Demo API: /api/register
export async function handleRegister(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  // Demo: Trả về JSON mẫu (bạn thay bằng logic thật khi cần)
  return new Response(JSON.stringify({ ok: true, message: "Đăng ký thành công (demo)!" }), {
    headers: { "Content-Type": "application/json" }
  });
}

// Serve static file từ /public
async function serveStatic(request: Request): Promise<Response> {
  const url = new URL(request.url);
  let path = url.pathname;
  if (path === "/") path = "/index.html";
  // Đảm bảo path hợp lệ
  try {
    // Tìm file trong bucket (public/)
    // @ts-ignore
    const file = await PUBLIC.fetch(path);
    if (file && file.status === 200) return file;
    // Nếu không có, trả về 404
    return new Response("Not found", { status: 404 });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // Nếu là API
    if (url.pathname === "/api/register") {
      return await handleRegister(request);
    }

    // Nếu là static UI
    return await serveStatic(request);
  }
};
