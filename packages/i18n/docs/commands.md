# Internationalization (i18n) Utility Scripts

Imify provides several CLI tools and scripts (runnable via `pnpm`) to help developers maintain, sort, and synchronize language keys between development source files and output packages.

---

## 1. Directory Synchronization Scripts

These scripts copy localized JSON files from the shared library source (`packages/i18n/src/locales/`) into the build outputs of specific target applications.

### Synchronize Web App Locales
Copies JSON files from the locales source directly to the Next.js public directory (`apps/web/public/locales/`) so they can be loaded asynchronously in the web application. It also runs a translation completion rate update.
```bash
pnpm sync:locales
```
*Defined in root `package.json` as `node scripts/sync-locales.mjs`.*

### Synchronize Extension App Locales
Groups and bundles locale namespaces for Chrome and Firefox targets, distributing files into `apps/extension/static/locales/`.
```bash
pnpm --filter @imify/extension sync:locales
```
*Defined in `apps/extension/package.json` as `node ../../scripts/sync-locales-extension.mjs`.*

---

## 2. Key Synchronization & Sorting Tool

The `sync:lang` CLI script is a powerful utility for keeping target translations in sync with the English (source of truth) baseline keys. It allows automatic insertion of missing keys, removal of obsolete keys, and sorting key order recursively.

### Usage
```bash
pnpm sync:lang <target-lang> <file-name> [use-case-flag]
```

### Arguments

*   **`<target-lang>`**: The target language code to modify (e.g., `vi`). The corresponding language folder must exist in `packages/i18n/src/locales/`.
*   **`<file-name>`**: The name of the namespace JSON file to sync (e.g., `workspace` or `workspace.json`).
    *   Use **`-all`** to sync every namespace file in the target language directory.
*   **`[use-case-flag]`** *(Optional)*: Specifies the action to execute. Defaults to `4`.
    *   `1`: Check source (English) keys and insert missing keys with empty/blank values (`""`, `0`, `false`, `[]`) into target.
    *   `2`: Remove keys from the target language file that no longer exist in the English source file.
    *   `3`: Re-order and sort target keys to match the exact key order/structure of the English source file.
    *   `4` *(Recommended)*: Run Use Case 1 first, then 2, then 3.

### Examples

**Sync all Vietnamese translation files (Add missing keys, remove old keys, and sort):**
```bash
pnpm sync:lang vi -all
```

**Sort only the keys of the Vietnamese `settings.json` file to match English order:**
```bash
pnpm sync:lang vi settings 3
```

**Insert only missing keys into the Vietnamese `qrReader.json` file without deleting obsolete keys:**
```bash
pnpm sync:lang vi qrReader 1
```

---

## 3. Formatting & Code Style Normalization

To ensure consistent formatting (CRLF line endings to LF, stripping BOM headers, indentation styling), use the format normalization utility:

```bash
node scripts/fix-locale-format.mjs
```

This parses and writes back all `.json` files inside the `en/` and `vi/` directories under `packages/i18n/src/locales/` formatted with a 2-space indentation and trailing newlines.
