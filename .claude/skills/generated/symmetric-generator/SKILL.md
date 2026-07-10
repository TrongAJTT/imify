---
name: symmetric-generator
description: "Skill for the Symmetric-generator area of imify. 36 symbols across 5 files."
---

# Symmetric-generator

36 symbols | 5 files | Cohesion: 73%

## When to Use

- Working with code in `packages/`
- Understanding how SymmetricWorkspace, updateTemplate, setSymmetricParams work
- Modifying symmetric-generator-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/features/src/filling/symmetric-generator/workspace.tsx` | toWorldRect, scaleLength, SymmetricWorkspace, updateTemplate, setSymmetricParams (+12) |
| `packages/features/src/filling/symmetric-generator/sidebar.tsx` | getAllowedAxisAppearanceOrders, getAllowedShapeAppearanceOrders, normalizeSymmetricParams, setSymmetricParams, params (+3) |
| `packages/features/src/filling/symmetric-generator/generator.ts` | buildSymmetricShapePolygon, computeSymmetricQuadrilateralPoints, rotatePointOrder, resolveOrderSign, deriveSymmetricLayoutMetrics (+2) |
| `packages/features/src/filling/vector-math.ts` | getBoundingBox, pointInPolygon, polygonIntersectsRect |
| `packages/features/src/filling/edit/sidebar.tsx` | handleAddShape |

## Entry Points

Start here when exploring this area:

- **`SymmetricWorkspace`** (Function) — `packages/features/src/filling/symmetric-generator/workspace.tsx:110`
- **`updateTemplate`** (Function) — `packages/features/src/filling/symmetric-generator/workspace.tsx:125`
- **`setSymmetricParams`** (Function) — `packages/features/src/filling/symmetric-generator/workspace.tsx:126`
- **`setSymmetricLayerCount`** (Function) — `packages/features/src/filling/symmetric-generator/workspace.tsx:127`
- **`applyFirstControlRect`** (Function) — `packages/features/src/filling/symmetric-generator/workspace.tsx:377`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `SymmetricWorkspace` | Function | `packages/features/src/filling/symmetric-generator/workspace.tsx` | 110 |
| `updateTemplate` | Function | `packages/features/src/filling/symmetric-generator/workspace.tsx` | 125 |
| `setSymmetricParams` | Function | `packages/features/src/filling/symmetric-generator/workspace.tsx` | 126 |
| `setSymmetricLayerCount` | Function | `packages/features/src/filling/symmetric-generator/workspace.tsx` | 127 |
| `applyFirstControlRect` | Function | `packages/features/src/filling/symmetric-generator/workspace.tsx` | 377 |
| `applySecondControlRect` | Function | `packages/features/src/filling/symmetric-generator/workspace.tsx` | 404 |
| `applyThirdControlRect` | Function | `packages/features/src/filling/symmetric-generator/workspace.tsx` | 417 |
| `handleSaveToDestination` | Function | `packages/features/src/filling/symmetric-generator/workspace.tsx` | 439 |
| `timeout` | Function | `packages/features/src/filling/symmetric-generator/workspace.tsx` | 467 |
| `setSymmetricParams` | Function | `packages/features/src/filling/symmetric-generator/sidebar.tsx` | 65 |
| `params` | Function | `packages/features/src/filling/symmetric-generator/sidebar.tsx` | 66 |
| `update` | Function | `packages/features/src/filling/symmetric-generator/sidebar.tsx` | 71 |
| `axisAppearanceOptions` | Function | `packages/features/src/filling/symmetric-generator/sidebar.tsx` | 79 |
| `shapeAppearanceOptions` | Function | `packages/features/src/filling/symmetric-generator/sidebar.tsx` | 84 |
| `buildSymmetricShapePolygon` | Function | `packages/features/src/filling/symmetric-generator/generator.ts` | 67 |
| `getBoundingBox` | Function | `packages/features/src/filling/vector-math.ts` | 30 |
| `handleAddShape` | Function | `packages/features/src/filling/edit/sidebar.tsx` | 177 |
| `controls` | Function | `packages/features/src/filling/symmetric-generator/workspace.tsx` | 327 |
| `deriveSymmetricLayoutMetrics` | Function | `packages/features/src/filling/symmetric-generator/generator.ts` | 33 |
| `handleKeyDown` | Function | `packages/features/src/filling/symmetric-generator/workspace.tsx` | 234 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `FillingWorkflowSidebar → SetSymmetricParams` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Ui | 6 calls |
| Splicing | 2 calls |
| Grid-designer | 2 calls |
| Edit | 1 calls |
| Fill | 1 calls |
| Filling | 1 calls |

## How to Explore

1. `gitnexus_context({name: "SymmetricWorkspace"})` — see callers and callees
2. `gitnexus_query({query: "symmetric-generator"})` — find related execution flows
3. Read key files listed above for implementation details
