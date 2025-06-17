const fs = require("fs");
const { execSync } = require("child_process");

(async () => {
  const crypto = await import("crypto");
  const newRoute = crypto.randomBytes(16).toString("base64url").slice(0, 24);
  const routeUrl = `https://gem.id.vn/api/${newRoute}`;
  console.log("✅ Đã tạo route mới:", routeUrl);

  // ✅ Ghi lại route vào KV bằng wrangler CLI (tự dùng namespace-id đã khai báo)
  execSync(`npx wrangler kv:key put route_latest ${newRoute} --namespace-id=8923fac56d1b42528f76d13ba473fe68`, {
    stdio: "inherit"
  });

  // ✅ Ghi route vào wrangler.toml
  let toml = fs.readFileSync("wrangler.toml", "utf8");
  toml = toml.replace(/routes\s*=\s*\[[^\]]*\]/, `routes = ["${routeUrl}"]`);
  fs.writeFileSync("wrangler.toml", toml);

  // ✅ Git commit nếu có thay đổi
  try {
    execSync(`git config --global user.name "AutoBot"`);
    execSync(`git config --global user.email "bot@gem.id.vn"`);
    execSync("git add wrangler.toml");
    execSync(`git commit -m "🔁 Update route to /api/${newRoute}"`);
    execSync("git push");
  } catch (err) {
    console.warn("⚠️ Không thể git commit (có thể không có thay đổi)");
  }

  // ✅ Deploy với route mới
  execSync(`npx wrangler deploy`, { stdio: "inherit" });
})();
