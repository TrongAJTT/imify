---
name: background-removal
description: "Skill for the Background-removal area of imify. 36 symbols across 23 files."
---

# Background-removal

36 symbols | 23 files | Cohesion: 67%

## When to Use

- Working with code in `packages/`
- Understanding how ContextMenuInfoPanel, ModelVariantDialog, handleModelSelect work
- Modifying background-removal-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/features/src/background-removal/page.tsx` | SharedBackgroundRemoverPage, processOutput, hexToRgb, onSuccess, setHasImage (+3) |
| `packages/features/src/background-removal/use-background-removal.ts` | useBackgroundRemoval, terminateWorker, handleMessage |
| `packages/features/src/background-removal/model-variant-dialog.tsx` | ModelVariantDialog, handleModelSelect |
| `packages/features/src/shared/preset-info-showcase-panel.tsx` | PresetInfoShowcasePanel, renderFormattedText |
| `packages/features/src/background-removal/workspace.tsx` | BackgroundRemoverWorkspace, checkModel |
| `packages/features/src/background-removal/background-removal.worker.ts` | detectBestDevice, getInstance |
| `apps/extension/src/options/components/context-menu/context-menu-info-panel.tsx` | ContextMenuInfoPanel |
| `apps/extension/src/options/index.tsx` | TabInfoPanel |
| `packages/features/src/background-removal/remover-preset-info-panel.tsx` | BackgroundRemoverPresetInfoPanel |
| `packages/features/src/background-removal/sidebar-shell.tsx` | BackgroundRemoverSidebarShell |

## Entry Points

Start here when exploring this area:

- **`ContextMenuInfoPanel`** (Function) — `apps/extension/src/options/components/context-menu/context-menu-info-panel.tsx:4`
- **`ModelVariantDialog`** (Function) — `packages/features/src/background-removal/model-variant-dialog.tsx:17`
- **`handleModelSelect`** (Function) — `packages/features/src/background-removal/model-variant-dialog.tsx:28`
- **`BackgroundRemoverPresetInfoPanel`** (Function) — `packages/features/src/background-removal/remover-preset-info-panel.tsx:56`
- **`BackgroundRemoverSidebarShell`** (Function) — `packages/features/src/background-removal/sidebar-shell.tsx:11`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `ContextMenuInfoPanel` | Function | `apps/extension/src/options/components/context-menu/context-menu-info-panel.tsx` | 4 |
| `ModelVariantDialog` | Function | `packages/features/src/background-removal/model-variant-dialog.tsx` | 17 |
| `handleModelSelect` | Function | `packages/features/src/background-removal/model-variant-dialog.tsx` | 28 |
| `BackgroundRemoverPresetInfoPanel` | Function | `packages/features/src/background-removal/remover-preset-info-panel.tsx` | 56 |
| `BackgroundRemoverSidebarShell` | Function | `packages/features/src/background-removal/sidebar-shell.tsx` | 11 |
| `BackgroundRemoverSidebar` | Function | `packages/features/src/background-removal/sidebar.tsx` | 50 |
| `PresetInfoShowcasePanel` | Function | `packages/features/src/shared/preset-info-showcase-panel.tsx` | 32 |
| `renderFormattedText` | Function | `packages/features/src/shared/preset-info-showcase-panel.tsx` | 136 |
| `UpscalerPresetInfoPanel` | Function | `packages/features/src/upscaler/upscaler-preset-info-panel.tsx` | 48 |
| `useBackgroundRemoval` | Function | `packages/features/src/background-removal/use-background-removal.ts` | 16 |
| `terminateWorker` | Function | `packages/features/src/background-removal/use-background-removal.ts` | 31 |
| `handleMessage` | Function | `packages/features/src/background-removal/use-background-removal.ts` | 38 |
| `SharedBackgroundRemoverPage` | Function | `packages/features/src/background-removal/page.tsx` | 28 |
| `processOutput` | Function | `packages/features/src/background-removal/page.tsx` | 46 |
| `hexToRgb` | Function | `packages/features/src/background-removal/page.tsx` | 90 |
| `onSuccess` | Function | `packages/features/src/background-removal/page.tsx` | 136 |
| `handleFiles` | Function | `packages/features/src/background-removal/drop-zone.tsx` | 10 |
| `handleFiles` | Function | `packages/features/src/inspector/inspector-drop-zone.tsx` | 10 |
| `isCommonImageFile` | Function | `packages/features/src/shared/image-file-utils.ts` | 22 |
| `imageFiles` | Function | `packages/features/src/shared/use-clipboard-image-intake.ts` | 33 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `UpscalerWorkspace → NormalizeResizeResamplingAlgorithm` | cross_community | 6 |
| `UpscalerWorkspace → NormalizePositiveInteger` | cross_community | 6 |
| `UpscalerWorkspace → ResolveEffectiveTargetFormat` | cross_community | 5 |
| `UpscalerWorkspace → SupportsTargetFormatQuality` | cross_community | 5 |
| `UpscalerWorkspace → ToPdfBlob` | cross_community | 5 |
| `UpscalerWorkspace → NormalizeIcoSizes` | cross_community | 5 |
| `UpscalerWorkspace → DecodeImageBitmapForEncoding` | cross_community | 5 |
| `UpscalerWorkspace → BuildIcoFromPngBlobs` | cross_community | 5 |
| `UpscalerWorkspace → ShouldUseEngineWasmWorkers` | cross_community | 5 |
| `UpscalerWorkspace → IsConversionWorkerSupported` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Ui | 5 calls |
| Splicing | 3 calls |
| Upscaler | 2 calls |
| Converter | 2 calls |
| Diffchecker | 2 calls |
| Workspace-chrome | 1 calls |
| Processor | 1 calls |

## How to Explore

1. `gitnexus_context({name: "ContextMenuInfoPanel"})` — see callers and callees
2. `gitnexus_query({query: "background-removal"})` — find related execution flows
3. Read key files listed above for implementation details
