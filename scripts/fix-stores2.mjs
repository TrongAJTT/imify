import fs from 'fs';
import path from 'path';

const storeFiles = [
  "src/options/stores/diffchecker-store.ts",
  "src/options/stores/filling-store.ts",
  "src/options/stores/inspector-store.ts",
  "src/options/stores/pattern-preset-store.ts",
  "src/options/stores/pattern-store.ts",
  "src/options/stores/splicing-preset-store.ts",
  "src/options/stores/splitter-preset-store.ts",
  "src/options/stores/splitter-store.ts",
  "src/options/stores/watermark-store.ts"
];

const basePath = process.cwd();

for (const file of storeFiles) {
  const fullPath = path.join(basePath, file);
  if (!fs.existsSync(fullPath)) continue;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // This regex matches from `const storage = new Storage` down to the closing brace of `deferredStorage`.
  const regex = /const\s+storage\s*=\s*new\s+Storage[\s\S]*?storage\.remove\(name\)[\s\S]*?\n\}/;
  content = content.replace(regex, "");
  
  // Clean up duplicate imports if any
  content = content.replace(/import\s+{\s*deferredStorage\s*}\s+from\s+"@\/core\/storage-adapter"\nimport\s+{\s*deferredStorage\s*}\s+from\s+"@\/core\/storage-adapter"/, "import { deferredStorage } from \"@/core/storage-adapter\"");

  // Remove multiple blank lines
  content = content.replace(/\n{3,}/g, "\n\n");
  
  fs.writeFileSync(fullPath, content);
  console.log(`Fixed ${file}`);
}

// Fix use-shortcut-preferences.ts manually
const shortcutsHook = path.join(basePath, "src/options/hooks/use-shortcut-preferences.ts");
if (fs.existsSync(shortcutsHook)) {
  let content = fs.readFileSync(shortcutsHook, 'utf8');
  content = content.replace(/import\s+{\s*deferredStorage\s*}\s+from\s+"@\/options\/shared\/shortcuts"/g, "import { deferredStorage } from \"@/core/storage-adapter\"");
  // Wait, in my previous script I replaced `shortcutStorage` with `deferredStorage`. But I might not have added the new import correctly.
  // Let's just ensure it's imported correctly.
  if (!content.includes("@/core/storage-adapter")) {
    content = content.replace(/import\s+{([^}]*)}/, "import { deferredStorage } from \"@/core/storage-adapter\"\nimport { $1 }");
  }
  fs.writeFileSync(shortcutsHook, content);
  console.log("Fixed shortcuts hook");
}
