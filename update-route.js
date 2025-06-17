// ✅ update-route.js – tạo route mới + ghi KV + sửa wrangler.toml + deploy

const fs = require("fs");
const { execSync } = require("child_process");

(async () => {
  const crypto = await import("crypto");
  const newRoute = crypto.randomBytes(16).toString("base64url").slice(0, 24);
  const routeUrl = `https://gem.id.vn/api/${newRoute}`;
  console.log("✅ Route mới:", routeUrl);

  // ✅ Ghi route mới vào KV
  const wranglerSecret = process.env.CLOUDFLARE_API_TOKEN;
  const wranglerAccount = "bbef1813ec9b7d5f8fa24e49120f64ee";
  const kvId = "8923fac56d1b42528f76d13ba473fe68";

  const putRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${wranglerAccount}/storage/kv/namespaces/${kvId}/values/route_latest`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${wranglerSecret}`,
      "Content-Type": "text/plain"
    },
    body: newRoute
  });

  if (!putRes.ok) {
    console.error("❌ Ghi KV thất bại:", await putRes.text());
    process.exit(1);
  }

  // ✅ Ghi lại wrangler.toml để tiện đọc/debug (không bắt buộc commit)
  try {
    let toml = fs.readFileSync("wrangler.toml", "utf8");
    toml = toml.replace(/routes\s*=\s*\[[^\]]*\]/, `routes = ["${routeUrl}"]`);
    fs.writeFileSync("wrangler.toml", toml);
  } catch (err) {
    console.warn("⚠️ Không thể ghi wrangler.toml:", err.message);
  }

  // ✅ Commit thay đổi (nếu chạy từ GitHub Action và có quyền push)
  try {
    execSync(`git config --global user.name "AutoBot"`);
    execSync(`git config --global user.email "bot@gem.id.vn"`);
    execSync("git add wrangler.toml");
    execSync(`git commit -m "🔁 Update route to /api/${newRoute}"`);
    execSync("git push");
  } catch (err) {
    console.warn("⚠️ Bỏ qua git commit:", err.message);
  }

  // ✅ Deploy sử dụng chính wrangler.toml
  try {
    execSync("npx wrangler deploy --config=wrangler.toml", { stdio: "inherit" });
  } catch (err) {
    console.error("❌ Deploy thất bại:", err.message);
    process.exit(1);
  }
})();
