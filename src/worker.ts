import { getAssetFromKV } from "@cloudflare/kv-asset-handler";

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    // Route API động trước (nếu có)
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      // ...handle API here...
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" }
      });
    }

    // Serve static asset (UI) từ /public
    try {
      return await getAssetFromKV({ request, waitUntil: ctx.waitUntil });
    } catch (e) {
      return new Response("404 Not Found", { status: 404 });
    }
  }
}
