import fs from 'fs';
import path from 'path';

const storeFiles = [
  "src/options/stores/batch-store.ts",
  "src/options/stores/splicing-store.ts",
  "src/options/stores/splitter-store.ts",
  "src/options/stores/filling-store.ts",
  "src/options/stores/pattern-store.ts",
  "src/options/stores/pattern-preset-store.ts",
  "src/options/stores/splicing-preset-store.ts",
  "src/options/stores/splitter-preset-store.ts",
  "src/options/stores/diffchecker-store.ts",
  "src/options/stores/inspector-store.ts",
  "src/options/stores/watermark-store.ts",
  "src/options/hooks/use-shortcut-preferences.ts"
];

const basePath = process.cwd();

for (const file of storeFiles) {
  const fullPath = path.join(basePath, file);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping missing file: ${file}`);
    continue;
  }
  let content = fs.readFileSync(fullPath, 'utf8');

  // 1. Remove PLATFORM comment
  content = content.replace(/\/\/ PLATFORM:extension[^\n]*\n/g, "");

  // 2. Replace @plasmohq/storage import with deferredStorage import
  content = content.replace(/import\s+{\s*Storage\s*}\s+from\s+"@plasmohq\/storage"\s*\n/, "import { deferredStorage } from \"@/core/storage-adapter\"\n");
  
  // 3. Remove storage instantiation and plasmoStorage block
  const regex = /const\s+storage\s*=\s*new\s+Storage\([\s\S]*?removeItem:(?:[\s\S]*?)}\n}/;
  content = content.replace(regex, "");
  
  // For shortcuts.ts, it just has: export const shortcutStorage = new Storage({ area: "sync" })
  // We need to handle this manually since the regex above won't match it.
  if (file.includes("use-shortcut-preferences.ts") || file.includes("shortcuts.ts")) {
    content = content.replace(/import\s+{\s*shortcutStorage\s*}\s+from\s+"@\/options\/shared\/shortcuts"\s*\n/, "import { deferredStorage } from \"@/core/storage-adapter\"\n");
    content = content.replace(/shortcutStorage/g, "deferredStorage");
  }

  // 4. Replace plasmoStorage with deferredStorage in persist
  content = content.replace(/createJSONStorage\(\s*\(\)\s*=>\s*plasmoStorage\s*\)/g, "createJSONStorage(() => deferredStorage)");

  // 5. Some files might use `createJSONStorage(() => plasmoStorage as any)` or similar. Let's just do a generic replace
  content = content.replace(/plasmoStorage/g, "deferredStorage");

  // Format cleanup: remove double blank lines caused by deletion
  content = content.replace(/\n{3,}/g, "\n\n");

  fs.writeFileSync(fullPath, content);
  console.log(`Updated ${file}`);
}
