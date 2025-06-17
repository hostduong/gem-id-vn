// ✅ coin/add.ts – Nạp coin vào tài khoản
export async function onRequestPost(context) {
  const { request, env } = context;
  const { username, amount = 0, note = "Nạp thủ công", invoice = "manual", ip = "", browser = "" } = await request.json();
  const userKey = `KHOAI/\/profile/\/user:${username}`;
  const user = await env.KHOAI_KV_USER.get(userKey, "json");
  if (!user) return new Response("User không tồn tại", { status: 404 });

  user.coin += amount;
  user.total += amount;
  await env.KHOAI_KV_USER.put(userKey, JSON.stringify(user));

  const ts = Date.now();
  await env.KHOAI_KV_COIN.put(`KHOAI/\/coin/\/user:${username}:${ts}`, JSON.stringify({
    type: "Nạp",
    invoice,
    note,
    ip,
    browser,
    coin: amount,
    total_coin: user.coin,
    time: new Date(ts).toISOString()
  }));

  return new Response("✅ Nạp thành công", { status: 200 });
}
