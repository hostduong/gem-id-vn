// ✅ update-route.js - Sinh route /api/<Base62> mới

const fs = require("fs");
const { execSync } = require("child_process");

function randomBase62(len = 20) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({length: len}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const newRoute = randomBase62(24);
const wranglerToml = fs.readFileSync("wrangler.toml", "utf8");
const updated = wranglerToml.replace(/routes = \[.*?\]/, `routes = [ "https://tenmien.com/api/${newRoute}" ]`);
fs.writeFileSync("wrangler.toml", updated);

console.log("✅ Updated route:", newRoute);

// Optional auto commit & push
execSync("git add wrangler.toml");
execSync(`git commit -m "🔁 Update route to /api/${newRoute}"`);
execSync("git push");
