---
name: converter
description: "Skill for the Converter area of imify. 169 symbols across 34 files."
---

# Converter

169 symbols | 34 files | Cohesion: 76%

## When to Use

- Working with code in `packages/`
- Understanding how isConversionWorkerSupported, convertImageWithWorker, convertImage work
- Modifying converter-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/engine/src/converter/advanced-resize.ts` | resolveWasmAssetUrl, ensureResizeModuleLoaded, ensureHqxModuleLoaded, ensureMagicKernelModuleLoaded, ensureResizeWasm (+10) |
| `packages/engine/src/converter/conversion-worker-pool.ts` | isConversionWorkerSupported, convertImageWithWorker, ConversionWorkerPool, constructor, resize (+9) |
| `packages/engine/src/converter/wasm-worker-pool.ts` | constructor, resize, terminate, createSlot, onTaskFinished (+7) |
| `packages/engine/src/converter/ico-encoder.ts` | drawImageWithStepDown, createPngRenderer, toTextBytes, buildSiteWebManifest, buildBrowserConfigXml (+5) |
| `packages/engine/src/converter/bmp-encoder.ts` | writeAscii, toLuminance, resolveDitheringAlgorithm, buildMonochromeBitmapData, encodeBmp24Bit (+4) |
| `packages/engine/src/converter/webp-encoder.ts` | toBinaryFlag, clampNearLossless, clampWebpEffort, mapEffortToMethod, shouldUseWebpWasm (+4) |
| `packages/engine/src/converter/png-tiny.ts` | normalizeDitheringLevel, resolveDitheringAlgorithm, applyPaletteQuantization, toMutableRgba, toRgbaBuffer (+3) |
| `packages/engine/src/converter/runtime-adapter.ts` | shouldUseEngineWasmWorkers, resolveEngineWasmNamedModule, resolveEngineWasmUrl, resolveEngineWasmFactoryModule, unwrapEngineWasmFactoryModule (+2) |
| `packages/engine/src/converter/raster-processing-pipeline.ts` | parseLinearGradientBackground, fillContainBackground, drawSourceImageWithAdvancedResampling, drawSourceImage, extractBitmapRegion (+2) |
| `packages/engine/src/converter/raster-encode-adapters.ts` | hasPngDithering, supports, encode, createBuiltInRasterEncoderAdapters, createRasterAdapterRegistry (+1) |

## Entry Points

Start here when exploring this area:

- **`isConversionWorkerSupported`** (Function) — `packages/engine/src/converter/conversion-worker-pool.ts:248`
- **`convertImageWithWorker`** (Function) — `packages/engine/src/converter/conversion-worker-pool.ts:289`
- **`convertImage`** (Function) — `packages/engine/src/converter/index.ts:21`
- **`shouldUseEngineWasmWorkers`** (Function) — `packages/engine/src/converter/runtime-adapter.ts:70`
- **`encodePreview`** (Function) — `packages/features/src/background-removal/workspace.tsx:154`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `WasmEncodeWorkerPool` | Class | `packages/engine/src/converter/wasm-worker-pool.ts` | 56 |
| `ConversionWorkerPool` | Class | `packages/engine/src/converter/conversion-worker-pool.ts` | 55 |
| `isConversionWorkerSupported` | Function | `packages/engine/src/converter/conversion-worker-pool.ts` | 248 |
| `convertImageWithWorker` | Function | `packages/engine/src/converter/conversion-worker-pool.ts` | 289 |
| `convertImage` | Function | `packages/engine/src/converter/index.ts` | 21 |
| `shouldUseEngineWasmWorkers` | Function | `packages/engine/src/converter/runtime-adapter.ts` | 70 |
| `encodePreview` | Function | `packages/features/src/background-removal/workspace.tsx` | 154 |
| `executeDownloadBlobCreationAndSave` | Function | `packages/features/src/background-removal/workspace.tsx` | 242 |
| `handleDownload` | Function | `packages/features/src/background-removal/workspace.tsx` | 284 |
| `buildFormatConfigFromPreset` | Function | `packages/features/src/processor/preset-utils.ts` | 89 |
| `downloadWithFilename` | Function | `packages/features/src/processor/processor-utils.ts` | 74 |
| `encodePreview` | Function | `packages/features/src/upscaler/workspace.tsx` | 142 |
| `executeDownloadBlobCreationAndSave` | Function | `packages/features/src/upscaler/workspace.tsx` | 222 |
| `handleDownload` | Function | `packages/features/src/upscaler/workspace.tsx` | 246 |
| `encodePngFromImageData` | Function | `packages/engine/src/converter/png-tiny.ts` | 69 |
| `encodeTinyPngFromImageData` | Function | `packages/engine/src/converter/png-tiny.ts` | 94 |
| `encodeMozJpeg` | Function | `packages/engine/src/converter/mozjpeg-encoder.ts` | 84 |
| `optimisePngWithOxi` | Function | `packages/engine/src/converter/oxipng.ts` | 38 |
| `encodeImageDataToTiff` | Function | `packages/engine/src/converter/tiff-encoder.ts` | 41 |
| `resolveEngineWasmNamedModule` | Function | `packages/engine/src/converter/runtime-adapter.ts` | 50 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `PerformExport → FlushQueue` | cross_community | 6 |
| `UpscalerWorkspace → NormalizeResizeResamplingAlgorithm` | cross_community | 6 |
| `UpscalerWorkspace → NormalizePositiveInteger` | cross_community | 6 |
| `PerformExport → CreateEngineWasmWorker` | cross_community | 5 |
| `PerformExport → Terminate` | cross_community | 5 |
| `OnPaste → ExtensionFromMimeType` | cross_community | 5 |
| `OnPaste → ExtractFilenameFromContentDisposition` | cross_community | 5 |
| `OnPaste → ToFilenameSafePart` | cross_community | 5 |
| `OnPaste → ExtensionFromMimeType` | cross_community | 5 |
| `OnPaste → ExtractFilenameFromContentDisposition` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Filling | 6 calls |
| Stores | 5 calls |
| Processor | 4 calls |
| Ui | 2 calls |
| Splicing | 1 calls |

## How to Explore

1. `gitnexus_context({name: "isConversionWorkerSupported"})` — see callers and callees
2. `gitnexus_query({query: "converter"})` — find related execution flows
3. Read key files listed above for implementation details
