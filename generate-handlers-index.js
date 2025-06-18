const fs = require("fs");
const path = require("path");

const srcPath = path.join(__dirname, "src");
const handlerPath = path.join(srcPath, "handlers");

// ✅ Tạo thư mục handlers nếu chưa có
fs.mkdirSync(handlerPath, { recursive: true });

let output = `// ✅ Auto-generated handlers/index.ts\n`;

// ✅ Tự động lấy tất cả thư mục trong src/, bỏ qua api và handlers
const folders = fs.readdirSync(srcPath).filter(name => {
  const fullPath = path.join(srcPath, name);
  return fs.statSync(fullPath).isDirectory() && !["api", "handlers"].includes(name);
});

for (const folder of folders) {
  const folderDir = path.join(srcPath, folder);
  const files = fs.readdirSync(folderDir).filter(f => f.endsWith(".ts"));

  for (const file of files) {
    const name = file.replace(".ts", "");
    output += `export { default as "${name}" } from "../${folder}/${file}";\n`;
  }
}

// ✅ Ghi file index.ts
const filePath = path.join(handlerPath, "index.ts");
fs.writeFileSync(filePath, output, { encoding: "utf8", flag: "w" });

console.log("✅ handlers/index.ts đã được tạo hoặc cập nhật.");
