const fs = require("fs");
const path = require("path");

const dirs = ["auth", "email", "admin", "coin"];
let output = "";

for (const dir of dirs) {
  const files = fs.readdirSync(`src/${dir}`);
  for (const file of files) {
    if (file.endsWith(".ts")) {
      const name = file.replace(".ts", "");
      output += `export { default as "${name}" } from "../${dir}/${file}";\n`;
    }
  }
}

// 👉 Đảm bảo thư mục handlers tồn tại
fs.mkdirSync("src/handlers", { recursive: true });

// ✅ Ghi vào index.ts bên trong handlers
fs.writeFileSync("src/handlers/index.ts", output);
console.log("✅ Đã cập nhật src/handlers/index.ts");
