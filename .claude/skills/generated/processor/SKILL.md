---
name: processor
description: "Skill for the Processor area of imify. 230 symbols across 64 files."
---

# Processor

230 symbols | 64 files | Cohesion: 77%

## When to Use

- Working with code in `packages/`
- Understanding how BatchProcessorPage, SingleProcessorPage, useWorkspaceSidebar work
- Modifying processor-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/features/src/processor/watermark-open-saved-dialog.tsx` | clamp, parseHexColor, parseRgbColor, parseLinearGradientColor, parseColorToRgb (+17) |
| `apps/web/src/features/processor/processor-pages.tsx` | getRoutePrefix, getContextLabel, getContextToolId, ProcessorLandingPage, setSetupContext (+14) |
| `packages/features/src/processor/single-processor-workspace.tsx` | toOutputFilenameWithExtension, toAspectRatioLabel, gcd, toImageMeta, timer (+10) |
| `packages/features/src/processor/setup-sidebar-panel.tsx` | BatchSetupSidebarPanel, onTargetFormatChange, onIcoGenerateWebIconKitChange, onResizeModeChange, onResizeValueChange (+9) |
| `apps/extension/src/options/components/processor/processor-workspace-shell.tsx` | ProcessorWorkspaceShell, setSetupContext, saveCurrentPreset, applyPresetToCurrentContext, setPresetViewMode (+8) |
| `packages/features/src/processor/performance-preferences.ts` | clampNumber, clampInteger, normalizeHardwareProfile, detectHardwareProfile, buildConcurrencyOptions (+8) |
| `packages/features/src/splicing/splicing-workspace-shell.tsx` | extractSplicingPresetConfig, applySplicingPresetConfig, SplicingWorkspaceShell, setPresetViewMode, ensureDefaultPreset (+7) |
| `packages/features/src/processor/watermark-dialog.tsx` | summary, savedMatchId, isDirty, renderPreview, timeout (+7) |
| `packages/features/src/splitter/splitter-workspace-shell.tsx` | SplitterWorkspaceShell, setPresetViewMode, ensureDefaultPreset, saveCurrentPreset, setHeaderSection (+3) |
| `packages/features/src/processor/watermark-config.ts` | buildWatermarkSummary, cloneWatermarkConfig, toComparableWatermarkConfig, sanitizeWatermarkForStorage, isWatermarkConfigEqual (+1) |

## Entry Points

Start here when exploring this area:

- **`BatchProcessorPage`** (Function) — `apps/web/src/app/batch-processor/page.tsx:6`
- **`SingleProcessorPage`** (Function) — `apps/web/src/app/single-processor/page.tsx:6`
- **`useWorkspaceSidebar`** (Function) — `apps/web/src/components/layout/workspace-layout.tsx:36`
- **`FillingDisabledState`** (Function) — `apps/web/src/features/filling/filling-disabled-state.tsx:8`
- **`ProcessorLandingPage`** (Function) — `apps/web/src/features/processor/processor-pages.tsx:42`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `BatchProcessorPage` | Function | `apps/web/src/app/batch-processor/page.tsx` | 6 |
| `SingleProcessorPage` | Function | `apps/web/src/app/single-processor/page.tsx` | 6 |
| `useWorkspaceSidebar` | Function | `apps/web/src/components/layout/workspace-layout.tsx` | 36 |
| `FillingDisabledState` | Function | `apps/web/src/features/filling/filling-disabled-state.tsx` | 8 |
| `ProcessorLandingPage` | Function | `apps/web/src/features/processor/processor-pages.tsx` | 42 |
| `setSetupContext` | Function | `apps/web/src/features/processor/processor-pages.tsx` | 45 |
| `setPresetViewMode` | Function | `apps/web/src/features/processor/processor-pages.tsx` | 46 |
| `saveCurrentPreset` | Function | `apps/web/src/features/processor/processor-pages.tsx` | 48 |
| `ensureDefaultPresetForContext` | Function | `apps/web/src/features/processor/processor-pages.tsx` | 51 |
| `setHeaderSection` | Function | `apps/web/src/features/processor/processor-pages.tsx` | 63 |
| `setHeaderActions` | Function | `apps/web/src/features/processor/processor-pages.tsx` | 64 |
| `setHeaderBreadcrumb` | Function | `apps/web/src/features/processor/processor-pages.tsx` | 65 |
| `setHeaderOnBack` | Function | `apps/web/src/features/processor/processor-pages.tsx` | 66 |
| `resetHeader` | Function | `apps/web/src/features/processor/processor-pages.tsx` | 67 |
| `ProcessorWorkPage` | Function | `apps/web/src/features/processor/processor-pages.tsx` | 122 |
| `applyPresetToCurrentContext` | Function | `apps/web/src/features/processor/processor-pages.tsx` | 156 |
| `useWorkspaceHeaderStore` | Function | `packages/stores/src/stores/workspace-header-store.ts` | 15 |
| `FeatureBreadcrumb` | Function | `packages/features/src/shared/feature-breadcrumb.tsx` | 18 |
| `SplicingWorkspaceShell` | Function | `packages/features/src/splicing/splicing-workspace-shell.tsx` | 132 |
| `setPresetViewMode` | Function | `packages/features/src/splicing/splicing-workspace-shell.tsx` | 138 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `SplicingLandingPage → ClampNumber` | cross_community | 8 |
| `ProcessorWorkPage → ClampNumber` | cross_community | 8 |
| `SplicingWorkPage → ClampNumber` | cross_community | 8 |
| `BatchSetupSidebarPanel → ClampInteger` | cross_community | 6 |
| `UpscalerWorkspace → NormalizeResizeResamplingAlgorithm` | cross_community | 6 |
| `UpscalerWorkspace → NormalizePositiveInteger` | cross_community | 6 |
| `WorkspaceSettingsDialog → ClampNumber` | cross_community | 5 |
| `DevToolsDialog → ClampNumber` | cross_community | 5 |
| `BatchSetupSidebarPanel → NormalizeJxlEffort` | cross_community | 5 |
| `BatchSetupSidebarPanel → NormalizeJxlEpf` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Ui | 6 calls |
| Stores | 5 calls |
| Splitter | 4 calls |
| Splicing | 4 calls |
| Background-removal | 4 calls |
| Converter | 4 calls |
| Hooks | 2 calls |
| Upscaler | 1 calls |

## How to Explore

1. `gitnexus_context({name: "BatchProcessorPage"})` — see callers and callees
2. `gitnexus_query({query: "processor"})` — find related execution flows
3. Read key files listed above for implementation details
