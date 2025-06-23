import register from './api/register';
// import các file API khác ở đây nếu có

// Static asset handler
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // 1. Route API
    if (url.pathname === "/api/register" && request.method === "POST") {
      return await register(request, env, ctx);
    }
    // Thêm các API khác ở đây (login, profile...)

    // 2. Tất cả các đường dẫn khác (UI tĩnh)
    try {
      return await getAssetFromKV({ request, waitUntil: ctx.waitUntil });
    } catch (e) {
      // Trả về 404 nếu không tìm thấy file tĩnh
      return new Response("404 Not Found", { status: 404 });
    }
  }
};
