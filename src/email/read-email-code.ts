export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const email = url.searchParams.get("email") || "";
  const reading = url.searchParams.get("reading") || "tick";

  // Bạn có thể thay thế đoạn dưới bằng Microsoft Graph API / Gmail API thật
  const fakeCode = "829136";

  return new Response(JSON.stringify({
    email,
    code: fakeCode,
    action: reading
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
