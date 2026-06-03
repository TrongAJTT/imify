---
name: hooks
description: "Skill for the Hooks area of imify. 85 symbols across 27 files."
---

# Hooks

85 symbols | 27 files | Cohesion: 86%

## When to Use

- Working with code in `packages/`
- Understanding how onPaste, onPaste, parseHttpUrlsFromText work
- Modifying hooks-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/features/src/processor/batch/hooks/use-batch-execution.ts` | startBatchExecution, pushBatchProgress, runWorkerSlot, runBatch, confirmOomWarning (+7) |
| `packages/features/src/processor/batch/hooks/use-batch-export-actions.ts` | getBatchZipTimestamp, pushExportToast, getPackagerWorker, getSuccessfulOutputs, runPackagerExport (+6) |
| `apps/extension/src/options/hooks/use-delayed-hover-open.ts` | clearTimer, scheduleOpen, close, onMouseEnter, onMouseLeave (+3) |
| `packages/core/src/hooks/use-toast.ts` | show, colorCopied, copyFailed, success, error (+1) |
| `apps/extension/src/options/hooks/use-context-menu-state-actions.ts` | updateState, commitGlobalFormats, commitCustomFormats, commitContextMenuSettings |
| `apps/extension/src/options/hooks/use-clipboard-paste.ts` | isEditableTarget, extractImageFiles, onPaste |
| `apps/web/src/hooks/use-clipboard-paste.ts` | isEditableTarget, extractImageFiles, onPaste |
| `packages/engine/src/converter/remote-image-import.ts` | toErrorMessage, parseHttpUrlsFromText, fetchRemoteImagesFromUrls |
| `packages/features/src/shared/use-clipboard-paste.ts` | isEditableTarget, extractImageFiles, onPaste |
| `apps/extension/src/options/shared/use-imify-dark-mode.ts` | useImifyDarkMode, storageListener, toggleDarkMode |

## Entry Points

Start here when exploring this area:

- **`onPaste`** (Function) — `apps/extension/src/options/hooks/use-clipboard-paste.ts:83`
- **`onPaste`** (Function) — `apps/web/src/hooks/use-clipboard-paste.ts:77`
- **`parseHttpUrlsFromText`** (Function) — `packages/engine/src/converter/remote-image-import.ts:92`
- **`fetchRemoteImagesFromUrls`** (Function) — `packages/engine/src/converter/remote-image-import.ts:143`
- **`parsedUrls`** (Function) — `apps/extension/src/options/components/image-url-import-control.tsx:39`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `PackagerWorkerClient` | Class | `packages/features/src/processor/batch/workers/packager-worker-client.ts` | 41 |
| `onPaste` | Function | `apps/extension/src/options/hooks/use-clipboard-paste.ts` | 83 |
| `onPaste` | Function | `apps/web/src/hooks/use-clipboard-paste.ts` | 77 |
| `parseHttpUrlsFromText` | Function | `packages/engine/src/converter/remote-image-import.ts` | 92 |
| `fetchRemoteImagesFromUrls` | Function | `packages/engine/src/converter/remote-image-import.ts` | 143 |
| `parsedUrls` | Function | `apps/extension/src/options/components/image-url-import-control.tsx` | 39 |
| `parsedUrls` | Function | `packages/features/src/processor/image-url-import-control.tsx` | 23 |
| `onPaste` | Function | `packages/features/src/shared/use-clipboard-paste.ts` | 66 |
| `isMemoryPressureError` | Function | `packages/core/src/error-utils.ts` | 0 |
| `toUserFacingConversionError` | Function | `packages/core/src/error-utils.ts` | 21 |
| `pushExportToast` | Function | `packages/features/src/processor/batch/hooks/use-batch-export-actions.ts` | 19 |
| `getPackagerWorker` | Function | `packages/features/src/processor/batch/hooks/use-batch-export-actions.ts` | 27 |
| `getSuccessfulOutputs` | Function | `packages/features/src/processor/batch/hooks/use-batch-export-actions.ts` | 28 |
| `runPackagerExport` | Function | `packages/features/src/processor/batch/hooks/use-batch-export-actions.ts` | 41 |
| `onProgress` | Function | `packages/features/src/processor/batch/hooks/use-batch-export-actions.ts` | 43 |
| `downloadAsZip` | Function | `packages/features/src/processor/batch/hooks/use-batch-export-actions.ts` | 49 |
| `mergeIntoPdf` | Function | `packages/features/src/processor/batch/hooks/use-batch-export-actions.ts` | 60 |
| `downloadIndividualPdfs` | Function | `packages/features/src/processor/batch/hooks/use-batch-export-actions.ts` | 71 |
| `startBatchExecution` | Function | `packages/features/src/processor/batch/hooks/use-batch-execution.ts` | 99 |
| `pushBatchProgress` | Function | `packages/features/src/processor/batch/hooks/use-batch-execution.ts` | 110 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `OnPaste → ExtensionFromMimeType` | cross_community | 5 |
| `OnPaste → ExtractFilenameFromContentDisposition` | cross_community | 5 |
| `OnPaste → ToFilenameSafePart` | cross_community | 5 |
| `OnPaste → ExtensionFromMimeType` | cross_community | 5 |
| `OnPaste → ExtractFilenameFromContentDisposition` | cross_community | 5 |
| `OnPaste → ToFilenameSafePart` | cross_community | 5 |
| `OnPaste → ExtensionFromMimeType` | cross_community | 5 |
| `OnPaste → ExtractFilenameFromContentDisposition` | cross_community | 5 |
| `OnPaste → ToFilenameSafePart` | cross_community | 5 |
| `OnFocus → ClearTimer` | intra_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Converter | 4 calls |
| Batch | 4 calls |
| Processor | 1 calls |

## How to Explore

1. `gitnexus_context({name: "onPaste"})` — see callers and callees
2. `gitnexus_query({query: "hooks"})` — find related execution flows
3. Read key files listed above for implementation details
