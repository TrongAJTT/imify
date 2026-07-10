---
name: splitter
description: "Skill for the Splitter area of imify. 110 symbols across 21 files."
---

# Splitter

110 symbols | 21 files | Cohesion: 82%

## When to Use

- Working with code in `packages/`
- Understanding how buildSplitterSplitPlan, useWideSidebarGridEnabled, update work
- Modifying splitter-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/features/src/splitter/split-engine.ts` | clampInt, parsePattern, normalizeCuts, buildCountCuts, buildUniformStepCuts (+22) |
| `packages/features/src/splitter/splitter-tab.tsx` | pushExportToast, handleExport, onProgress, handleExportAction, createThumbnail (+10) |
| `apps/web/src/features/splitter/splitter-pages.tsx` | useSplitterPresetHydrated, unsubStart, unsubFinish, SplitterLandingPage, setHeaderSection (+9) |
| `packages/features/src/splitter/splitter-pattern-sequence-accordion.tsx` | parsePatternEntries, SortablePatternCard, SplitterPatternSequenceAccordion, reorderAxis, renderAxisSection (+5) |
| `packages/features/src/splitter/split-export.ts` | resolveTargetFormat, convertSplitterSegments, createZipBlob, createCanvas, toBlob (+3) |
| `packages/features/src/splitter/splitter-custom-guides-accordion.tsx` | SortableGuideCard, SplitterCustomGuidesAccordion, setGuides, handleAddGuide, handleUpdateGuide (+2) |
| `packages/features/src/splitter/splitter-preset-select-view.tsx` | SplitterPresetCard, SplitterPresetSelectView, openEditDialog, confirmDeletePreset |
| `apps/web/src/hooks/use-wide-sidebar-grid.ts` | readWideSidebarGridEnabled, useWideSidebarGridEnabled, update |
| `packages/features/src/pattern/pattern-preset-select-view.tsx` | PatternPresetSelectView, openEditDialog, confirmDeletePreset |
| `packages/features/src/processor/processor-preset-select-view.tsx` | ProcessorPresetSelectView, openEditDialog, confirmDeletePreset |

## Entry Points

Start here when exploring this area:

- **`buildSplitterSplitPlan`** (Function) — `packages/features/src/splitter/split-engine.ts:852`
- **`useWideSidebarGridEnabled`** (Function) — `apps/web/src/hooks/use-wide-sidebar-grid.ts:24`
- **`update`** (Function) — `apps/web/src/hooks/use-wide-sidebar-grid.ts:29`
- **`SplitterPage`** (Function) — `apps/web/src/app/splitter/page.tsx:6`
- **`SplitterLandingPage`** (Function) — `apps/web/src/features/splitter/splitter-pages.tsx:34`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `buildSplitterSplitPlan` | Function | `packages/features/src/splitter/split-engine.ts` | 852 |
| `useWideSidebarGridEnabled` | Function | `apps/web/src/hooks/use-wide-sidebar-grid.ts` | 24 |
| `update` | Function | `apps/web/src/hooks/use-wide-sidebar-grid.ts` | 29 |
| `SplitterPage` | Function | `apps/web/src/app/splitter/page.tsx` | 6 |
| `SplitterLandingPage` | Function | `apps/web/src/features/splitter/splitter-pages.tsx` | 34 |
| `setHeaderSection` | Function | `apps/web/src/features/splitter/splitter-pages.tsx` | 37 |
| `setHeaderActions` | Function | `apps/web/src/features/splitter/splitter-pages.tsx` | 38 |
| `setHeaderBreadcrumb` | Function | `apps/web/src/features/splitter/splitter-pages.tsx` | 39 |
| `resetHeader` | Function | `apps/web/src/features/splitter/splitter-pages.tsx` | 40 |
| `ensureDefaultPreset` | Function | `apps/web/src/features/splitter/splitter-pages.tsx` | 43 |
| `applyPreset` | Function | `apps/web/src/features/splitter/splitter-pages.tsx` | 44 |
| `saveCurrentPreset` | Function | `apps/web/src/features/splitter/splitter-pages.tsx` | 45 |
| `setPresetViewMode` | Function | `apps/web/src/features/splitter/splitter-pages.tsx` | 48 |
| `applyPresetConfig` | Function | `apps/web/src/features/splitter/splitter-pages.tsx` | 51 |
| `SplitterWorkPage` | Function | `apps/web/src/features/splitter/splitter-pages.tsx` | 100 |
| `SplitterPresetInfoPanel` | Function | `packages/features/src/splitter/splitter-preset-info-panel.tsx` | 85 |
| `SplitterSidebarShell` | Function | `packages/features/src/splitter/splitter-sidebar-shell.tsx` | 10 |
| `PatternPresetSelectView` | Function | `packages/features/src/pattern/pattern-preset-select-view.tsx` | 140 |
| `openEditDialog` | Function | `packages/features/src/pattern/pattern-preset-select-view.tsx` | 159 |
| `confirmDeletePreset` | Function | `packages/features/src/pattern/pattern-preset-select-view.tsx` | 176 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `SidebarItems → SerializePattern` | cross_community | 6 |
| `BatchProcessorWorkPage → ReadWideSidebarGridEnabled` | cross_community | 5 |
| `FillingEditPage → ReadWideSidebarGridEnabled` | cross_community | 5 |
| `FillingFillPage → ReadWideSidebarGridEnabled` | cross_community | 5 |
| `FillingGridDesignPage → ReadWideSidebarGridEnabled` | cross_community | 5 |
| `FillingSymmetricGeneratePage → ReadWideSidebarGridEnabled` | cross_community | 5 |
| `PatternWorkPage → ReadWideSidebarGridEnabled` | cross_community | 5 |
| `SingleProcessorWorkPage → ReadWideSidebarGridEnabled` | cross_community | 5 |
| `SplicingWorkPage → ReadWideSidebarGridEnabled` | cross_community | 5 |
| `SplitterWorkPage → ReadWideSidebarGridEnabled` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Processor | 8 calls |
| Ui | 4 calls |
| Stores | 3 calls |
| Splicing | 2 calls |
| Hooks | 1 calls |
| Background-removal | 1 calls |
| Upscaler | 1 calls |
| Converter | 1 calls |

## How to Explore

1. `gitnexus_context({name: "buildSplitterSplitPlan"})` — see callers and callees
2. `gitnexus_query({query: "splitter"})` — find related execution flows
3. Read key files listed above for implementation details
