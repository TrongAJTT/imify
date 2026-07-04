# Internationalization (i18n) & Localization Guide

This document explains how to add new localization files (namespaces) or integrate new bundled languages into the `@imify/i18n` package.

---

## 1. Adding a New Localization File (Namespace)

Each functional category (e.g., `splicing`, `filling`, `shared`) in the app corresponds to a translation namespace represented by a JSON file.

### Step 1: Create the JSON Files
Create a new JSON file under each language directory:
- **English**: `packages/i18n/src/locales/en/myNamespace.json`
- **Vietnamese**: `packages/i18n/src/locales/vi/myNamespace.json`

Ensure they have matching keys. For example:
```json
{
  "myFeature": {
    "title": "My Feature Title"
  }
}
```

### Step 2: Register the Namespace in `i18n-instance.ts`
Open [i18n-instance.ts](file:///g:/BrowserExtensions/imify/packages/i18n/src/i18n-instance.ts) and register the new namespace:

1. **Import the JSON files**:
   ```typescript
   import enMyNamespace from "./locales/en/myNamespace.json"
   import viMyNamespace from "./locales/vi/myNamespace.json"
   ```
2. **Add to `ALL_NAMESPACES`**:
   ```typescript
   export const ALL_NAMESPACES = [
     // ... other namespaces
     "myNamespace"
   ] as const
   ```
3. **Register in `buildResources()`**:
   ```typescript
   function buildResources() {
     return {
       en: {
         // ...
         myNamespace: enMyNamespace
       },
       vi: {
         // ...
         myNamespace: viMyNamespace
       }
     }
   }
   ```

### Step 3: Use the Namespace in Components
Import `useTranslation` from `@imify/i18n` (never `@imify/i18n/index`) and specify your namespace:
```tsx
import { useTranslation } from "@imify/i18n"

export function MyComponent() {
  const { t } = useTranslation("myNamespace")
  return <h1>{t("myFeature.title")}</h1>
}
```

---

## 2. Adding a New Bundled Language

To integrate a new default language (e.g., Japanese - `ja`) statically:

### Step 1: Create the Locale Directory
1. Create a new directory `packages/i18n/src/locales/ja/`.
2. Copy the JSON files from `en/` or `vi/` as a template and translate all of them.

### Step 2: Import & Bundle in `i18n-instance.ts`
1. **Import all JSON files** for the new language:
   ```typescript
   import jaCommon from "./locales/ja/common.json"
   import jaWorkspace from "./locales/ja/workspace.json"
   // ... import the rest
   ```
2. **Register in `buildResources()`**:
   ```typescript
   function buildResources() {
     return {
       en: { ... },
       vi: { ... },
       ja: {
         common: jaCommon,
         workspace: jaWorkspace,
         // ... map the rest of the imported files
       }
     }
   }
   ```

### Step 3: Update `language-info.ts`
Open [language-info.ts](file:///g:/BrowserExtensions/imify/packages/i18n/src/language-info.ts) and add the new language to the `bundled` array inside `getAvailableLanguages()`:
```typescript
const bundled = [
  { code: "en", name: "English" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "ja", name: "日本語" } // Add this
]
```

---

## 🚨 Crucial Caveats & Best Practices

1. **Import Path Warning**: Always import `useTranslation` from `@imify/i18n` rather than `@imify/i18n/index`. Importing from `/index` causes build/typechecking issues in bundlers like Next.js and Webpack because of unresolved package exports.
2. **Synchronize All Namespaces**: If you add a new namespace, you **must** create the JSON files in all supported languages and register them under all keys in `buildResources()`. Failing to do so causes type errors or missing fallback behaviors.
3. **Completion Calculation**: The `completionRate` is calculated automatically against the English translation keys by comparing missing keys. Ensure English always serves as the primary base keys structure.
