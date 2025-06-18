const fs = require("fs");
const path = require("path");

const folders = ["auth", "email", "admin", "coin"];
const baseDir = path.join(__dirname, "src");
const handlerDir = path.join(baseDir, "handlers");

// Đảm bảo thư mục tồn tại
fs.mkdirSync(handlerDir, { recursive: true });

let output = `// ✅ Auto-generated file. Do not edit manually.\n`;

folders.forEach(folder => {
  const folderPath = path.join(baseDir, folder);
  if (!fs.existsSync(folderPath)) return;

  const files = fs.readdirSync(folderPath).filter(f => f.endsWith(".ts"));
  for (const file of files) {
    const name = file.replace(".ts", "");
    output += `export { default as "${name}" } from "../${folder}/${file}";\n`;
  }
});

fs.writeFileSync(path.join(handlerDir, "index.ts"), output);
console.log("✅ handlers/index.ts đã được tạo!");
