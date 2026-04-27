# Imify Web (`apps/web`)

Next.js App Router frontend for the Imify web experience, delivering a premium, high-performance toolkit for image processing directly in the browser.

## Core Features
- **Marketing & Extension Pages**: High-fidelity landing pages (`/`) and a dedicated extension gateway (`/extension`).
- **Workspace Routes**: Immersive processing environments for all tools.
- **Preset-Based Workflows**: Deep-linkable processing states (`/work?id=...`, `/fill?id=...`).
- **Client-Side Processing**: Leverages Wasm and Web Workers for private, fast, and serverless image manipulation.

## Run Locally

From the repository root:

```bash
pnpm --filter @imify/web dev
```

Build for production:

```bash
pnpm --filter @imify/web build
```

## Route Map

### Monolithic Pages
These pages use a seamless, full-width layout without the workspace shell:
- `/`: Main landing page.
- `/extension`: Browser extension gateway featuring store badges (Chrome, Edge, Firefox), GitHub releases, and high-resolution feature previews for **Context Menu** and **SEO Audit**.

### Workspace Landing Routes
- `/single-processor`
- `/batch-processor`
- `/splitter`
- `/splicing`
- `/pattern-generator`
- `/filling`
- `/diffchecker`
- `/inspector`

### Workspace Work Routes (ID required)
- `/single-processor/work?id=<presetId>`
- `/batch-processor/work?id=<presetId>`
- `/splitter/work?id=<presetId>`
- `/splicing/work?id=<presetId>`
- `/pattern-generator/work?id=<presetId>`
- `/filling/fill?id=<templateId>`
- `/filling/edit?id=<templateId>`
- `/filling/symmetric-generate?id=<templateId>`

`id` parsing and validation are handled in `src/features/routing/route-id.ts`. Invalid or missing IDs are routed to `notFound()`.

## Web App Architecture

### 1. Layout & Shell Composition
- `src/app/layout.tsx`: Provides the root shell including `WebHeader`, `WorkspaceLayout`, and `WebFooter`.
- `src/components/layout/workspace-layout.tsx`: Features a layout engine that switches between:
  - **Monolithic Container**: Used for `/` and `/extension` for a polished marketing feel.
  - **Workspace Shell**: Used for tool routes to provide a sidebar-driven configuration environment.

### 2. Header & Settings
- `src/components/layout/web-header.tsx`: Renders the `WorkspaceOptionsHeader`, multi-tool navigation, and global dialogs (About, Donate, Settings).
- **Persistence**: Global preferences (default route, layout, performance, dark mode) are persisted via `localStorage`.

### 3. Sidebar & UI System
- **Sidebar Composition**: Features register their right sidebars using `useWorkspaceSidebar`.
- **Reorder System**: Powered by `dnd-kit` in `packages/ui`. Recent updates replaced `PointerSensor` with explicit `MouseSensor` and `TouchSensor` combined with stable `useId` keys to ensure robust drag-and-drop behavior across both Web and Extension environments.

### 4. Preset Lifecycle
- Landing routes provide selectors for presets and templates.
- Navigation to a work route rehydrates the store state and applies the active configuration.

## SEO & Metadata

- **Centralized Metadata**: All route-level metadata is defined in `src/app/seo-metadata.ts`.
- **Discovery**: `sitemap.ts` and `robots.ts` manage crawling and indexability.
- **Site URL**: Configured via `NEXT_PUBLIC_SITE_URL`.

## Notes for Contributors

- **Metadata**: Always add/update entries in `src/app/seo-metadata.ts` for new routes.
- **Patterns**: Maintain the `ext -> shared -> ext+web` architecture to maximize code reuse.
- **UI Components**: Use the shared components in `packages/ui` and ensure they remain platform-agnostic.
- **GitNexus**: Use the GitNexus MCP tools (as documented in `AGENTS.md`) for impact analysis before modifying core symbols.
