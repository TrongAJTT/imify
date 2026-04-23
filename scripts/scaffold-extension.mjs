import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const extDir = path.join(rootDir, 'apps', 'extension');

// Ensure apps/extension exists
if (!fs.existsSync(extDir)) {
  fs.mkdirSync(extDir, { recursive: true });
}

// Files and directories to move to apps/extension
const toMove = [
  'src',
  'assets',
  'static',
  'tailwind.config.js',
  '.prettierrc.mjs',
  'postcss.config.js',
  'tsconfig.json'
];

for (const item of toMove) {
  const srcPath = path.join(rootDir, item);
  const destPath = path.join(extDir, item);
  if (fs.existsSync(srcPath)) {
    fs.cpSync(srcPath, destPath, { recursive: true });
    console.log(`Copied ${item} to apps/extension/${item}`);
  }
}

// Copy package.json to apps/extension, then clean up root
const rootPkgPath = path.join(rootDir, 'package.json');
const extPkgPath = path.join(extDir, 'package.json');

const pkgJson = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));

// 1. Write the extension package.json
const extPkg = { ...pkgJson };
extPkg.name = "@imify/extension";
// Remove monorepo scripts from extension package.json
for (const key of Object.keys(extPkg.scripts)) {
  if (key.startsWith("workspace:") || key === "--- monorepo ---") {
    delete extPkg.scripts[key];
  }
}
fs.writeFileSync(extPkgPath, JSON.stringify(extPkg, null, 2));
console.log('Created apps/extension/package.json');

// 2. Write the root package.json
const rootPkg = {
  name: "imify-monorepo",
  version: "0.0.0",
  private: true,
  scripts: {
    "dev:ext": "pnpm --filter @imify/extension dev",
    "dev:web": "pnpm --filter @imify/web dev",
    "build:all": "turbo build",
    "typecheck": "turbo typecheck",
    "lint": "turbo lint",
    "clean": "turbo clean"
  },
  devDependencies: {
    "turbo": "latest",
    "typescript": "5.3.3",
    "prettier": "3.2.4",
    "@ianvs/prettier-plugin-sort-imports": "4.1.1"
  }
};
fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2));
console.log('Cleaned root package.json');

// 3. Update the package barrels to point to the new location of src
const packages = ['core', 'engine', 'ui', 'features', 'stores'];
for (const pkg of packages) {
  const indexFile = path.join(rootDir, 'packages', pkg, 'src', 'index.ts');
  if (fs.existsSync(indexFile)) {
    let content = fs.readFileSync(indexFile, 'utf8');
    // Replace "../../../src/" with "../../../apps/extension/src/"
    content = content.replace(/\.\.\/\.\.\/\.\.\/src\//g, "../../../apps/extension/src/");
    fs.writeFileSync(indexFile, content);
    console.log(`Updated imports in @imify/${pkg}`);
  }
}

console.log("Scaffold completed.");
