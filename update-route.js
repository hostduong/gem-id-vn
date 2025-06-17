// ✅ update-route.js
const fs = require("fs");
const { execSync } = require("child_process");

(async () => {
  const crypto = await import("crypto");
  const newRoute = crypto.randomBytes(16).toString("base64url").slice(0, 24); // Base62
  const routeUrl = `https://gem.id.vn/api/${newRoute}`;
  console.log("✅ Đã cập nhật route:", newRoute);

  // ✅ Ghi route vào KV
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

  // ✅ Ghi vào wrangler.toml
  let toml = fs.readFileSync("wrangler.toml", "utf-8");
  toml = toml.replace(/\/api\/[a-zA-Z0-9]+/g, `/api/${newRoute}`);
  fs.writeFileSync("wrangler.toml", toml);

  // ✅ (Tuỳ chọn) Commit + Push nếu dùng trong GitHub Action
  try {
    execSync("git add wrangler.toml");
    execSync(`git commit -m "🔁 Update route to /api/${newRoute}"`);
    execSync("git push");
  } catch (e) {
    console.warn("⚠️ Không thể git commit (có thể không thay đổi gì)");
  }

  // ✅ Deploy (dùng cấu hình wrangler.toml)
  execSync("npx wrangler deploy", { stdio: "inherit" });
})();
