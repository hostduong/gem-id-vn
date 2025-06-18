// ✅ generate-handlers-index.js – Tự động sinh handlers/index.ts
const fs = require("fs");
const path = require("path");

const folders = ["auth", "email", "admin", "coin"];
const handlersDir = path.join(__dirname, "src", "handlers");

// ✅ Tạo thư mục nếu chưa có
fs.mkdirSync(handlersDir, { recursive: true });

let output = `// ✅ Auto-generated file\n`;

for (const folder of folders) {
  const folderDir = path.join(__dirname, "src", folder);
  if (!fs.existsSync(folderDir)) continue;

  const files = fs.readdirSync(folderDir).filter(f => f.endsWith(".ts"));
  for (const file of files) {
    const name = file.replace(".ts", "");
    output += `export { default as "${name}" } from "../${folder}/${file}";\n`;
  }
}

const indexPath = path.join(handlersDir, "index.ts");
fs.writeFileSync(indexPath, output, "utf8");
console.log("✅ handlers/index.ts đã được ghi:", indexPath);

// ✅ Nếu cần commit lại:
try {
  execSync("git add src/handlers/index.ts");
  execSync('git commit -m "🔁 Update handlers/index.ts"');
  execSync("git push");
} catch (err) {
  console.warn("⚠️ Không commit vì không có thay đổi mới");
}
