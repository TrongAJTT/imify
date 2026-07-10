import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function printHelp() {
  console.log(`
Language Sync Tool (imify)

Usage:
  npm run sync:lang <target-lang> <file-name> [use-case-flag]

Arguments:
  <target-lang>     Target language code (e.g., 'vi'). Folder must exist in packages/i18n/src/locales/
  <file-name>       Name of the JSON file to sync (e.g., 'inspector' or 'inspector.json')
                    or '-all' to sync all translation files.
  [use-case-flag]   Optional. Specify the sync action (default is 4):
                    1: Check source keys and insert missing keys with empty/blank values into target.
                    2: Remove keys from the target language file that do not exist in the source file.
                    3: Re-order/sort target file keys to match source file key structure/order.
                    4: Run use case 1 first, then use case 2, then use case 3 (recommended).

Examples:
  npm run sync:lang vi inspector
  npm run sync:lang vi -all 1
  npm run sync:lang vi settings.json --case=3
`);
}

function isPlainObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Use case 1: Check and insert missing keys recursively
function insertMissingKeys(src, tgt) {
  const result = { ...tgt };
  for (const key in src) {
    if (Object.prototype.hasOwnProperty.call(src, key)) {
      if (isPlainObject(src[key])) {
        if (!isPlainObject(result[key])) {
          result[key] = {};
        }
        result[key] = insertMissingKeys(src[key], result[key]);
      } else {
        if (!(key in result)) {
          if (Array.isArray(src[key])) {
            result[key] = [];
          } else if (typeof src[key] === 'boolean') {
            result[key] = false;
          } else if (typeof src[key] === 'number') {
            result[key] = 0;
          } else {
            result[key] = "";
          }
        }
      }
    }
  }
  return result;
}

// Use case 2: Remove target keys that do not exist in source recursively
function removeObsoleteKeys(src, tgt) {
  const result = {};
  for (const key in tgt) {
    if (Object.prototype.hasOwnProperty.call(tgt, key)) {
      if (key in src) {
        if (isPlainObject(tgt[key]) && isPlainObject(src[key])) {
          result[key] = removeObsoleteKeys(src[key], tgt[key]);
        } else {
          result[key] = tgt[key];
        }
      }
    }
  }
  return result;
}

// Use case 3: Sort target keys to match source keys order recursively
function sortKeysToMatch(src, tgt) {
  const sorted = {};
  
  for (const key in src) {
    if (Object.prototype.hasOwnProperty.call(src, key)) {
      if (key in tgt) {
        if (isPlainObject(src[key]) && isPlainObject(tgt[key])) {
          sorted[key] = sortKeysToMatch(src[key], tgt[key]);
        } else {
          sorted[key] = tgt[key];
        }
      }
    }
  }
  
  // Preserve target-only keys at the end (only useful if case 2 was not run)
  for (const key in tgt) {
    if (Object.prototype.hasOwnProperty.call(tgt, key) && !(key in src)) {
      sorted[key] = tgt[key];
    }
  }
  
  return sorted;
}

// Argument parsing
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  printHelp();
  process.exit(0);
}

let targetLang = null;
let fileName = null;
let useCase = 4;

const positionalArgs = [];
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith('--case=')) {
    const val = parseInt(arg.split('=')[1], 10);
    if ([1, 2, 3, 4].includes(val)) {
      useCase = val;
    } else {
      console.error(`Error: Invalid use case value "${val}". Must be 1, 2, 3, or 4.`);
      printHelp();
      process.exit(1);
    }
  } else if (arg === '-c' || arg === '--case' || arg === '-uc' || arg === '--use-case') {
    const nextArg = args[i + 1];
    if (nextArg) {
      const val = parseInt(nextArg, 10);
      if ([1, 2, 3, 4].includes(val)) {
        useCase = val;
        i++;
      } else {
        console.error(`Error: Invalid use case value "${nextArg}". Must be 1, 2, 3, or 4.`);
        printHelp();
        process.exit(1);
      }
    } else {
      console.error(`Error: Missing value for ${arg}.`);
      printHelp();
      process.exit(1);
    }
  } else if (arg === '-all') {
    positionalArgs.push(arg);
  } else if (!arg.startsWith('-')) {
    positionalArgs.push(arg);
  }
}

if (positionalArgs.length < 2) {
  console.error("Error: Missing required arguments.");
  printHelp();
  process.exit(1);
}

targetLang = positionalArgs[0];
fileName = positionalArgs[1];

if (positionalArgs[2]) {
  const val = parseInt(positionalArgs[2], 10);
  if ([1, 2, 3, 4].includes(val)) {
    useCase = val;
  } else {
    console.error(`Error: Invalid positional use case "${positionalArgs[2]}". Must be 1, 2, 3, or 4.`);
    printHelp();
    process.exit(1);
  }
}

const localesDir = path.resolve(__dirname, '../packages/i18n/src/locales');
const sourceLangDir = path.join(localesDir, 'en');
const targetLangDir = path.join(localesDir, targetLang);

if (!fs.existsSync(sourceLangDir)) {
  console.error(`Error: Source language directory "en" not found in "${localesDir}".`);
  process.exit(1);
}

if (!fs.existsSync(targetLangDir)) {
  console.error(`Error: Target language directory "${targetLang}" does not exist in "${localesDir}".`);
  process.exit(1);
}

// Determine files to sync
let filesToSync = [];
if (fileName === '-all') {
  filesToSync = fs.readdirSync(sourceLangDir).filter(f => f.endsWith('.json'));
} else {
  const normalized = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
  filesToSync = [normalized];
}

console.log(`Syncing language "${targetLang}" with use case ${useCase}...`);

let successCount = 0;
let failCount = 0;

for (const file of filesToSync) {
  const srcPath = path.join(sourceLangDir, file);
  const tgtPath = path.join(targetLangDir, file);

  if (!fs.existsSync(srcPath)) {
    console.error(`Warning: Source file "${file}" does not exist in English locale. Skipping.`);
    failCount++;
    continue;
  }

  try {
    const srcData = JSON.parse(fs.readFileSync(srcPath, 'utf-8'));
    let tgtData = {};
    if (fs.existsSync(tgtPath)) {
      tgtData = JSON.parse(fs.readFileSync(tgtPath, 'utf-8'));
    }

    let resultData = tgtData;

    if (useCase === 1) {
      resultData = insertMissingKeys(srcData, tgtData);
    } else if (useCase === 2) {
      resultData = removeObsoleteKeys(srcData, tgtData);
    } else if (useCase === 3) {
      resultData = sortKeysToMatch(srcData, tgtData);
    } else if (useCase === 4) {
      const step1 = insertMissingKeys(srcData, tgtData);
      const step2 = removeObsoleteKeys(srcData, step1);
      resultData = sortKeysToMatch(srcData, step2);
    }

    fs.writeFileSync(tgtPath, JSON.stringify(resultData, null, 2) + '\n', 'utf-8');
    console.log(`  ✓ Synced: ${file}`);
    successCount++;
  } catch (err) {
    console.error(`  ✗ Failed to sync "${file}":`, err.message);
    failCount++;
  }
}

console.log(`\nSync finished. Success: ${successCount}, Failed: ${failCount}.`);
if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
