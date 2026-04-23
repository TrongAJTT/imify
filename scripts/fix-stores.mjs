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
  "src/options/stores/watermark-store.ts"
];

const basePath = process.cwd();

for (const file of storeFiles) {
  const fullPath = path.join(basePath, file);
  if (!fs.existsSync(fullPath)) continue;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Remove the `const storage = new Storage({...})` to `}` of deferredStorage block.
  // We can do this by regex since we know `const storage = new Storage` up to `removeItem: async (name: string): Promise<void> => {\n    await storage.remove(name)\n  }\n}`
  const blockRegex = /const\s+storage\s*=\s*new\s+Storage\(\{[\s\S]*?removeItem:\s*async\s*\([^)]*\)\s*:\s*Promise<void>\s*=>\s*\{[\s\S]*?\}\s*\n\}/;
  
  // Actually, because it was renamed to `const deferredStorage = {`, the regex needs to match that.
  const fixRegex = /const\s+storage\s*=\s*new\s+Storage\(\{[\s\S]*?area:\s*"local"[\s\S]*?\}\)[\s\S]*?\/\/ Custom storage for Zustand that uses Plasmo's Storage\s*\nconst deferredStorage\s*=\s*\{[\s\S]*?removeItem:\s*async\s*\([^)]*\)\s*:\s*Promise<void>\s*=>\s*\{[\s\S]*?\}\s*\n\}/;
  
  content = content.replace(fixRegex, "");
  
  // Remove duplicate imports if any
  content = content.replace(/import\s+{\s*deferredStorage\s*}\s+from\s+"@\/core\/storage-adapter"\nimport\s+{\s*deferredStorage\s*}\s+from\s+"@\/core\/storage-adapter"/, "import { deferredStorage } from \"@/core/storage-adapter\"");
  
  fs.writeFileSync(fullPath, content);
  console.log(`Fixed ${file}`);
}
