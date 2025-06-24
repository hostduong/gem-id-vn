export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    return new Response('<h1>Worker test OK</h1>', { headers: { 'content-type': 'text/html' } });
  }
}
