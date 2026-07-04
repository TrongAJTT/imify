# Internationalization (i18n) & Localization Guide

This document explains how the `@imify/i18n` package works and how to add new localization files, namespaces, or bundled languages.

---

## Architecture Overview

The i18n system uses **lazy loading** (Method 3): locale JSON files are fetched on demand rather than being statically bundled into the JavaScript bundle.

| Environment | Locale Source | Fetch Method |
|---|---|---|
| **Chrome Extension** | `apps/extension/static/locales/` | `chrome.runtime.getURL("locales/{lang}/{ns}.json")` |
| **Web App (Next.js)** | `apps/web/public/locales/` | `fetch("/locales/{lang}/{ns}.json")` |

Both outputs are populated by sync scripts before `dev` or `build` commands run. The source of truth is always `packages/i18n/src/locales/`.

### Loading Priority

| Priority | Namespaces | Strategy |
|---|---|---|
| **Eager (inline bundle)** | `common`, `_meta` | Always available — bundled into JS at build time |
| **Lazy (on demand)** | All other namespaces | Fetched via `LocaleBackend` when first accessed |

---

## File Structure

```
packages/i18n/src/locales/
  en/
    _meta.json          ← Language metadata (name, code, version, maintainers)
    common.json         ← Core UI strings (always eagerly bundled)
    about.json          ← Lazy loaded
    homepage.json       ← Lazy loaded
    ... (other namespaces)
  vi/
    _meta.json
    common.json
    ... (matching structure)
```

### `_meta.json` Format
```json
{
  "languageName": "English",
  "languageCode": "en",
  "version": "2.2.0",
  "maintainers": [
    { "name": "TrongAJTT", "github": "https://github.com/trongajtt", "role": "Core Maintainer" }
  ]
}
```

> [!IMPORTANT]
> `_meta` is **not** stored inside individual namespace files anymore. It lives in its own `_meta.json` per language directory and is registered in i18next as the `"_meta"` namespace.

---

## 1. Adding a New Namespace (Localization File)

### Step 1: Create JSON Files

Create the namespace file under each language directory:
```
packages/i18n/src/locales/en/myFeature.json
packages/i18n/src/locales/vi/myFeature.json
```

Example content:
```json
{
  "title": "My Feature Title",
  "description": "What this feature does"
}
```

> [!NOTE]
> Do **not** add a `_meta` block inside namespace files. Metadata lives only in `_meta.json`.

### Step 2: Register in `ALL_NAMESPACES`

Open [i18n-instance.ts](file:///g:/BrowserExtensions/imify/packages/i18n/src/i18n-instance.ts) and add the namespace name to `ALL_NAMESPACES`:

```typescript
export const ALL_NAMESPACES = [
  "common",
  // ...
  "myFeature"  // ← Add this
] as const
```

No additional imports or `buildResources()` changes are needed — the `LocaleBackend` will automatically fetch `myFeature.json` from the filesystem when a component first calls `useTranslation("myFeature")`.

### Step 3: Add to Completion Calculator

Open [completion-calculator.ts](file:///g:/BrowserExtensions/imify/packages/i18n/src/completion-calculator.ts) and add the namespace to the `NAMESPACES` constant:

```typescript
export const NAMESPACES = [
  // ...
  "myFeature"  // ← Add this
] as const
```

### Step 4: Add to Runtime Template

Open [runtime-import.ts](file:///g:/BrowserExtensions/imify/packages/i18n/src/runtime-import.ts) and add the namespace to the list inside `generateEmptyLanguageTemplate()`:

```typescript
const namespaces = [
  // ...
  "myFeature"  // ← Add this
]
```

### Step 5: Use in Components

```tsx
import { useTranslation } from "@imify/i18n"

export function MyComponent() {
  const { t } = useTranslation("myFeature")
  return <h1>{t("title")}</h1>
}
```

> [!IMPORTANT]
> Always import `useTranslation` from `@imify/i18n` — never from `@imify/i18n/index`.

---

## 2. Adding a New Bundled Language

### Step 1: Create Locale Directory

1. Create `packages/i18n/src/locales/{langCode}/`.
2. Create `_meta.json` with the language metadata.
3. Copy all namespace JSON files from `en/` and translate them.

### Step 2: Register in `language-info.ts`

Open [language-info.ts](file:///g:/BrowserExtensions/imify/packages/i18n/src/language-info.ts) and add the language to the `bundled` array:

```typescript
const bundled = [
  { code: "en", name: "English" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "ja", name: "日本語" }  // ← Add this
]
```

### Step 3: Inline-bundle `common` + `_meta`

Open [i18n-instance.ts](file:///g:/BrowserExtensions/imify/packages/i18n/src/i18n-instance.ts) and add the eagerly-bundled namespaces for the new language:

```typescript
import jaCommon from "./locales/ja/common.json"
import jaMeta from "./locales/ja/_meta.json"

function buildEagerResources() {
  return {
    en: { common: enCommon, _meta: enMeta },
    vi: { common: viCommon, _meta: viMeta },
    ja: { common: jaCommon, _meta: jaMeta }  // ← Add this
  }
}
```

All other namespaces for the new language are fetched lazily by the backend — no further registration needed.

### Step 4: Sync Locale Files

Run the sync scripts to copy the new locale files to both output directories:
```bash
node scripts/sync-locales.mjs
node scripts/sync-locales-extension.mjs
```

Or simply run `pnpm dev` / `pnpm build` in either app — the sync runs automatically.

---

## 3. Runtime Language Import (Community Languages)

The system supports importing community-contributed language files at runtime via the developer settings dialog. The import format is a single JSON file with `_meta` at the root alongside all namespace keys:

```json
{
  "_meta": {
    "languageName": "Français",
    "languageCode": "fr",
    "version": "1.0.0",
    "maintainers": [{ "name": "Contributor", "github": "...", "role": "Translator" }]
  },
  "common": { "save": "Sauvegarder", ... },
  "about": { ... },
  "shared": { ... }
}
```

The file is validated, stored in IndexedDB, and registered in i18next at runtime. `_meta` is registered as its own namespace (`"_meta"`) consistent with the bundled language behavior.

---

## 🚨 Crucial Caveats

1. **Import path**: Always `import { useTranslation } from "@imify/i18n"` — never from `@imify/i18n/index`.
2. **No `_meta` in namespace files**: Never add `_meta` back to individual namespace files. This causes the completion calculator to double-count and will break validation.
3. **Sync scripts**: After adding/changing any locale JSON file, re-run the sync scripts (or `pnpm dev`/`pnpm build`) so both Web and Extension targets receive the updated files.
4. **`common` must be complete**: This is eagerly bundled and never lazy-loaded. It must be fully translated in all supported languages — missing keys here cause visible UI fallbacks at startup.
5. **Completion rate**: Calculated by comparing each namespace against the English baseline. The `_meta` namespace is excluded from completion calculations automatically.
