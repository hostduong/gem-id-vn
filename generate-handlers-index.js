const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "src");
const ignoreFolders = ["utils", "api"];
const output = [];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      const folderName = path.basename(fullPath);
      if (!ignoreFolders.includes(folderName)) {
        walk(fullPath);
      }
    } else if (file.endsWith(".ts") && !file.endsWith(".d.ts")) {
      const relativePath = path.relative(path.join(__dirname, "src/handlers"), fullPath).replace(/\\/g, "/").replace(/\.ts$/, "");
      const typeName = relativePath.split("/").pop();
      output.push(`export { default as "${typeName}" } from "../${relativePath}";`);
    }
  }
}

walk(srcDir);

const finalContent = output.join("\n") + "\n";
fs.writeFileSync(path.join(srcDir, "handlers", "index.ts"), finalContent);
console.log("✅ Đã tạo lại handlers/index.ts với " + output.length + " API handler.");
