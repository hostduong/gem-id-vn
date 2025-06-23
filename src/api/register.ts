function randomBase62(length = 20) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; ++i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

async function sha256(str: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(x => x.toString(16).padStart(2, '0')).join('');
}

async function getNextUserId(env) {
  const countKey = "KHOAI__user__counter";
  let id = parseInt((await env.KHOAI_KV_USER.get(countKey)) || "100000", 10) + 1;
  await env.KHOAI_KV_USER.put(countKey, id.toString());
  return id.toString();
}

export default async function register(request: Request, env: any, ctx: ExecutionContext) {
  const body = await request.json();
  const { fullname, email, password, phone, pin } = body;

  // Validate input
  if (!fullname || !email || !password || !phone || !pin) {
    return new Response(JSON.stringify({ ok: false, message: "Thiếu thông tin." }), { status: 400 });
  }
  if (!/^\d{6}$/.test(pin)) return new Response(JSON.stringify({ ok: false, message: "Mã PIN phải 6 số." }), { status: 400 });
  if (password.length < 8) return new Response(JSON.stringify({ ok: false, message: "Mật khẩu tối thiểu 8 ký tự." }), { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(email)) return new Response(JSON.stringify({ ok: false, message: "Email không hợp lệ." }), { status: 400 });
  if (!/^\d{10,11}$/.test(phone)) return new Response(JSON.stringify({ ok: false, message: "Số điện thoại không hợp lệ." }), { status: 400 });

  // Check email trùng
  const emailKey = `KHOAI__profile__email:${email.toLowerCase()}`;
  const emailMap = await env.KHOAI_KV_USER.get(emailKey, "json");
  if (emailMap?.user) return new Response(JSON.stringify({ ok: false, message: "Email đã tồn tại." }), { status: 409 });

  // Sinh id tự tăng
  const id = await getNextUserId(env);

  // Tạo username
  const username = `u${id}`;

  // Sinh salt & token
  const salt = randomBase62(20);
  const token = randomBase62(60);
  const hashPass = await sha256(password + salt);
  const hashPin = await sha256(pin + salt);
  const hashToken = await sha256(token + salt);

  const now = Math.floor(Date.now() / 1000);

  // Lưu profile
  const userProfile = {
    id,
    status: "live",
    ban_reason: "",
    role: "user",
    verified_email: "false",
    email: email.toLowerCase(),
    salt,
    pass: hashPass,
    fullname,
    phone,
    pin: hashPin,
    open_pin: "false",
    ip_whitelist: [],
    open_ip: "false",
    ip_logged: [],
    ua_logged: [],
    country: "",
    language: "vi",
    coin: 0,
    total: 0,
    mail_total_save: 0,
    time: now,
    token: hashToken,
    token_tiktok: "",
    token_facebook: "",
    token_zalo: ""
  };

  // Ghi vào KV
  await env.KHOAI_KV_USER.put(`KHOAI__profile__user:${username}`, JSON.stringify(userProfile));
  await env.KHOAI_KV_USER.put(emailKey, JSON.stringify({ user: username }));
  await env.KHOAI_KV_USER.put(`KHOAI__profile__id:${id}`, JSON.stringify({ user: username }));

  // Lưu salt-token vào KV_TOKEN
  await env.KHOAI_KV_TOKEN.put(`KHOAI__token__salt:${salt}`, JSON.stringify({ time: now }));
  await env.KHOAI_KV_TOKEN.put(`KHOAI__token__user:${hashToken}`, JSON.stringify({
    status: "live",
    ban_reason: "",
    user: username,
    time: now
  }));

  // Trả về cho client
  return new Response(JSON.stringify({
    ok: true,
    message: "Đăng ký thành công!",
    username,
    token,
    id
  }), { status: 200 });
}
