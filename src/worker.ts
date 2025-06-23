export default {
  async fetch(request: Request) {
    return new Response("Hello from Cloudflare Worker!");
  }
};
