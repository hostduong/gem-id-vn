const fs = require("fs");
const path = require("path");

const folders = ["auth", "email", "admin", "coin"];
const handlerPath = path.join(__dirname, "src", "handlers");
fs.mkdirSync(handlerPath, { recursive: true }); // Tạo folder nếu chưa có

let output = `// ✅ Auto-generated handlers/index.ts\n`;

for (const folder of folders) {
  const folderDir = path.join(__dirname, "src", folder);
  if (!fs.existsSync(folderDir)) continue;

  const files = fs.readdirSync(folderDir).filter(f => f.endsWith(".ts"));
  for (const file of files) {
    const name = file.replace(".ts", "");
    output += `export { default as "${name}" } from "../${folder}/${file}";\n`;
  }
}

const filePath = path.join(handlerPath, "index.ts");

// ✅ Ghi đè nếu tồn tại
fs.writeFileSync(filePath, output, { encoding: "utf8", flag: "w" });
console.log("✅ handlers/index.ts đã được tạo hoặc ghi đè:", filePath);
