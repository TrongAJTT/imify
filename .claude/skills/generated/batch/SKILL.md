---
name: batch
description: "Skill for the Batch area of imify. 45 symbols across 15 files."
---

# Batch

45 symbols | 15 files | Cohesion: 78%

## When to Use

- Working with code in `packages/`
- Understanding how toTriplet, buildResizeQuickStatsFromDimensions, useBatchExportActions work
- Modifying batch-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/features/src/processor/batch/batch-processor-workspace.tsx` | BatchProcessorWorkspace, setHeavyFormatToast, setBatchIsRunning, syncResizeToSource, setResizeQuickStats (+5) |
| `apps/extension/src/options/shared/resize-state.ts` | normalizePositiveInteger, normalizePaperSize, normalizeDpi, normalizeLinearResizeValue, normalizeCustomResizeConfig (+1) |
| `packages/features/src/processor/batch/pipeline.ts` | pad2, safeSegment, baseNameFromFileName, buildSmartOutputFileName, readImageDimensions |
| `apps/extension/src/options/components/batch/pipeline.ts` | pad2, safeSegment, baseNameFromFileName, buildSmartOutputFileName |
| `packages/features/src/processor/batch/hooks/use-batch-export-actions.ts` | useBatchExportActions, clearExportToastHideTimer, clearExportToast |
| `apps/extension/src/options/components/batch/utils.ts` | publishProgressToActiveTab, notifyProgress, buildResizeOverride |
| `packages/core/src/resize-quick-stats.ts` | toTriplet, buildResizeQuickStatsFromDimensions |
| `apps/extension/src/background/index.ts` | sanitizeFileName, buildOutputFilename |
| `packages/core/src/download-utils.ts` | stripExtension, toOutputFilename |
| `packages/features/src/processor/batch/utils.ts` | publishProgressToActiveTab, notifyProgress |

## Entry Points

Start here when exploring this area:

- **`toTriplet`** (Function) — `packages/core/src/resize-quick-stats.ts:11`
- **`buildResizeQuickStatsFromDimensions`** (Function) — `packages/core/src/resize-quick-stats.ts:27`
- **`useBatchExportActions`** (Function) — `packages/features/src/processor/batch/hooks/use-batch-export-actions.ts:11`
- **`clearExportToastHideTimer`** (Function) — `packages/features/src/processor/batch/hooks/use-batch-export-actions.ts:18`
- **`clearExportToast`** (Function) — `packages/features/src/processor/batch/hooks/use-batch-export-actions.ts:30`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `toTriplet` | Function | `packages/core/src/resize-quick-stats.ts` | 11 |
| `buildResizeQuickStatsFromDimensions` | Function | `packages/core/src/resize-quick-stats.ts` | 27 |
| `useBatchExportActions` | Function | `packages/features/src/processor/batch/hooks/use-batch-export-actions.ts` | 11 |
| `clearExportToastHideTimer` | Function | `packages/features/src/processor/batch/hooks/use-batch-export-actions.ts` | 18 |
| `clearExportToast` | Function | `packages/features/src/processor/batch/hooks/use-batch-export-actions.ts` | 30 |
| `BatchActionBar` | Function | `packages/features/src/processor/batch/action-bar.tsx` | 13 |
| `BatchProcessorWorkspace` | Function | `packages/features/src/processor/batch/batch-processor-workspace.tsx` | 49 |
| `setHeavyFormatToast` | Function | `packages/features/src/processor/batch/batch-processor-workspace.tsx` | 77 |
| `setBatchIsRunning` | Function | `packages/features/src/processor/batch/batch-processor-workspace.tsx` | 78 |
| `syncResizeToSource` | Function | `packages/features/src/processor/batch/batch-processor-workspace.tsx` | 79 |
| `setResizeQuickStats` | Function | `packages/features/src/processor/batch/batch-processor-workspace.tsx` | 80 |
| `OOMWarningDialog` | Function | `packages/features/src/processor/batch/oom-warning-dialog.tsx` | 12 |
| `BatchSummaryCard` | Function | `packages/features/src/processor/batch/summary-card.tsx` | 25 |
| `BatchUploadDropzone` | Function | `packages/features/src/processor/batch/upload-dropzone.tsx` | 11 |
| `publishProgressToActiveTab` | Function | `apps/extension/src/options/components/batch/utils.ts` | 51 |
| `notifyProgress` | Function | `apps/extension/src/options/components/batch/utils.ts` | 205 |
| `toOutputFilename` | Function | `packages/core/src/download-utils.ts` | 23 |
| `publishProgressToActiveTab` | Function | `packages/features/src/processor/batch/utils.ts` | 20 |
| `notifyProgress` | Function | `packages/features/src/processor/batch/utils.ts` | 46 |
| `buildResizeOverride` | Function | `apps/extension/src/options/components/batch/utils.ts` | 84 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `ProcessItem → StripExtension` | cross_community | 4 |
| `ProcessItem → GetCanonicalExtension` | cross_community | 4 |
| `WithBatchResize → NormalizeResizeResamplingAlgorithm` | cross_community | 4 |
| `WithBatchResize → NormalizePositiveInteger` | cross_community | 4 |
| `DownloadAsZip → ClearExportToastHideTimer` | cross_community | 4 |
| `DownloadIndividualPdfs → ClearExportToastHideTimer` | cross_community | 4 |
| `HandleImageMenuClick → StripExtension` | cross_community | 4 |
| `HandleImageMenuClick → GetCanonicalExtension` | cross_community | 4 |
| `SubmitCreate → NormalizeResizeResamplingAlgorithm` | cross_community | 4 |
| `SubmitCreate → NormalizePositiveInteger` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Processor | 4 calls |
| Hooks | 4 calls |
| Splicing | 3 calls |
| Ui | 2 calls |
| Background-removal | 1 calls |

## How to Explore

1. `gitnexus_context({name: "toTriplet"})` — see callers and callees
2. `gitnexus_query({query: "batch"})` — find related execution flows
3. Read key files listed above for implementation details
