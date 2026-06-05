---
name: filling
description: "Skill for the Filling area of imify. 209 symbols across 41 files."
---

# Filling

209 symbols | 41 files | Cohesion: 77%

## When to Use

- Working with code in `packages/`
- Understanding how generateShapePoints, clampQuality, buildJxlEncodeOptions work
- Modifying filling-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/features/src/filling/shape-generators.ts` | generateShapePoints, rectanglePoints, circlePoints, equilateralTrianglePoints, rightTrianglePoints (+15) |
| `apps/web/src/features/filling/filling-pages.tsx` | ManualEditorWorkspace, SymmetricWorkspace, GridDesignWorkspace, toTitle, toFillingStep (+15) |
| `packages/features/src/filling/group-geometry.ts` | applyRuntimeTransformToPoint, computeConvexHull, buildGroupOverlayPolygons, buildGroupFillPolygons, buildConnectionHulls (+13) |
| `apps/extension/src/options/components/filling/filling-tab.tsx` | FillingTab, setTemplates, setHeaderSection, setHeaderBreadcrumb, setHeaderActions (+9) |
| `packages/features/src/filling/template-list-panel.tsx` | sortFillingTemplates, sortFn, FillingTemplateListPanel, FillingTemplateCard, handleExportPsd (+5) |
| `apps/extension/src/options/components/filling/template-card.tsx` | setFillingStep, setActiveTemplateId, setEditingTemplateId, initFillStatesForTemplate, handleSelect (+5) |
| `packages/features/src/filling/filling-export-utils.ts` | encodeJxl, encodeFilledImageData, exportFilledTemplateInline, loadAllImagesAsBitmaps, resolveRasterTargetFormat (+4) |
| `packages/features/src/filling/canvas-export-renderer.ts` | parseLinearGradient, createLayerLinearGradient, renderFilledCanvas, createClosedPath, drawLayerItem (+4) |
| `packages/features/src/filling/template-storage.ts` | getDB, getAll, get, save, remove (+4) |
| `packages/features/src/filling/editor-context.tsx` | useEditorContext, updateLayer, setEditorLayers, setSelectedLayerIds, clearSelectedLayers (+3) |

## Entry Points

Start here when exploring this area:

- **`generateShapePoints`** (Function) — `packages/features/src/filling/shape-generators.ts:8`
- **`clampQuality`** (Function) — `packages/core/src/image-utils.ts:218`
- **`buildJxlEncodeOptions`** (Function) — `packages/core/src/jxl-options.ts:122`
- **`encodeRasterWithAdapters`** (Function) — `packages/engine/src/converter/raster-encode-adapters.ts:283`
- **`setTemplates`** (Function) — `apps/web/src/features/filling/filling-pages.tsx:71`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `generateShapePoints` | Function | `packages/features/src/filling/shape-generators.ts` | 8 |
| `clampQuality` | Function | `packages/core/src/image-utils.ts` | 218 |
| `buildJxlEncodeOptions` | Function | `packages/core/src/jxl-options.ts` | 122 |
| `encodeRasterWithAdapters` | Function | `packages/engine/src/converter/raster-encode-adapters.ts` | 283 |
| `setTemplates` | Function | `apps/web/src/features/filling/filling-pages.tsx` | 71 |
| `refreshTemplates` | Function | `apps/web/src/features/filling/filling-pages.tsx` | 80 |
| `FillingFlowPage` | Function | `apps/web/src/features/filling/filling-pages.tsx` | 145 |
| `setTemplatesLoaded` | Function | `apps/web/src/features/filling/filling-pages.tsx` | 156 |
| `setFillingStep` | Function | `apps/web/src/features/filling/filling-pages.tsx` | 157 |
| `setActiveTemplateId` | Function | `apps/web/src/features/filling/filling-pages.tsx` | 158 |
| `setEditingTemplateId` | Function | `apps/web/src/features/filling/filling-pages.tsx` | 159 |
| `initFillStatesForTemplate` | Function | `apps/web/src/features/filling/filling-pages.tsx` | 160 |
| `renderFilledCanvas` | Function | `packages/features/src/filling/canvas-export-renderer.ts` | 99 |
| `applyRuntimeTransformToPoint` | Function | `packages/features/src/filling/group-geometry.ts` | 113 |
| `FillingBreadcrumb` | Function | `apps/extension/src/options/components/filling/breadcrumb.tsx` | 16 |
| `FillingTab` | Function | `apps/extension/src/options/components/filling/filling-tab.tsx` | 36 |
| `setTemplates` | Function | `apps/extension/src/options/components/filling/filling-tab.tsx` | 42 |
| `setHeaderSection` | Function | `apps/extension/src/options/components/filling/filling-tab.tsx` | 48 |
| `setHeaderBreadcrumb` | Function | `apps/extension/src/options/components/filling/filling-tab.tsx` | 49 |
| `setHeaderActions` | Function | `apps/extension/src/options/components/filling/filling-tab.tsx` | 50 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `HandleLayerTransformDragMove → RectanglePoints` | cross_community | 7 |
| `HandleLayerTransformDragMove → CirclePoints` | cross_community | 7 |
| `HandleLayerTransformDragMove → EquilateralTrianglePoints` | cross_community | 6 |
| `HandleLayerTransformDragMove → RightTrianglePoints` | cross_community | 6 |
| `FillLayerAccordion → ClearOpenTimer` | cross_community | 6 |
| `FillLayerAccordion → ClearCloseTimer` | cross_community | 6 |
| `HandleLayerTransformDragMove → ApplyRuntimeTransformToPoint` | cross_community | 5 |
| `HandleTransformEnd → RectanglePoints` | cross_community | 5 |
| `HandleTransformEnd → CirclePoints` | cross_community | 5 |
| `HandleTransformEnd → EquilateralTrianglePoints` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Fill | 8 calls |
| Processor | 8 calls |
| Ui | 7 calls |
| Background-removal | 1 calls |
| Splitter | 1 calls |
| Symmetric-generator | 1 calls |
| Grid-designer | 1 calls |

## How to Explore

1. `gitnexus_context({name: "generateShapePoints"})` — see callers and callees
2. `gitnexus_query({query: "filling"})` — find related execution flows
3. Read key files listed above for implementation details
