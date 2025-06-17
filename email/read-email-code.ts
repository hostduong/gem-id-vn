export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const email = url.searchParams.get("email") || "";
  const reading = url.searchParams.get("reading") || "tick";

  // TODO: Tích hợp với Gmail/Microsoft API
  const mockCode = "168947";

  return new Response(JSON.stringify({
    email,
    code: mockCode,
    action: reading
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
