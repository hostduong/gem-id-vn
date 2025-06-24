export default {
  async fetch(request, env, ctx) {
    // Route API
    if (request.url.endsWith("/api/test")) {
      return new Response(JSON.stringify({ok: true}), {headers: {"Content-Type": "application/json"}});
    }
    // Trả file tĩnh, Worker tự serve /public/*
    return fetch(request);
  }
}
