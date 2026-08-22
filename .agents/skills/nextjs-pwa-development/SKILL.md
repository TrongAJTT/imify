---
name: nextjs-pwa-development
description: >-
  Specific rules, constraints, and architecture patterns for the Next.js PWA web application in apps/web,
  including Pure Static Export, App Router, Server vs. Client Components, and Service Worker offline caching.
---

# Next.js PWA Development Guide

This skill governs development inside `apps/web` and web-specific integrations.

## Architecture Constraints

1. **Pure Static Export (`output: 'export'`)**:
   - `apps/web` is statically exported to `out/` and deployed to **Cloudflare Pages**.
   - No dynamic Node.js server runtimes (`getServerSideProps`, Server Actions requiring Node.js servers are not available).
   - All dynamic routing or client-side guards rely on query params (e.g. `?tool=...` or `QueryIdPageGuard`).

2. **Server Components vs. Client Components**:
   - Keep layout wrappers, static metadata pages, and SEO generators as **Server Components** where possible.
   - Mark interactive UI, workspace layouts, hooks, and browser storage accesses explicitly with `"use client"`.
   - **Important**: Any hook or client-side utility in shared packages (like `@imify/core/hooks/use-toast.ts`) that uses React hooks must declare `"use client"` at the very top of the file to prevent Next.js bundling errors during static generation.

3. **SEO & Metadata**:
   - All tool pages define Open Graph, Twitter metadata, and structured descriptions via `src/app/seo-metadata.ts`.
   - Ensure image paths resolve to valid public URLs or CDNs (`https://cdn.trongajtt.com/apps/imify/...`).

4. **Service Worker & PWA Lifecycle**:
   - Service worker logic lives in `public/sw.js` and `public/workbox-*.js`.
   - SW version is kept in sync via `pnpm sync:package`.
   - On SW cache updates, the `SW_CACHE_READY` broadcast prompts the update gate rather than forcing an uncontrolled reload.
   - Dedicated troubleshooting routes:
     - `/recovery`: Emergency recovery mode to unregister SW and purge IndexedDB/CacheStorage.
     - `/update`: Instant cache purge and refresh shortcut.

---

## Verification
- Before submitting web changes, always run:
  ```bash
  pnpm --filter @imify/web build
  ```
  to ensure all 33+ static routes compile without hydration or Server Component bundling errors.
