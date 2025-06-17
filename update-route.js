// ✅ update-route.js - Sinh route mới và cập nhật KV + deploy
const fs = require("fs");
const { execSync } = require("child_process");

(async () => {
  const crypto = await import("crypto");
  const newRoute = crypto.randomBytes(16).toString("base64url").slice(0, 24);
  const routeUrl = `https://gem.id.vn/api/${newRoute}`;
  console.log("✅ Đã cập nhật route:", newRoute);

  // ✅ Ghi vào KV route_latest
  const wranglerSecret = process.env.CLOUDFLARE_API_TOKEN;
  const wranglerAccount = "bbef1813ec9b7d5f8fa24e49120f64ee";
  const kvId = "8923fac56d1b42528f76d13ba473fe68";
  await fetch(`https://api.cloudflare.com/client/v4/accounts/${wranglerAccount}/storage/kv/namespaces/${kvId}/values/route_latest`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${wranglerSecret}`,
      "Content-Type": "text/plain"
    },
    body: newRoute
  });

  // ✅ Cập nhật wrangler.toml
  let toml = fs.readFileSync("wrangler.toml", "utf8");
  toml = toml.replace(/routes\s*=\s*\[[^\]]*\]/, `routes = ["${routeUrl}"]`);
  fs.writeFileSync("wrangler.toml", toml);

  // ✅ Git commit nếu thay đổi
  try {
    execSync(`git config --global user.name "Cloudflare Bot"`);
    execSync(`git config --global user.email "bot@gem.id.vn"`);

    execSync("git add wrangler.toml");
    execSync(`git commit -m "🔁 Update route to /api/${newRoute}"`);
    execSync("git push");
  } catch (err) {
    console.warn("⚠️ Không thể git commit (có thể không có gì thay đổi)");
  }

  // ✅ Deploy
  execSync(`npx wrangler deploy`, { stdio: "inherit" });
})();
