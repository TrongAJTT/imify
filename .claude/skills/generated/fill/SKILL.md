---
name: fill
description: "Skill for the Fill area of imify. 122 symbols across 17 files."
---

# Fill

122 symbols | 17 files | Cohesion: 81%

## When to Use

- Working with code in `packages/`
- Understanding how toWorldLayerPoints, getBoundsFromPoints, applyRuntimeTransformToPolygons work
- Modifying fill-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/features/src/filling/fill/workspace.tsx` | selectedEmptyDropPolygons, getRuntimeItemBounds, getLayerSnapCandidateRects, handleLayerTransformDragMove, selectedEmptyImageOverlay (+48) |
| `packages/features/src/filling/fill/layer-customization-accordion.tsx` | safeRevokeObjectUrl, updateLayerFillState, setActiveCustomizationTab, handler, updateSelectedLayerState (+24) |
| `packages/features/src/filling/edit/workspace.tsx` | handleStagePointerUp, handleDragMove, candidateBounds, clampPreviewZoom, handlePreviewWheel |
| `packages/features/src/filling/fill/runtime-items.ts` | makeFillGroupRuntimeId, buildFillRuntimeItems, expandRuntimeOrderToVisibleLayerIds, isFillGroupRuntimeId, parseFillGroupId |
| `packages/features/src/filling/fill/layer-card.tsx` | blobToDataUrl, generateLayerPreview, FillLayerCard, setSelectedLayerId, loadPreview |
| `packages/features/src/filling/fill/canvas-accordion.tsx` | setState, update, handleBgImageUpload, handleClearBgImage |
| `packages/features/src/filling/group-geometry.ts` | toWorldLayerPoints, getBoundsFromPoints, applyRuntimeTransformToPolygons |
| `packages/features/src/pattern/pattern-tab.tsx` | clampPreviewZoom, handlePreviewWheel, handleNativeWheel |
| `packages/features/src/filling/fill/sidebar.tsx` | runtimeItems, updateSessionTemplate, onDragEnd |
| `packages/features/src/filling/grid-designer/workspace.tsx` | clampPreviewZoom, handlePreviewWheel |

## Entry Points

Start here when exploring this area:

- **`toWorldLayerPoints`** (Function) — `packages/features/src/filling/group-geometry.ts:25`
- **`getBoundsFromPoints`** (Function) — `packages/features/src/filling/group-geometry.ts:45`
- **`applyRuntimeTransformToPolygons`** (Function) — `packages/features/src/filling/group-geometry.ts:134`
- **`handleStagePointerUp`** (Function) — `packages/features/src/filling/edit/workspace.tsx:256`
- **`handleDragMove`** (Function) — `packages/features/src/filling/edit/workspace.tsx:289`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `toWorldLayerPoints` | Function | `packages/features/src/filling/group-geometry.ts` | 25 |
| `getBoundsFromPoints` | Function | `packages/features/src/filling/group-geometry.ts` | 45 |
| `applyRuntimeTransformToPolygons` | Function | `packages/features/src/filling/group-geometry.ts` | 134 |
| `handleStagePointerUp` | Function | `packages/features/src/filling/edit/workspace.tsx` | 256 |
| `handleDragMove` | Function | `packages/features/src/filling/edit/workspace.tsx` | 289 |
| `candidateBounds` | Function | `packages/features/src/filling/edit/workspace.tsx` | 295 |
| `selectedEmptyDropPolygons` | Function | `packages/features/src/filling/fill/workspace.tsx` | 290 |
| `getRuntimeItemBounds` | Function | `packages/features/src/filling/fill/workspace.tsx` | 832 |
| `getLayerSnapCandidateRects` | Function | `packages/features/src/filling/fill/workspace.tsx` | 854 |
| `handleLayerTransformDragMove` | Function | `packages/features/src/filling/fill/workspace.tsx` | 975 |
| `selectedEmptyImageOverlay` | Function | `packages/features/src/filling/fill/workspace.tsx` | 1434 |
| `resolveLayerContainerHighlightMode` | Function | `packages/features/src/filling/layer-visual-highlight.ts` | 4 |
| `FillWorkspace` | Function | `packages/features/src/filling/fill/workspace.tsx` | 121 |
| `initializeFillSession` | Function | `packages/features/src/filling/fill/workspace.tsx` | 147 |
| `setSelectedLayerId` | Function | `packages/features/src/filling/fill/workspace.tsx` | 157 |
| `triggerEmptyLayerImageSelect` | Function | `packages/features/src/filling/fill/workspace.tsx` | 368 |
| `handleEmptyOverlayClick` | Function | `packages/features/src/filling/fill/workspace.tsx` | 376 |
| `handler` | Function | `packages/features/src/filling/fill/workspace.tsx` | 524 |
| `toStageGuideLines` | Function | `packages/features/src/filling/fill/workspace.tsx` | 809 |
| `handleStageClick` | Function | `packages/features/src/filling/fill/workspace.tsx` | 916 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `HandleLayerTransformDragMove → RectanglePoints` | cross_community | 7 |
| `HandleLayerTransformDragMove → CirclePoints` | cross_community | 7 |
| `HandleLayerTransformDragMove → EquilateralTrianglePoints` | cross_community | 6 |
| `HandleLayerTransformDragMove → RightTrianglePoints` | cross_community | 6 |
| `HandleLayerTransformDragMove → GetBoundsFromPoints` | intra_community | 5 |
| `HandleLayerTransformDragMove → ApplyRuntimeTransformToPoint` | cross_community | 5 |
| `HandleTransformEnd → RectanglePoints` | cross_community | 5 |
| `HandleTransformEnd → CirclePoints` | cross_community | 5 |
| `HandleTransformEnd → EquilateralTrianglePoints` | cross_community | 5 |
| `HandleTransformEnd → RightTrianglePoints` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Filling | 10 calls |
| Ui | 6 calls |
| Splicing | 4 calls |
| Background-removal | 3 calls |
| Diffchecker | 1 calls |
| Edit | 1 calls |
| Symmetric-generator | 1 calls |
| Stores | 1 calls |

## How to Explore

1. `gitnexus_context({name: "toWorldLayerPoints"})` — see callers and callees
2. `gitnexus_query({query: "fill"})` — find related execution flows
3. Read key files listed above for implementation details
