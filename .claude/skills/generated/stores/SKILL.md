---
name: stores
description: "Skill for the Stores area of imify. 247 symbols across 25 files."
---

# Stores

247 symbols | 25 files | Cohesion: 82%

## When to Use

- Working with code in `packages/`
- Understanding how normalizeTargetCodecOptions, clampAvifSpeed, normalizeDitheringLevel work
- Modifying stores-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/stores/src/stores/batch-store.ts` | cloneSetupState, createDefaultPresetBootstrapState, isSetupConfigEqual, nextPresets, migrateSchemaToV2 (+75) |
| `packages/stores/src/stores/pattern-store.ts` | clamp, clampPositiveDimension, normalizeDistributionSettings, normalizeBoundarySettings, normalizeAssetResizeSettings (+42) |
| `packages/core/src/codec-options.ts` | clampInteger, normalizeDitheringLevel, normalizeBmpColorDepth, normalizeIcoSizes, normalizeWebpNearLossless (+27) |
| `packages/stores/src/stores/splitter-store.ts` | clampFloat, normalizeColorRules, normalized, normalizeCustomGuides, normalizeSplitSettings (+14) |
| `packages/stores/src/stores/watermark-store.ts` | createDefaultContextWatermarks, buildContextSavedIds, collectReferencedLogoIds, cleanupLogoIfUnused, setContextWatermark (+7) |
| `packages/stores/src/stores/pattern-preset-store.ts` | clonePatternCanvas, clonePatternSettings, clonePatternPresetConfig, createDefaultPatternConfig, normalizePresetName (+5) |
| `packages/stores/src/stores/splitter-preset-store.ts` | cloneSplitSettings, cloneExportSettings, cloneSplitterPresetConfig, createDefaultSplitterPresetConfig, normalizePresetName (+4) |
| `packages/core/src/jxl-options.ts` | normalizeJxlEpf, normalizeJxlEffort, normalizeJxlCodecOptions, normalizeJxlCodecOptionsFromExportSource, buildNormalizedJxlExportSource (+2) |
| `packages/features/src/splitter/splitter-workspace-shell.tsx` | extractSplitterPresetConfig, applyPreset, syncActivePresetConfig, applyPresetConfig, timeout (+1) |
| `packages/stores/src/stores/watermark-config.ts` | cloneWatermarkConfig, toComparableWatermarkConfig, isWatermarkConfigEqual, findMatchingSavedWatermarkId, sanitizeWatermarkForStorage |

## Entry Points

Start here when exploring this area:

- **`normalizeTargetCodecOptions`** (Function) — `apps/extension/src/options/shared/target-format-state.ts:111`
- **`clampAvifSpeed`** (Function) — `packages/core/src/avif-options.ts:12`
- **`normalizeDitheringLevel`** (Function) — `packages/core/src/codec-options.ts:32`
- **`normalizeBmpColorDepth`** (Function) — `packages/core/src/codec-options.ts:40`
- **`normalizeIcoSizes`** (Function) — `packages/core/src/codec-options.ts:48`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `normalizeTargetCodecOptions` | Function | `apps/extension/src/options/shared/target-format-state.ts` | 111 |
| `clampAvifSpeed` | Function | `packages/core/src/avif-options.ts` | 12 |
| `normalizeDitheringLevel` | Function | `packages/core/src/codec-options.ts` | 32 |
| `normalizeBmpColorDepth` | Function | `packages/core/src/codec-options.ts` | 40 |
| `normalizeIcoSizes` | Function | `packages/core/src/codec-options.ts` | 48 |
| `normalizeWebpNearLossless` | Function | `packages/core/src/codec-options.ts` | 76 |
| `normalizeWebpEffort` | Function | `packages/core/src/codec-options.ts` | 80 |
| `normalizeAvifQualityAlpha` | Function | `packages/core/src/codec-options.ts` | 84 |
| `normalizeAvifQualityAlphaRequired` | Function | `packages/core/src/codec-options.ts` | 92 |
| `normalizeAvifSpeed` | Function | `packages/core/src/codec-options.ts` | 96 |
| `normalizeAvifSubsampleFromUnknown` | Function | `packages/core/src/codec-options.ts` | 100 |
| `normalizeAvifTuneFromUnknown` | Function | `packages/core/src/codec-options.ts` | 129 |
| `normalizeAvifSubsampleLabel` | Function | `packages/core/src/codec-options.ts` | 137 |
| `normalizePngDitheringLevel` | Function | `packages/core/src/codec-options.ts` | 142 |
| `normalizeMozJpegChromaSubsampling` | Function | `packages/core/src/codec-options.ts` | 146 |
| `normalizeWebpCodecOptions` | Function | `packages/core/src/codec-options.ts` | 185 |
| `normalizeAvifCodecOptions` | Function | `packages/core/src/codec-options.ts` | 214 |
| `normalizePngCodecOptions` | Function | `packages/core/src/codec-options.ts` | 245 |
| `normalizeBmpCodecOptions` | Function | `packages/core/src/codec-options.ts` | 275 |
| `normalizeIcoCodecOptions` | Function | `packages/core/src/codec-options.ts` | 305 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `BatchSetupSidebarPanel → ClampInteger` | cross_community | 6 |
| `SubmitCreate → ClampInteger` | cross_community | 6 |
| `OnRehydrateStorage → ClampInteger` | intra_community | 5 |
| `OnRehydrateStorage → ClampAvifSpeed` | intra_community | 5 |
| `CustomFormatForm → ClampInteger` | cross_community | 5 |
| `WithBatchResize → ClampInteger` | cross_community | 5 |
| `GlobalFormatTargetQuality → ClampInteger` | cross_community | 5 |
| `BatchSetupSidebarPanel → NormalizeJxlEffort` | cross_community | 5 |
| `BatchSetupSidebarPanel → NormalizeJxlEpf` | cross_community | 5 |
| `DeletePreset → NormalizeBmpColorDepth` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Processor | 1 calls |

## How to Explore

1. `gitnexus_context({name: "normalizeTargetCodecOptions"})` — see callers and callees
2. `gitnexus_query({query: "stores"})` — find related execution flows
3. Read key files listed above for implementation details
