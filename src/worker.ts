import register from './api/register';

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname === "/api/register" && request.method === "POST") {
      return await register(request, env, ctx);
    }
    // Không xử lý gì nữa (UI tĩnh Cloudflare auto serve)
  }
}
