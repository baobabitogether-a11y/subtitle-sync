import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const outputDir = path.resolve(process.argv[2] ?? ".output/public");
const indexPath = path.join(outputDir, "index.html");

if (!fs.existsSync(indexPath)) {
  throw new Error(`Cannot normalize web asset paths: ${indexPath} does not exist.`);
}

let html = fs.readFileSync(indexPath, "utf8");
html = html
  .replaceAll('="/./assets/', '="./assets/')
  .replaceAll('="/favicon.ico"', '="./favicon.ico"');
fs.writeFileSync(indexPath, html);

console.log(`Normalized web asset paths in ${path.relative(process.cwd(), indexPath)}`);