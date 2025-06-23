import register from './api/register';
// import các API khác...

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // Route API
    if (url.pathname === "/api/register" && request.method === "POST") {
      return await register(request, env, ctx);
    }
    // Thêm route API khác...

    // Serve static UI: để Cloudflare tự động trả về file từ /public/
    // Nếu không tìm thấy file, trả 404
    const filePath = url.pathname === "/" ? "/index.html" : url.pathname;
    // @ts-ignore
    const file = await PUBLIC.fetch(filePath);
    if (file && file.status === 200) return file;
    return new Response("404 Not Found", { status: 404 });
  }
};
