---
name: grid-designer
description: "Skill for the Grid-designer area of imify. 33 symbols across 6 files."
---

# Grid-designer

33 symbols | 6 files | Cohesion: 79%

## When to Use

- Working with code in `packages/`
- Understanding how parseGridDesign, validation, parseResult work
- Modifying grid-designer-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/features/src/filling/grid-designer/generator.ts` | nearlyEqual, clampPositiveInt, normalizeRowDefinitions, resolveGapX, resolveGapY (+8) |
| `packages/features/src/filling/grid-designer/sidebar.tsx` | GridTemplatePreview, validation, normalizeGridDesignParams, setGridDesignParams, params (+4) |
| `packages/features/src/filling/grid-designer/workspace.tsx` | parseResult, GridDesignWorkspace, setGridDesignParams, setGridLayerCount, updateTemplate (+3) |
| `packages/features/src/filling/types.ts` | generateId |
| `packages/features/src/filling/template-method-dialog.tsx` | handleCreate |
| `packages/features/src/filling/grid-designer/canvas-layer.tsx` | GridDesignCanvasLayer |

## Entry Points

Start here when exploring this area:

- **`parseGridDesign`** (Function) — `packages/features/src/filling/grid-designer/generator.ts:283`
- **`validation`** (Function) — `packages/features/src/filling/grid-designer/sidebar.tsx:178`
- **`parseResult`** (Function) — `packages/features/src/filling/grid-designer/workspace.tsx:81`
- **`setGridDesignParams`** (Function) — `packages/features/src/filling/grid-designer/sidebar.tsx:118`
- **`params`** (Function) — `packages/features/src/filling/grid-designer/sidebar.tsx:121`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `parseGridDesign` | Function | `packages/features/src/filling/grid-designer/generator.ts` | 283 |
| `validation` | Function | `packages/features/src/filling/grid-designer/sidebar.tsx` | 178 |
| `parseResult` | Function | `packages/features/src/filling/grid-designer/workspace.tsx` | 81 |
| `setGridDesignParams` | Function | `packages/features/src/filling/grid-designer/sidebar.tsx` | 118 |
| `params` | Function | `packages/features/src/filling/grid-designer/sidebar.tsx` | 121 |
| `update` | Function | `packages/features/src/filling/grid-designer/sidebar.tsx` | 126 |
| `updateRowCount` | Function | `packages/features/src/filling/grid-designer/sidebar.tsx` | 134 |
| `updateRowDefinition` | Function | `packages/features/src/filling/grid-designer/sidebar.tsx` | 150 |
| `applyTemplatePreset` | Function | `packages/features/src/filling/grid-designer/sidebar.tsx` | 159 |
| `generateGridLayers` | Function | `packages/features/src/filling/grid-designer/generator.ts` | 309 |
| `generateId` | Function | `packages/features/src/filling/types.ts` | 267 |
| `handleCreate` | Function | `packages/features/src/filling/template-method-dialog.tsx` | 111 |
| `GridDesignCanvasLayer` | Function | `packages/features/src/filling/grid-designer/canvas-layer.tsx` | 13 |
| `GridDesignWorkspace` | Function | `packages/features/src/filling/grid-designer/workspace.tsx` | 34 |
| `setGridDesignParams` | Function | `packages/features/src/filling/grid-designer/workspace.tsx` | 42 |
| `setGridLayerCount` | Function | `packages/features/src/filling/grid-designer/workspace.tsx` | 43 |
| `updateTemplate` | Function | `packages/features/src/filling/grid-designer/workspace.tsx` | 44 |
| `buildUpdatedTemplate` | Function | `packages/features/src/filling/grid-designer/workspace.tsx` | 177 |
| `handleSaveToDestination` | Function | `packages/features/src/filling/grid-designer/workspace.tsx` | 186 |
| `timeout` | Function | `packages/features/src/filling/grid-designer/workspace.tsx` | 209 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `FillingWorkflowSidebar → NormalizeGridDesignParams` | cross_community | 4 |
| `FillingWorkflowSidebar → SetGridDesignParams` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Ui | 3 calls |
| Splicing | 2 calls |

## How to Explore

1. `gitnexus_context({name: "parseGridDesign"})` — see callers and callees
2. `gitnexus_query({query: "grid-designer"})` — find related execution flows
3. Read key files listed above for implementation details
