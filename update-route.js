const fs = require("fs");
const { execSync } = require("child_process");

function randomBase62(length = 24) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

(async () => {
  const newRoute = randomBase62(24);
  const routeUrl = `https://gem.id.vn/api/${newRoute}`;
  console.log("✅ Route mới:", routeUrl);

  // ✅ Ghi KV bằng fetch
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

  // ✅ Ghi lại wrangler.toml
  let toml = fs.readFileSync("wrangler.toml", "utf8");
  const routeBlock = `routes = [ "${routeUrl}" ]`;
  toml = toml.replace(/routes\s*=\s*\[[\s\S]*?\]/, routeBlock);
  fs.writeFileSync("wrangler.toml", toml);

  // ✅ Commit Git nếu có thay đổi
  try {
    execSync(`git config --global user.name "AutoBot"`);
    execSync(`git config --global user.email "bot@gem.id.vn"`);
    execSync("git add wrangler.toml");
    execSync(`git commit -m "🔁 Update route to /api/${newRoute}"`);
    execSync("git push");
  } catch (err) {
    console.warn("⚠️ Không thể git commit:", err.message);
  }

  // ✅ Deploy theo wrangler.toml
  execSync(`npx wrangler deploy --config=wrangler.toml`, { stdio: "inherit" });
})();
