// ✅ generate-handlers-index.js – Tự động tạo src/handlers/index.ts
const fs = require("fs");
const path = require("path");

const folders = ["auth", "email", "admin", "coin"];
const handlerDir = path.join(__dirname, "src", "handlers");
const indexPath = path.join(handlerDir, "index.ts");

// ✅ Tạo thư mục nếu chưa tồn tại
fs.mkdirSync(handlerDir, { recursive: true });

// ✅ Chuẩn bị nội dung
let output = `// ✅ Auto-generated handlers/index.ts\n`;

for (const folder of folders) {
  const folderPath = path.join(__dirname, "src", folder);
  if (!fs.existsSync(folderPath)) continue;

  const files = fs.readdirSync(folderPath).filter(f => f.endsWith(".ts"));
  for (const file of files) {
    const name = file.replace(".ts", "");
    output += `export { default as "${name}" } from "../${folder}/${file}";\n`;
  }
}

// ✅ Xoá nếu đã tồn tại để đảm bảo không bị cache/trùng
try {
  fs.unlinkSync(indexPath);
} catch (_) {}

fs.writeFileSync(indexPath, output, "utf8");
console.log("✅ Đã tạo/ghi đè src/handlers/index.ts thành công.");
