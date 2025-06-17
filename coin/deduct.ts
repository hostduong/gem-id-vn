// ✅ coin/deduct.ts – Trừ coin khi mua
export async function onRequestPost(context) {
  const { request, env } = context;
  const { username, amount = 0, note = "Mua tài nguyên", invoice = "auto", ip = "", browser = "" } = await request.json();
  const userKey = `KHOAI/\/profile/\/user:${username}`;
  const user = await env.KHOAI_KV_USER.get(userKey, "json");
  if (!user) return new Response("User không tồn tại", { status: 404 });
  if (user.coin < amount) return new Response("Không đủ coin", { status: 400 });

  user.coin -= amount;
  await env.KHOAI_KV_USER.put(userKey, JSON.stringify(user));

  const ts = Date.now();
  await env.KHOAI_KV_COIN.put(`KHOAI/\/coin/\/user:${username}:${ts}`, JSON.stringify({
    type: "Mua",
    invoice,
    note,
    ip,
    browser,
    coin: -amount,
    total_coin: user.coin,
    time: new Date(ts).toISOString()
  }));

  return new Response("✅ Đã trừ coin", { status: 200 });
}
