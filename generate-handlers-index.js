const fs = require("fs");
const path = require("path");

const MODULES = ["auth", "email", "admin", "coin"];
const HANDLER_PATH = path.join("src", "handlers", "index.ts");

// Tạo thư mục nếu chưa có
const handlersDir = path.dirname(HANDLER_PATH);
if (!fs.existsSync(handlersDir)) fs.mkdirSync(handlersDir, { recursive: true });

// Bắt đầu ghi nội dung
let output = `// ✅ Auto-generated. Do not edit manually.\n`;

for (const module of MODULES) {
  const folder = path.join("src", module);
  if (!fs.existsSync(folder)) continue;

  const files = fs.readdirSync(folder).filter(f => f.endsWith(".ts"));

  for (const file of files) {
    const name = file.replace(/\.ts$/, "");
    output += `export { default as "${name}" } from "../${module}/${name}";\n`;
  }
}

fs.writeFileSync(HANDLER_PATH, output.trim() + "\n", "utf8");
console.log("✅ handlers/index.ts generated.");
