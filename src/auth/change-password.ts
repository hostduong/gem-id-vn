import { sha256 } from "../utils/hash";

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();
  const { username, old_password = "", new_password = "", twofa = "" } = body;

  const key = `KHOAI/\\/profile/\\/user:${username}`;
  const user = await env.KHOAI_KV_USER.get(key, "json");
  if (!user) return new Response("User không tồn tại", { status: 404 });

  const checkOld = await sha256(old_password + user.salt);
  const validPass = checkOld === user.pass;
  const valid2FA = user.open_twofa !== "on" || (twofa === user.twofa);

  if (!validPass && !valid2FA)
    return new Response("Bạn cần nhập đúng pass cũ hoặc 2FA", { status: 403 });

  const newHashed = await sha256(new_password + user.salt);
  user.pass = newHashed;
  await env.KHOAI_KV_USER.put(key, JSON.stringify(user));

  return new Response("Đổi mật khẩu thành công", { status: 200 });
}
