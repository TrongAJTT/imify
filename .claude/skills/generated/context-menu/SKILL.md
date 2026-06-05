---
name: context-menu
description: "Skill for the Context-menu area of imify. 32 symbols across 7 files."
---

# Context-menu

32 symbols | 7 files | Cohesion: 83%

## When to Use

- Working with code in `apps/`
- Understanding how cloneResize, withBatchResize, resolveEffectiveTargetFormat work
- Modifying context-menu-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/extension/src/options/components/context-menu/custom-preset-advanced-settings.tsx` | CustomPresetAdvancedSettings, updateCodecOptions, onQualityAlphaChange, onLosslessChange, onSubsampleChange (+11) |
| `apps/extension/src/options/shared/target-format-state.ts` | buildTargetFormatQualityCardConfig, buildActiveCodecOptionsForTarget, supportsTargetFormatQuality, supportsTargetFormatTinyMode, mergeCodecOptions |
| `apps/extension/src/options/components/context-menu/custom-format-form.tsx` | CustomFormatForm, updateCodecOptions, buildFormatOptionsForTargetChange |
| `apps/extension/src/options/components/context-menu/global-format-target-quality.tsx` | normalizeQuality, GlobalFormatTargetQuality, updateCodecOptions |
| `apps/extension/src/options/components/batch/utils.ts` | cloneResize, withBatchResize |
| `apps/extension/src/options/components/context-menu/custom-formats-tab.tsx` | closeCreateDialog, onKeyDown |
| `apps/extension/src/options/shared/target-format-options.ts` | resolveEffectiveTargetFormat |

## Entry Points

Start here when exploring this area:

- **`cloneResize`** (Function) — `apps/extension/src/options/components/batch/utils.ts:68`
- **`withBatchResize`** (Function) — `apps/extension/src/options/components/batch/utils.ts:114`
- **`resolveEffectiveTargetFormat`** (Function) — `apps/extension/src/options/shared/target-format-options.ts:37`
- **`buildTargetFormatQualityCardConfig`** (Function) — `apps/extension/src/options/shared/target-format-state.ts:163`
- **`buildActiveCodecOptionsForTarget`** (Function) — `apps/extension/src/options/shared/target-format-state.ts:189`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `cloneResize` | Function | `apps/extension/src/options/components/batch/utils.ts` | 68 |
| `withBatchResize` | Function | `apps/extension/src/options/components/batch/utils.ts` | 114 |
| `resolveEffectiveTargetFormat` | Function | `apps/extension/src/options/shared/target-format-options.ts` | 37 |
| `buildTargetFormatQualityCardConfig` | Function | `apps/extension/src/options/shared/target-format-state.ts` | 163 |
| `buildActiveCodecOptionsForTarget` | Function | `apps/extension/src/options/shared/target-format-state.ts` | 189 |
| `supportsTargetFormatQuality` | Function | `apps/extension/src/options/shared/target-format-state.ts` | 236 |
| `supportsTargetFormatTinyMode` | Function | `apps/extension/src/options/shared/target-format-state.ts` | 240 |
| `mergeCodecOptions` | Function | `apps/extension/src/options/shared/target-format-state.ts` | 244 |
| `CustomFormatForm` | Function | `apps/extension/src/options/components/context-menu/custom-format-form.tsx` | 20 |
| `updateCodecOptions` | Function | `apps/extension/src/options/components/context-menu/custom-format-form.tsx` | 45 |
| `buildFormatOptionsForTargetChange` | Function | `apps/extension/src/options/components/context-menu/custom-format-form.tsx` | 57 |
| `CustomPresetAdvancedSettings` | Function | `apps/extension/src/options/components/context-menu/custom-preset-advanced-settings.tsx` | 18 |
| `GlobalFormatTargetQuality` | Function | `apps/extension/src/options/components/context-menu/global-format-target-quality.tsx` | 30 |
| `updateCodecOptions` | Function | `apps/extension/src/options/components/context-menu/global-format-target-quality.tsx` | 50 |
| `updateCodecOptions` | Function | `apps/extension/src/options/components/context-menu/custom-preset-advanced-settings.tsx` | 32 |
| `onQualityAlphaChange` | Function | `apps/extension/src/options/components/context-menu/custom-preset-advanced-settings.tsx` | 54 |
| `onLosslessChange` | Function | `apps/extension/src/options/components/context-menu/custom-preset-advanced-settings.tsx` | 59 |
| `onSubsampleChange` | Function | `apps/extension/src/options/components/context-menu/custom-preset-advanced-settings.tsx` | 64 |
| `onTuneChange` | Function | `apps/extension/src/options/components/context-menu/custom-preset-advanced-settings.tsx` | 69 |
| `onHighAlphaQualityChange` | Function | `apps/extension/src/options/components/context-menu/custom-preset-advanced-settings.tsx` | 74 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CustomFormatForm → ClampInteger` | cross_community | 5 |
| `WithBatchResize → ClampInteger` | cross_community | 5 |
| `GlobalFormatTargetQuality → ClampInteger` | cross_community | 5 |
| `CustomFormatForm → NormalizeJxlEffort` | cross_community | 4 |
| `CustomFormatForm → NormalizeJxlEpf` | cross_community | 4 |
| `WithBatchResize → NormalizeResizeResamplingAlgorithm` | cross_community | 4 |
| `WithBatchResize → NormalizePositiveInteger` | cross_community | 4 |
| `WithBatchResize → NormalizeJxlEffort` | cross_community | 4 |
| `WithBatchResize → NormalizeJxlEpf` | cross_community | 4 |
| `GlobalFormatTargetQuality → NormalizeJxlEffort` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Ui | 9 calls |
| Stores | 5 calls |
| Processor | 1 calls |
| Batch | 1 calls |

## How to Explore

1. `gitnexus_context({name: "cloneResize"})` — see callers and callees
2. `gitnexus_query({query: "context-menu"})` — find related execution flows
3. Read key files listed above for implementation details
