---
name: diffchecker
description: "Skill for the Diffchecker area of imify. 71 symbols across 24 files."
---

# Diffchecker

71 symbols | 24 files | Cohesion: 79%

## When to Use

- Working with code in `packages/`
- Understanding how alignImages, computeHeatmapDiff, computeBinaryDiff work
- Modifying diffchecker-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/features/src/diffchecker/diff-engine.ts` | alignImages, heatColor, computeHeatmapDiff, computeBinaryDiff, toLuminance (+9) |
| `packages/features/src/diffchecker/diffchecker-page.tsx` | timer, handleExport, createImageItemWithDecodedData, handleLoadFromSide, handleLoadA (+5) |
| `apps/web/src/features/diffchecker/diffchecker-page.tsx` | useDiffcheckerStoreHydrated, unsubStart, unsubFinish, DiffcheckerPage, setHeaderSection (+5) |
| `apps/extension/src/options/components/diffchecker/diffchecker-tab.tsx` | DiffcheckerTab, setHeaderSection, setHeaderActions, setHeaderBreadcrumb, resetHeader (+1) |
| `packages/features/src/diffchecker/pixel-compare-workspace.tsx` | imageDataToPreviewSourceBlob, renderWithWorker, renderPreview, PreviewLoadingOverlay, PixelCompareWorkspace |
| `packages/features/src/diffchecker/image-drop-pair.tsx` | openFilePicker, DropZone, ImageDropPair |
| `packages/features/src/diffchecker/viewer-shell.tsx` | ViewerShell, onFullscreenChange, handleToggleFullscreen |
| `packages/features/src/diffchecker/diff-stats-bar.tsx` | formatPercent, DiffStatsBar |
| `packages/features/src/splitter/splitter-preview.tsx` | SplitterPreview, syncFrameWidth |
| `packages/engine/src/converter/preview-worker-client.ts` | isImagePreviewWorkerSupported, createImagePreviewInWorker |

## Entry Points

Start here when exploring this area:

- **`alignImages`** (Function) — `packages/features/src/diffchecker/diff-engine.ts:16`
- **`computeHeatmapDiff`** (Function) — `packages/features/src/diffchecker/diff-engine.ts:112`
- **`computeBinaryDiff`** (Function) — `packages/features/src/diffchecker/diff-engine.ts:146`
- **`computeSSIM`** (Function) — `packages/features/src/diffchecker/diff-engine.ts:276`
- **`computeDiffStats`** (Function) — `packages/features/src/diffchecker/diff-engine.ts:322`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `alignImages` | Function | `packages/features/src/diffchecker/diff-engine.ts` | 16 |
| `computeHeatmapDiff` | Function | `packages/features/src/diffchecker/diff-engine.ts` | 112 |
| `computeBinaryDiff` | Function | `packages/features/src/diffchecker/diff-engine.ts` | 146 |
| `computeSSIM` | Function | `packages/features/src/diffchecker/diff-engine.ts` | 276 |
| `computeDiffStats` | Function | `packages/features/src/diffchecker/diff-engine.ts` | 322 |
| `computeFullDiff` | Function | `packages/features/src/diffchecker/diff-engine.ts` | 365 |
| `exportCompositeView` | Function | `packages/features/src/diffchecker/diff-engine.ts` | 403 |
| `timer` | Function | `packages/features/src/diffchecker/diffchecker-page.tsx` | 177 |
| `handleExport` | Function | `packages/features/src/diffchecker/diffchecker-page.tsx` | 242 |
| `DiffcheckerPage` | Function | `apps/web/src/app/diffchecker/page.tsx` | 6 |
| `DiffcheckerPage` | Function | `apps/web/src/features/diffchecker/diffchecker-page.tsx` | 28 |
| `setHeaderSection` | Function | `apps/web/src/features/diffchecker/diffchecker-page.tsx` | 31 |
| `setHeaderActions` | Function | `apps/web/src/features/diffchecker/diffchecker-page.tsx` | 32 |
| `setHeaderBreadcrumb` | Function | `apps/web/src/features/diffchecker/diffchecker-page.tsx` | 33 |
| `resetHeader` | Function | `apps/web/src/features/diffchecker/diffchecker-page.tsx` | 34 |
| `setHasImage` | Function | `apps/web/src/features/diffchecker/diffchecker-page.tsx` | 58 |
| `sidebar` | Function | `apps/web/src/features/diffchecker/diffchecker-page.tsx` | 35 |
| `AlignmentAccordion` | Function | `packages/features/src/diffchecker/alignment-accordion.tsx` | 15 |
| `ComparisonAccordion` | Function | `packages/features/src/diffchecker/comparison-accordion.tsx` | 21 |
| `DiffcheckerPresetInfoPanel` | Function | `packages/features/src/diffchecker/diffchecker-preset-info-panel.tsx` | 4 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `DiffcheckerPage → ReadWideSidebarGridEnabled` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Processor | 5 calls |
| Fill | 2 calls |
| Image-pipeline | 2 calls |
| Converter | 1 calls |
| Background-removal | 1 calls |
| Upscaler | 1 calls |
| Splitter | 1 calls |

## How to Explore

1. `gitnexus_context({name: "alignImages"})` — see callers and callees
2. `gitnexus_query({query: "diffchecker"})` — find related execution flows
3. Read key files listed above for implementation details
