import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const localesDir = path.join(__dirname, "../packages/i18n/src/locales");

function fixDir(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const fullPath = path.join(dir, file);
    let raw = fs.readFileSync(fullPath, "utf8");
    // Strip BOM if present
    if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
    // Strip CRLF -> LF (normalize)
    raw = raw.replace(/\r\n/g, "\n");
    try {
      const obj = JSON.parse(raw);
      fs.writeFileSync(fullPath, JSON.stringify(obj, null, 2) + "\n", "utf8");
    } catch (e) {
      console.error(`Failed to parse ${fullPath}: ${e.message}`);
    }
  }
  console.log(`Fixed ${files.length} files in ${dir}`);
}

fixDir(path.join(localesDir, "en"));
fixDir(path.join(localesDir, "vi"));
console.log("Done.");
