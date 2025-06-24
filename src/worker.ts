export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    // Route API động, ví dụ:
    // if (url.pathname === "/api/register" && request.method === "POST") return ...;
    // Còn lại:
    return fetch(request);
  }
}
