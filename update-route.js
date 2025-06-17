// ✅ update-route.js - Sinh route /api/<Base62> mới

const fs = require("fs");
const { execSync } = require("child_process");
const https = require("https");

// ⚙️ cấu hình
const CLOUDFLARE_ACCOUNT_ID = "bbef1813ec9b7d5f8fa24e49120f64ee";
const CLOUDFLARE_NAMESPACE_ID = "8923fac56d1b42528f76d13ba473fe68"; // KHOAI_KV_ROUTE
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ROUTE_DOMAIN = "gem.id.vn";

function randomBase62(len = 24) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({length: len}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function writeToKV(routeKey, value) {
  const options = {
    hostname: "api.cloudflare.com",
    path: `/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${CLOUDFLARE_NAMESPACE_ID}/values/${routeKey}`,
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "text/plain",
      "Content-Length": value.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      res.on("data", () => {});
      res.on("end", () => resolve(res.statusCode === 200));
    });
    req.on("error", reject);
    req.write(value);
    req.end();
  });
}

(async () => {
  const newRoute = randomBase62(24);

  // ✅ Update wrangler.toml
  const wranglerToml = fs.readFileSync("wrangler.toml", "utf8");
  const updated = wranglerToml.replace(/routes = \[.*?\]/, `routes = [ "https://${ROUTE_DOMAIN}/api/${newRoute}" ]`);
  fs.writeFileSync("wrangler.toml", updated);

  // ✅ Ghi route vào KV Cloudflare
  const ok = await writeToKV("route_latest", newRoute);
  if (!ok) {
    console.error("❌ Lỗi ghi KV");
    process.exit(1);
  }

  console.log("✅ Đã cập nhật route:", newRoute);

  // ✅ Commit & Push GitHub
  execSync("git add wrangler.toml");
  execSync(`git commit -m "🔁 Update route to /api/${newRoute}"`);
  execSync("git push");
})();
