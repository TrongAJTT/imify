import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const licenseContent = fs.readFileSync(path.join(rootDir, 'LICENSE'), 'utf8');

const targets = [
  ...fs.readdirSync(path.join(rootDir, 'packages'))
    .filter(p => !p.startsWith('.'))
    .map(p => path.join('packages', p)),
  ...fs.readdirSync(path.join(rootDir, 'apps'))
    .filter(p => !p.startsWith('.'))
    .map(p => path.join('apps', p))
];

for (const target of targets) {
  const targetDir = path.join(rootDir, target);
  if (!fs.statSync(targetDir).isDirectory()) continue;
  
  // 1. Write LICENSE file
  fs.writeFileSync(path.join(targetDir, 'LICENSE'), licenseContent);
  
  // 2. Update package.json to have Apache-2.0
  const pkgJsonPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    const pkgData = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    pkgData.license = "Apache-2.0";
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgData, null, 2) + '\n');
  }
}
