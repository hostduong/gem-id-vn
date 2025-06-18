const fs = require("fs");
const path = require("path");

const folders = ["auth", "email", "admin", "coin"];
const handlerPath = path.join(__dirname, "src", "handlers");
fs.mkdirSync(handlerPath, { recursive: true }); // 🔁 Tạo thư mục nếu chưa có

let output = `// ✅ Auto-generated handlers/index.ts\n`;

for (const folder of folders) {
  const folderDir = path.join(__dirname, "src", folder);
  if (!fs.existsSync(folderDir)) {
    console.warn(`⚠️ Folder not found: ${folderDir}`);
    continue;
  }

  const files = fs.readdirSync(folderDir).filter(f => f.endsWith(".ts"));
  for (const file of files) {
    const name = file.replace(".ts", "");
    output += `export { default as "${name}" } from "../${folder}/${file}";\n`;
  }
}

const filePath = path.join(handlerPath, "index.ts");
fs.writeFileSync(filePath, output);
console.log("✅ handlers/index.ts đã được tạo:", filePath);

try {
  execSync("git add src/handlers/index.ts");
  execSync('git commit -m "🔁 Auto update handlers/index.ts"');
  execSync("git push");
} catch (err) {
  console.warn("⚠️ Không thể commit tự động:", err.message);
}

