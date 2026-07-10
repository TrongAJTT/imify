---
name: upscaler
description: "Skill for the Upscaler area of imify. 34 symbols across 13 files."
---

# Upscaler

34 symbols | 13 files | Cohesion: 72%

## When to Use

- Working with code in `packages/`
- Understanding how UpscalerPage, UpscalerPage, unsubStart work
- Modifying upscaler-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/features/upscaler/upscaler-pages.tsx` | UpscalerHardwareNoticeCard, UpscalerPage, unsubStart, unsubFinish, setHeaderSection (+2) |
| `packages/features/src/upscaler/use-image-upscaler.ts` | initWorker, upscaleImage, useImageUpscaler, terminateWorker, handleMessage |
| `packages/features/src/upscaler/page.tsx` | setHasImage, handleLoadFile, handleClear, onImages, SharedUpscalerPage |
| `packages/features/src/upscaler/image-upscaler.worker.ts` | detectBestDevice, getInstance, applyDenoise, getIndex |
| `packages/features/src/workspace-chrome/asset-tabs/asset-ai-models-tab.tsx` | checkCache, handleDelete, handleDownloadConfirm |
| `packages/features/src/upscaler/model-variant-dialog.tsx` | ModelVariantDialog, handleModelSelect |
| `packages/features/src/upscaler/sidebar.tsx` | UpscalerSidebar, UpscalerSidebarShell |
| `apps/web/src/app/upscaler/page.tsx` | UpscalerPage |
| `packages/features/src/upscaler/drop-zone.tsx` | UpscalerDropZone |
| `packages/features/src/upscaler/models.ts` | resolveHuggingFaceRepoId |

## Entry Points

Start here when exploring this area:

- **`UpscalerPage`** (Function) — `apps/web/src/app/upscaler/page.tsx:6`
- **`UpscalerPage`** (Function) — `apps/web/src/features/upscaler/upscaler-pages.tsx:36`
- **`unsubStart`** (Function) — `apps/web/src/features/upscaler/upscaler-pages.tsx:40`
- **`unsubFinish`** (Function) — `apps/web/src/features/upscaler/upscaler-pages.tsx:41`
- **`setHeaderSection`** (Function) — `apps/web/src/features/upscaler/upscaler-pages.tsx:52`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `UpscalerPage` | Function | `apps/web/src/app/upscaler/page.tsx` | 6 |
| `UpscalerPage` | Function | `apps/web/src/features/upscaler/upscaler-pages.tsx` | 36 |
| `unsubStart` | Function | `apps/web/src/features/upscaler/upscaler-pages.tsx` | 40 |
| `unsubFinish` | Function | `apps/web/src/features/upscaler/upscaler-pages.tsx` | 41 |
| `setHeaderSection` | Function | `apps/web/src/features/upscaler/upscaler-pages.tsx` | 52 |
| `setHeaderBreadcrumb` | Function | `apps/web/src/features/upscaler/upscaler-pages.tsx` | 53 |
| `resetHeader` | Function | `apps/web/src/features/upscaler/upscaler-pages.tsx` | 54 |
| `UpscalerDropZone` | Function | `packages/features/src/upscaler/drop-zone.tsx` | 9 |
| `resolveHuggingFaceRepoId` | Function | `packages/features/src/upscaler/models.ts` | 156 |
| `initWorker` | Function | `packages/features/src/upscaler/use-image-upscaler.ts` | 137 |
| `upscaleImage` | Function | `packages/features/src/upscaler/use-image-upscaler.ts` | 161 |
| `checkModel` | Function | `packages/features/src/upscaler/workspace.tsx` | 79 |
| `checkCache` | Function | `packages/features/src/workspace-chrome/asset-tabs/asset-ai-models-tab.tsx` | 51 |
| `handleDelete` | Function | `packages/features/src/workspace-chrome/asset-tabs/asset-ai-models-tab.tsx` | 99 |
| `handleDownloadConfirm` | Function | `packages/features/src/workspace-chrome/asset-tabs/asset-ai-models-tab.tsx` | 146 |
| `decodeFileToImageData` | Function | `packages/engine/src/image-pipeline/decode-image-data.ts` | 150 |
| `computePreview` | Function | `packages/features/src/splitter/splitter-tab.tsx` | 235 |
| `setHasImage` | Function | `packages/features/src/upscaler/page.tsx` | 30 |
| `handleLoadFile` | Function | `packages/features/src/upscaler/page.tsx` | 60 |
| `handleClear` | Function | `packages/features/src/upscaler/page.tsx` | 72 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `SplitterTab → CreateContext` | cross_community | 6 |
| `SplitterTab → ReadIfdDimension` | cross_community | 6 |
| `SingleProcessorWorkspace → IsLikelyTiff` | cross_community | 5 |
| `SplitterTab → IsLikelyTiff` | cross_community | 5 |
| `SplitterTab → ParseRatio` | cross_community | 5 |
| `SplitterTab → ClampInt` | cross_community | 5 |
| `SplitterTab → BuildSizes` | cross_community | 5 |
| `SplitterTab → OrderIntervals` | cross_community | 5 |
| `SplitterTab → IsSolid` | cross_community | 5 |
| `SplitterTab → Within` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Processor | 4 calls |
| Ui | 3 calls |
| Background-removal | 2 calls |
| Splitter | 2 calls |
| Splicing | 1 calls |
| Image-pipeline | 1 calls |

## How to Explore

1. `gitnexus_context({name: "UpscalerPage"})` — see callers and callees
2. `gitnexus_query({query: "upscaler"})` — find related execution flows
3. Read key files listed above for implementation details
