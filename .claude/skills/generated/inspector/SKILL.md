---
name: inspector
description: "Skill for the Inspector area of imify. 131 symbols across 28 files."
---

# Inspector

131 symbols | 28 files | Cohesion: 80%

## When to Use

- Working with code in `packages/`
- Understanding how detectFormat, computeDimensions, gcd work
- Modifying inspector-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/features/src/inspector/exif-parser.ts` | formatExifValue, classifyTag, convertDmsToDecimal, formatDms, parseGpsFromEntries (+9) |
| `packages/features/src/inspector/color-inspector-card.tsx` | formatColor, levelBadge, PaletteColorItem, ColorInspectorCard, setColorFormat (+8) |
| `packages/features/src/inspector/color-utils.ts` | hslDistance, getColorName, buildTailwindConfig, buildScssVariables, linearize (+7) |
| `packages/features/src/inspector/visual-analysis.ts` | toLuminance, computeHistogramFromBitmap, clampColor, applyColorBlindMatrix, transformPixelForPreview (+6) |
| `apps/web/src/features/inspector/inspector-page.tsx` | useInspectorStoreHydrated, unsubStart, unsubFinish, InspectorPage, setHeaderSection (+5) |
| `packages/features/src/inspector/developer-utils.ts` | getMagicNumber, toCssDataUri, buildPictureTag, buildAspectRatioCss, buildPaletteCssVariables (+5) |
| `packages/features/src/inspector/inspector-page.tsx` | SharedInspectorPage, reanalyze, cleanup, handleLoadFile, handleClear (+3) |
| `packages/features/src/inspector/color-extractor.ts` | generateCssVariables, colorDistance, samplePixels, kMeans, extractPalette (+3) |
| `apps/extension/src/options/components/inspector/inspector-tab.tsx` | InspectorTab, setHeaderSection, setHeaderActions, setHeaderBreadcrumb, resetHeader (+1) |
| `packages/features/src/inspector/interactive-preview.tsx` | clamp, InteractivePreview, setSample, readSampleFromPointer, handlePointerMove (+1) |

## Entry Points

Start here when exploring this area:

- **`detectFormat`** (Function) — `packages/features/src/inspector/format-utils.ts:6`
- **`computeDimensions`** (Function) — `packages/features/src/inspector/format-utils.ts:34`
- **`gcd`** (Function) — `packages/features/src/inspector/format-utils.ts:35`
- **`matchAspectRatio`** (Function) — `packages/features/src/inspector/format-utils.ts:95`
- **`detectPrivacyAlerts`** (Function) — `packages/features/src/inspector/format-utils.ts:111`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `detectFormat` | Function | `packages/features/src/inspector/format-utils.ts` | 6 |
| `computeDimensions` | Function | `packages/features/src/inspector/format-utils.ts` | 34 |
| `gcd` | Function | `packages/features/src/inspector/format-utils.ts` | 35 |
| `matchAspectRatio` | Function | `packages/features/src/inspector/format-utils.ts` | 95 |
| `detectPrivacyAlerts` | Function | `packages/features/src/inspector/format-utils.ts` | 111 |
| `inspectImage` | Function | `packages/features/src/inspector/inspect-image.ts` | 7 |
| `generateThumbHash` | Function | `packages/features/src/inspector/thumbhash.ts` | 139 |
| `computeHistogramFromBitmap` | Function | `packages/features/src/inspector/visual-analysis.ts` | 91 |
| `SharedInspectorPage` | Function | `packages/features/src/inspector/inspector-page.tsx` | 28 |
| `reanalyze` | Function | `packages/features/src/inspector/inspector-page.tsx` | 93 |
| `parseExifData` | Function | `packages/features/src/inspector/exif-parser.ts` | 531 |
| `InspectorPage` | Function | `apps/web/src/app/inspector/page.tsx` | 6 |
| `InspectorPage` | Function | `apps/web/src/features/inspector/inspector-page.tsx` | 28 |
| `setHeaderSection` | Function | `apps/web/src/features/inspector/inspector-page.tsx` | 31 |
| `setHeaderActions` | Function | `apps/web/src/features/inspector/inspector-page.tsx` | 32 |
| `setHeaderBreadcrumb` | Function | `apps/web/src/features/inspector/inspector-page.tsx` | 33 |
| `resetHeader` | Function | `apps/web/src/features/inspector/inspector-page.tsx` | 34 |
| `setHasImage` | Function | `apps/web/src/features/inspector/inspector-page.tsx` | 58 |
| `BasicInfoCard` | Function | `packages/features/src/inspector/basic-info-card.tsx` | 15 |
| `setVisualAnalysisDialogOpen` | Function | `packages/features/src/inspector/basic-info-card.tsx` | 16 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `SidePanelLiteApp → FormatExifValue` | cross_community | 7 |
| `SidePanelLiteApp → ClassifyTag` | cross_community | 7 |
| `SidePanelLiteApp → Gcd` | cross_community | 5 |
| `SidePanelLiteApp → MatchAspectRatio` | cross_community | 5 |
| `SidePanelLiteApp → DetectFormat` | cross_community | 4 |
| `SidePanelLiteApp → DetectPrivacyAlerts` | cross_community | 4 |
| `InspectorPage → ReadWideSidebarGridEnabled` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Processor | 5 calls |
| Ui | 2 calls |
| Sidepanel | 1 calls |
| Background-removal | 1 calls |
| Splicing | 1 calls |
| Splitter | 1 calls |

## How to Explore

1. `gitnexus_context({name: "detectFormat"})` — see callers and callees
2. `gitnexus_query({query: "inspector"})` — find related execution flows
3. Read key files listed above for implementation details
