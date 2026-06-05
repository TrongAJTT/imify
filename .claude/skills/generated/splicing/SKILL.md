---
name: splicing
description: "Skill for the Splicing area of imify. 163 symbols across 44 files."
---

# Splicing

163 symbols | 44 files | Cohesion: 74%

## When to Use

- Working with code in `packages/`
- Understanding how hasEdgeBrand, detectBrowser, useConversionToasts work
- Modifying splicing-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/features/src/splicing/splicing-tab.tsx` | SplicingTab, setPreviewBentoFlowGroupCount, handleLayoutComputed, setResizeQuickStats, cancelHeavyPreviewQuality (+25) |
| `apps/web/src/features/splicing/splicing-pages.tsx` | useSplicingPresetHydrated, unsubStart, unsubFinish, extractSplicingPresetConfig, SplicingLandingPage (+11) |
| `packages/features/src/splicing/layout-engine.ts` | getMainDim, getCrossDim, buildFlowGroups, resolvePlacementRects, applyAlignment (+11) |
| `packages/features/src/splicing/canvas-renderer.ts` | renderToOffscreen, exportSplicedImage, runOne, workers, parseLinearGradientBackground (+9) |
| `packages/features/src/pattern/pattern-tab.tsx` | PatternBoundaryVisualOverlay, closeBitmapMap, loadBitmapFromUrl, PatternTab, hideVisualBoundary (+4) |
| `packages/features/src/splicing/use-splicing-export.ts` | useSplicingExport, downloadBlob, createZipBlob, performExport, convertBlobToPdfPage (+3) |
| `packages/features/src/splicing/splicing-sidebar-fields.tsx` | getAvailableExportModes, isBentoFlowLayoutMode, getBentoDirectionOptions, getBentoFlowSizeLabel, mapBentoLayoutModeToDirections (+2) |
| `packages/features/src/splicing/canvas-preview.tsx` | draw, CanvasPreview, revokeAll, buildPreviewSources, run (+2) |
| `packages/features/src/splicing/splicing-sidebar-panel.tsx` | SplicingSidebarPanel, setLayout, setCanvas, setImage, setExportSettings (+1) |
| `packages/stores/src/stores/splicing-store.ts` | resolveLayoutConfig, resolveCanvasStyle, resolveImageStyle, normalizePreviewQualityPercent, setPreviewQualityPercent |

## Entry Points

Start here when exploring this area:

- **`hasEdgeBrand`** (Function) — `packages/core/src/browser-detection.ts:8`
- **`detectBrowser`** (Function) — `packages/core/src/browser-detection.ts:12`
- **`useConversionToasts`** (Function) — `packages/core/src/hooks/use-toast.ts:38`
- **`useShortcutActions`** (Function) — `packages/features/src/filling/use-shortcut-actions.ts:17`
- **`ProgressToast`** (Function) — `apps/extension/src/contents/progress-toast.tsx:28`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `hasEdgeBrand` | Function | `packages/core/src/browser-detection.ts` | 8 |
| `detectBrowser` | Function | `packages/core/src/browser-detection.ts` | 12 |
| `useConversionToasts` | Function | `packages/core/src/hooks/use-toast.ts` | 38 |
| `useShortcutActions` | Function | `packages/features/src/filling/use-shortcut-actions.ts` | 17 |
| `ProgressToast` | Function | `apps/extension/src/contents/progress-toast.tsx` | 28 |
| `SingleProcessorTab` | Function | `apps/extension/src/options/components/single-processor-tab.tsx` | 24 |
| `tabContent` | Function | `apps/extension/src/options/index.tsx` | 525 |
| `BackgroundRemoverDropZone` | Function | `packages/features/src/background-removal/drop-zone.tsx` | 9 |
| `SharedDiffcheckerPage` | Function | `packages/features/src/diffchecker/diffchecker-page.tsx` | 67 |
| `PatternTab` | Function | `packages/features/src/pattern/pattern-tab.tsx` | 48 |
| `hideVisualBoundary` | Function | `packages/features/src/pattern/pattern-tab.tsx` | 57 |
| `replaceAssetBitmaps` | Function | `packages/features/src/pattern/pattern-tab.tsx` | 273 |
| `replaceBackgroundBitmap` | Function | `packages/features/src/pattern/pattern-tab.tsx` | 280 |
| `load` | Function | `packages/features/src/pattern/pattern-tab.tsx` | 319 |
| `loadBackground` | Function | `packages/features/src/pattern/pattern-tab.tsx` | 354 |
| `useClipboardImageIntake` | Function | `packages/features/src/shared/use-clipboard-image-intake.ts` | 17 |
| `useClipboardPaste` | Function | `packages/features/src/shared/use-clipboard-paste.ts` | 44 |
| `useSplicingExport` | Function | `packages/features/src/splicing/use-splicing-export.ts` | 65 |
| `useShortcutPreferences` | Function | `packages/stores/src/use-shortcut-preferences.ts` | 33 |
| `BatchDownloadConfirmDialog` | Function | `packages/features/src/shared/download-confirm-dialog.tsx` | 20 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `SplicingLandingPage → ClampNumber` | cross_community | 8 |
| `ProcessorWorkPage → ClampNumber` | cross_community | 8 |
| `SplicingWorkPage → ClampNumber` | cross_community | 8 |
| `PerformExport → FlushQueue` | cross_community | 6 |
| `SplitterTab → CreateContext` | cross_community | 6 |
| `SplitterTab → ReadIfdDimension` | cross_community | 6 |
| `PerformExport → CreateEngineWasmWorker` | cross_community | 5 |
| `PerformExport → Terminate` | cross_community | 5 |
| `ExtractRasterFrame → ClampDimension` | cross_community | 5 |
| `ExtractRasterFrame → GetOffscreen2DContext` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Processor | 16 calls |
| Ui | 8 calls |
| Converter | 6 calls |
| Diffchecker | 6 calls |
| Splitter | 5 calls |
| Background-removal | 3 calls |
| Pattern | 3 calls |
| Batch | 2 calls |

## How to Explore

1. `gitnexus_context({name: "hasEdgeBrand"})` — see callers and callees
2. `gitnexus_query({query: "splicing"})` — find related execution flows
3. Read key files listed above for implementation details
