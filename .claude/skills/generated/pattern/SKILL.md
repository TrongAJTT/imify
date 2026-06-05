---
name: pattern
description: "Skill for the Pattern area of imify. 170 symbols across 23 files."
---

# Pattern

170 symbols | 23 files | Cohesion: 81%

## When to Use

- Working with code in `packages/`
- Understanding how renderPatternToContext, resolveAssetSource, drawAllPlacements work
- Modifying pattern-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/features/src/pattern/pattern-renderer.ts` | clamp, clampNonNegative, safeDimension, normalizeHexColor, parseHexColorToRgb (+22) |
| `packages/features/src/pattern/pattern-asset-drawing-dialog.tsx` | normalizeSuggestedName, sanitizePercent, stopEvent, stopEventAndPreventDefault, PatternAssetDrawingDialog (+13) |
| `apps/web/src/features/pattern/pattern-pages.tsx` | extractPatternPresetConfig, PatternLandingPage, setHeaderActions, resetHeader, setPresetViewMode (+12) |
| `packages/features/src/pattern/pattern-assets-accordion.tsx` | createPatternAssetId, toSuggestedAssetName, revokeObjectUrlIfNeeded, resolveBitmapSize, buildAssetFromBlob (+11) |
| `packages/features/src/pattern/pattern-generator.ts` | mulberry32, getPlacementCorners, isPlacementAcceptedByStrictBoundaryMode, isPlacementAcceptedByCenterBoundaryMode, shouldRenderPlacement (+11) |
| `packages/features/src/pattern/pattern-drawing-utils.ts` | toLocalCanvasPoint, toBrushPreview, clamp01, drawPolylineStroke, drawSmoothBrushStroke (+4) |
| `packages/features/src/pattern/pattern-workspace-shell.tsx` | extractPatternPresetConfig, PatternWorkspaceShell, setPresetViewMode, ensureDefaultPreset, saveCurrentPreset (+4) |
| `packages/features/src/pattern/pattern-export-utils.ts` | resolveRasterTargetFormat, downloadBlob, loadAssetBitmaps, loadBackgroundBitmap, exportPatternWithWorker (+2) |
| `packages/features/src/pattern/pattern-canvas-accordion.tsx` | revokeObjectUrlIfNeeded, PatternCanvasAccordion, setCanvas, setCanvasSize, handleUploadBackground (+2) |
| `packages/features/src/pattern/pattern-tab.tsx` | clearExportToastHideTimer, pushExportToast, scheduleExportToastHide, handleRemoveExportToast, handleExportPattern (+1) |

## Entry Points

Start here when exploring this area:

- **`renderPatternToContext`** (Function) — `packages/features/src/pattern/pattern-renderer.ts:634`
- **`resolveAssetSource`** (Function) — `packages/features/src/pattern/pattern-renderer.ts:644`
- **`drawAllPlacements`** (Function) — `packages/features/src/pattern/pattern-renderer.ts:693`
- **`drawImagesAndBorders`** (Function) — `packages/features/src/pattern/pattern-renderer.ts:694`
- **`drawBordersOnly`** (Function) — `packages/features/src/pattern/pattern-renderer.ts:723`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `renderPatternToContext` | Function | `packages/features/src/pattern/pattern-renderer.ts` | 634 |
| `resolveAssetSource` | Function | `packages/features/src/pattern/pattern-renderer.ts` | 644 |
| `drawAllPlacements` | Function | `packages/features/src/pattern/pattern-renderer.ts` | 693 |
| `drawImagesAndBorders` | Function | `packages/features/src/pattern/pattern-renderer.ts` | 694 |
| `drawBordersOnly` | Function | `packages/features/src/pattern/pattern-renderer.ts` | 723 |
| `renderPatternToImageData` | Function | `packages/features/src/pattern/pattern-renderer.ts` | 787 |
| `PatternAssetsAccordion` | Function | `packages/features/src/pattern/pattern-assets-accordion.tsx` | 92 |
| `addAsset` | Function | `packages/features/src/pattern/pattern-assets-accordion.tsx` | 94 |
| `updateAsset` | Function | `packages/features/src/pattern/pattern-assets-accordion.tsx` | 95 |
| `removeAsset` | Function | `packages/features/src/pattern/pattern-assets-accordion.tsx` | 96 |
| `clearAssets` | Function | `packages/features/src/pattern/pattern-assets-accordion.tsx` | 97 |
| `handleAssetFilesUpload` | Function | `packages/features/src/pattern/pattern-assets-accordion.tsx` | 121 |
| `handleRemoveAsset` | Function | `packages/features/src/pattern/pattern-assets-accordion.tsx` | 152 |
| `handleClearAssets` | Function | `packages/features/src/pattern/pattern-assets-accordion.tsx` | 158 |
| `handleDrawingSave` | Function | `packages/features/src/pattern/pattern-assets-accordion.tsx` | 166 |
| `toLocalCanvasPoint` | Function | `packages/features/src/pattern/pattern-drawing-utils.ts` | 170 |
| `toBrushPreview` | Function | `packages/features/src/pattern/pattern-drawing-utils.ts` | 184 |
| `PatternAssetDrawingDialog` | Function | `packages/features/src/pattern/pattern-asset-drawing-dialog.tsx` | 83 |
| `brushSmoothingSettings` | Function | `packages/features/src/pattern/pattern-asset-drawing-dialog.tsx` | 151 |
| `beginStroke` | Function | `packages/features/src/pattern/pattern-asset-drawing-dialog.tsx` | 290 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `PatternAssetDrawingDialog → Clamp01` | cross_community | 6 |
| `PatternAssetDrawingDialog → DrawPolylineStroke` | cross_community | 6 |
| `BatchProcessorWorkPage → ReadWideSidebarGridEnabled` | cross_community | 5 |
| `BatchProcessorWorkPage → UnsubStart` | cross_community | 5 |
| `FillingEditPage → ReadWideSidebarGridEnabled` | cross_community | 5 |
| `FillingEditPage → UnsubStart` | cross_community | 5 |
| `FillingFillPage → ReadWideSidebarGridEnabled` | cross_community | 5 |
| `FillingFillPage → UnsubStart` | cross_community | 5 |
| `FillingGridDesignPage → ReadWideSidebarGridEnabled` | cross_community | 5 |
| `FillingGridDesignPage → UnsubStart` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Processor | 10 calls |
| Stores | 4 calls |
| Splitter | 4 calls |
| Ui | 4 calls |
| Filling | 3 calls |
| Splicing | 2 calls |
| Hooks | 1 calls |
| Background-removal | 1 calls |

## How to Explore

1. `gitnexus_context({name: "renderPatternToContext"})` — see callers and callees
2. `gitnexus_query({query: "pattern"})` — find related execution flows
3. Read key files listed above for implementation details
