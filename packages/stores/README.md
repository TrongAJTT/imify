# Imify Stores (`packages/stores`)

Global state management for the Imify application suite, powered by [Zustand](https://github.com/pmndrs/zustand).

## Store Architecture

We use a modular store approach where each major feature has its own dedicated store. This prevents a single massive state object and improves performance by scoping re-renders.

## Available Stores

### 1. Feature Stores (`src/stores/`)
- `useSplitterStore`: Manages active splitter settings, grid config, and guides.
- `useSplicingStore`: Controls image order and splicing layouts.
- `useBatchProcessorStore`: Tracks the queue of images and processing status.
- `useFillingStore`: Handles pattern templates and generation parameters.

### 2. UI & Workspace Stores
- `useWorkspaceHeaderStore`: Manages breadcrumbs and header titles.
- `useWorkspaceSidebarStore`: Handles right-sidebar registration and visibility.
- `useWorkspaceSettingsDialogStore`: Controls the global settings overlay state.

## Persistence
While this package defines the stores, **persistence** (to `localStorage` or `chrome.storage`) is handled at the application level using adapters. This allows the extension to use `chrome.storage.local` while the web app uses standard `localStorage`.

## Best Practices
- **Selectors**: Always use selectors when consuming state to avoid unnecessary re-renders.
- **Actions**: Keep state mutations within the store's action definitions.
- **Platform Neutrality**: Stores should not use browser-specific or extension-specific APIs directly.
