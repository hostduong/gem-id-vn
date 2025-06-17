// ✅ admin/user-emails.ts
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const username = url.searchParams.get("username") || "";
  const prefixGmail = `KHOAI/\/gmail/\/user:${username}`;
  const prefixOutlook = `KHOAI/\/email/\/user:${username}`;
  const gmailList = await context.env.KHOAI_KV_GMAIL.list({ prefix: prefixGmail });
  const outlookList = await context.env.KHOAI_KV_OUTLOOK.list({ prefix: prefixOutlook });
  const emails = [...gmailList.keys, ...outlookList.keys].map(k => k.name.split(":").slice(-1)[0]);
  return new Response(JSON.stringify(emails), {
    headers: { "Content-Type": "application/json" }
  });
}
