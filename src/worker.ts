export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname === "/api/register" && request.method === "POST") {
      // Handle API register...
    }
    return fetch(request); // Fallback UI tĩnh
  }
}
