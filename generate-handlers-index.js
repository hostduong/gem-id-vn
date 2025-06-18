const fs = require("fs");
const path = require("path");

// ✅ Danh sách thư mục cần đọc
const dirs = ["auth", "email", "admin", "coin"];

// ✅ Đảm bảo có thư mục handlers
const handlersPath = "src/handlers";
fs.mkdirSync(handlersPath, { recursive: true });

let output = "";

// ✅ Duyệt từng thư mục
for (const dir of dirs) {
  const dirPath = path.join("src", dir);
  fs.mkdirSync(dirPath, { recursive: true }); // 🔧 Nếu chưa có, tạo mới

  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    if (file.endsWith(".ts")) {
      const name = file.replace(".ts", "");
      output += `export { default as "${name}" } from "../${dir}/${file}";\n`;
    }
  }
}

// ✅ Ghi nội dung vào index.ts
fs.writeFileSync(path.join(handlersPath, "index.ts"), output);
console.log("✅ Đã tạo src/handlers/index.ts thành công.");
