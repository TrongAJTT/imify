# Imify Extension (`apps/extension`)

The core browser extension package for Imify, built with [Plasmo](https://plasmo.com/) and React. This package delivers a powerful, privacy-first image toolkit directly into the browser workflow.

## Architecture Overview

Imify Extension is composed of several specialized environments that communicate via a robust message-passing system.

### 1. Background Service Worker (`src/background/`)
- **State Management**: Centralizes storage state (`chrome-storage-state.ts`) and synchronizes it across all extension contexts.
- **Context Menu Hub**: Dynamically builds and updates Chrome context menu items based on user-defined conversion presets (`context-menu-builder.ts`).
- **Processing Orchestrator**: Handles image fetching, conversion logic, and download management.
- **Message Hub**: Publishes real-time conversion progress and state updates to popups, sidepanels, and toast notifications.

### 2. Options Workspace (`src/options/`)
- **Main Command Center**: A full-featured workspace UI where users manage presets, batch process images, and configure global settings.
- **Workspace UI**: Implements a complex, reorderable sidebar system using `dnd-kit`.
- **Hybrid Sensors**: Uses custom `MouseSensor` and `TouchSensor` with stable `useId` keys to ensure 100% reliable reordering even within the constrained extension environment.

### 3. SEO Audit Engine (`src/features/seo-audit/`)
A sophisticated diagnostic tool that analyzes the active tab's image SEO health.
- **DOM Scanner**: Injected via content scripts to perform deep analysis of `img` tags and CSS `background-image` properties.
- **Metrics Tracked**:
  - **Alt Text Integrity**: Detects missing, empty, or decorative alt attributes.
  - **Loading Optimization**: Identifies below-the-fold images missing `loading="lazy"`.
  - **Dimension Analysis**: Flags "Oversized Assets" where intrinsic resolution significantly exceeds rendered size.
  - **Payload Estimation**: Estimates transfer sizes and potential savings using modern formats (AVIF/WebP).
  - **Security**: Flags insecure (HTTP) assets on HTTPS pages.
- **Snapshot Store**: Allows saving and comparing audit reports via `snapshot-store.ts`.

### 4. Sidepanel & Popup (`src/sidepanel/`, `src/popup/`)
- **Quick Actions (Popup)**: Provides immediate access to active tab auditing and workspace navigation.
- **Persistent Snapshots (Sidepanel)**: Displays detailed SEO audit reports and allows users to compare different pages or points in time.

### 5. Contents & UI Injection (`src/contents/`)
- **SEO Audit Listener**: Receives scan requests and executes the DOM analysis.
- **Progress Toasts**: Injects lightweight UI notifications to show conversion status when triggered from the context menu.

## Key Technical Features

### Offscreen Processing
Leverages the `chrome.offscreen` API to execute heavy Wasm-based image encoding (AVIF, JXL, MozJPEG) in a separate environment, preventing the background worker from becoming unresponsive and complying with Manifest V3 restrictions.

### Universal Reorder System
The reordering system is engineered for cross-platform stability. By using specific `Mouse` and `Touch` sensors instead of the generic `PointerSensor`, it bypasses common Chromium bugs related to pointer event cancellation in extension sidepanels.

### Privacy-First Design
- **Local Conversion**: All image processing happens client-side using Wasm.
- **No Tracking**: No analytics or external data collection.
- **Permission Scoped**: Requests minimal permissions necessary for core functionality (`contextMenus`, `sidePanel`, `storage`, `offscreen`).

## Development & Build

### Commands
```bash
# Start development (Chrome)
pnpm dev:chrome

# Start development (Firefox)
pnpm dev:firefox

# Build production bundle
pnpm build

# Package into ZIP files
pnpm package
```

### Manifest Configuration
The extension manifest is managed via Plasmo. Key permissions include:
- `contextMenus`: For the "Save as..." feature.
- `sidePanel`: For the SEO Audit persistent view.
- `offscreen`: For Wasm-unsafe-eval processing.
- `storage`: For preset and preference persistence.

## Contributors Note
When adding features that involve DOM manipulation, always ensure logic is encapsulated in the `src/features/` directory and use message passing to communicate with the UI layers. Maintain the `PLATFORM:extension` marker to prevent accidental imports in the web app.
