const fs = require("fs");
const { execSync } = require("child_process");

// ✅ Hàm tạo chuỗi Base62
function randomBase62(length = 24) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

(async () => {
  const newRoute = randomBase62(24);
  const routeUrl = `https://gem.id.vn/api/${newRoute}`;
  console.log("✅ Route mới:", routeUrl);

  // ✅ Ghi route vào KV sử dụng wrangler CLI
  execSync(`npx wrangler kv:key put route_latest ${newRoute} --namespace-id=8923fac56d1b42528f76d13ba473fe68`, {
    stdio: "inherit"
  });

  // ✅ Ghi lại wrangler.toml (chỉ để debug)
  let toml = fs.readFileSync("wrangler.toml", "utf8");
  toml = toml.replace(/routes\s*=\s*\[[^\]]*\]/, `routes = ["${routeUrl}"]`);
  fs.writeFileSync("wrangler.toml", toml);

  // ✅ Commit nếu có thay đổi
  try {
    execSync(`git config --global user.name "AutoBot"`);
    execSync(`git config --global user.email "bot@gem.id.vn"`);
    execSync("git add wrangler.toml");
    execSync(`git commit -m "🔁 Update route to /api/${newRoute}"`);
    execSync("git push");
  } catch (err) {
    console.warn("⚠️ Không thể git commit:", err.message);
  }

  // ✅ Deploy theo wrangler.toml để binding tự động hoạt động
  execSync(`npx wrangler deploy --config=wrangler.toml`, { stdio: "inherit" });
})();
