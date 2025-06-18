// ✅ generate-handlers-index.js – Auto-generate src/handlers/index.ts

const fs = require("fs");
const path = require("path");

// 📁 Các thư mục có thể chứa file handler
const folders = ["auth", "email", "admin", "coin"];
const handlersDir = path.join(__dirname, "src", "handlers");

// 🔧 Đảm bảo thư mục tồn tại
fs.mkdirSync(handlersDir, { recursive: true });

let output = `// ✅ Auto-generated handlers/index.ts\n`;

for (const folder of folders) {
  const dir = path.join(__dirname, "src", folder);
  if (!fs.existsSync(dir)) continue;

  const files = fs.readdirSync(dir).filter(f => f.endsWith(".ts"));
  for (const file of files) {
    const name = file.replace(".ts", "");
    output += `export { default as "${name}" } from "../${folder}/${file}";\n`;
  }
}

// 📄 Ghi vào handlers/index.ts (ghi đè luôn nếu có)
const indexFilePath = path.join(handlersDir, "index.ts");
fs.writeFileSync(indexFilePath, output, "utf8");
console.log("✅ Đã tạo hoặc ghi đè src/handlers/index.ts");
