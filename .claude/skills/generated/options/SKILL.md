---
name: options
description: "Skill for the Options area of imify. 32 symbols across 11 files."
---

# Options

32 symbols | 11 files | Cohesion: 73%

## When to Use

- Working with code in `apps/`
- Understanding how useContextMenuStateActions, useKeyPress, useEscapeKey work
- Modifying options-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/extension/src/options/index.tsx` | resolveSidepanelPanel, sanitizeOptionsTab, sanitizeContextMenuSubTab, normalizeExtensionState, OptionsPage (+10) |
| `packages/features/src/workspace-chrome/layout-preferences.ts` | normalizeSidebarLevel, normalizeWorkspaceLayoutPreferences, getNavigationSidebarWidthPx, getConfigurationSidebarWidthPx, getConfigurationSidebarWidthCss |
| `apps/extension/src/options/hooks/use-key-press.ts` | useKeyPress, useEscapeKey |
| `apps/extension/src/options/shared.ts` | createCustomFormatId, normalizeCustomInput |
| `apps/extension/src/options/components/context-menu/custom-formats-tab.tsx` | createDefaultCustomPresetForm, submitCreate |
| `apps/extension/src/options/hooks/use-context-menu-state-actions.ts` | useContextMenuStateActions |
| `apps/extension/src/options/components/attribution-dialog-wrapper.tsx` | AttributionDialogWrapper |
| `apps/extension/src/options/components/batch/save-preset-dialog.tsx` | SavePresetDialog |
| `apps/extension/src/options/components/tab-button.tsx` | TabButton |
| `packages/features/src/filling/editor-context.tsx` | EditorProvider |

## Entry Points

Start here when exploring this area:

- **`useContextMenuStateActions`** (Function) — `apps/extension/src/options/hooks/use-context-menu-state-actions.ts:12`
- **`useKeyPress`** (Function) — `apps/extension/src/options/hooks/use-key-press.ts:10`
- **`useEscapeKey`** (Function) — `apps/extension/src/options/hooks/use-key-press.ts:39`
- **`AttributionDialogWrapper`** (Function) — `apps/extension/src/options/components/attribution-dialog-wrapper.tsx:8`
- **`SavePresetDialog`** (Function) — `apps/extension/src/options/components/batch/save-preset-dialog.tsx:16`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `useContextMenuStateActions` | Function | `apps/extension/src/options/hooks/use-context-menu-state-actions.ts` | 12 |
| `useKeyPress` | Function | `apps/extension/src/options/hooks/use-key-press.ts` | 10 |
| `useEscapeKey` | Function | `apps/extension/src/options/hooks/use-key-press.ts` | 39 |
| `AttributionDialogWrapper` | Function | `apps/extension/src/options/components/attribution-dialog-wrapper.tsx` | 8 |
| `SavePresetDialog` | Function | `apps/extension/src/options/components/batch/save-preset-dialog.tsx` | 16 |
| `TabButton` | Function | `apps/extension/src/options/components/tab-button.tsx` | 3 |
| `OptionsPage` | Function | `apps/extension/src/options/index.tsx` | 268 |
| `openSettingsDialog` | Function | `apps/extension/src/options/index.tsx` | 310 |
| `closeSettingsDialog` | Function | `apps/extension/src/options/index.tsx` | 311 |
| `setHeaderSection` | Function | `apps/extension/src/options/index.tsx` | 312 |
| `setHeaderActions` | Function | `apps/extension/src/options/index.tsx` | 313 |
| `setHeaderBreadcrumb` | Function | `apps/extension/src/options/index.tsx` | 314 |
| `resetHeader` | Function | `apps/extension/src/options/index.tsx` | 315 |
| `setSetupContext` | Function | `apps/extension/src/options/index.tsx` | 316 |
| `handleToolTabActivation` | Function | `apps/extension/src/options/index.tsx` | 398 |
| `EditorProvider` | Function | `packages/features/src/filling/editor-context.tsx` | 23 |
| `normalizeSidebarLevel` | Function | `packages/features/src/workspace-chrome/layout-preferences.ts` | 43 |
| `normalizeWorkspaceLayoutPreferences` | Function | `packages/features/src/workspace-chrome/layout-preferences.ts` | 49 |
| `getNavigationSidebarWidthPx` | Function | `packages/features/src/workspace-chrome/layout-preferences.ts` | 67 |
| `getConfigurationSidebarWidthPx` | Function | `packages/features/src/workspace-chrome/layout-preferences.ts` | 74 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `SubmitCreate → ClampInteger` | cross_community | 6 |
| `OptionsPage → ParseDarkModeValue` | cross_community | 4 |
| `OptionsPage → ApplyThemeClass` | cross_community | 4 |
| `OptionsPage → Cn` | cross_community | 4 |
| `TabContent → CreateDefaultCustomPresetForm` | cross_community | 4 |
| `SubmitCreate → NormalizeBmpColorDepth` | cross_community | 4 |
| `SubmitCreate → NormalizeResizeResamplingAlgorithm` | cross_community | 4 |
| `SubmitCreate → NormalizePositiveInteger` | cross_community | 4 |
| `SubmitCreate → NormalizePaperSize` | cross_community | 4 |
| `SubmitCreate → NormalizeDpi` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Ui | 5 calls |
| Processor | 3 calls |
| Splicing | 2 calls |
| Background-removal | 2 calls |
| Stores | 1 calls |
| Batch | 1 calls |
| Hooks | 1 calls |
| Cluster_36 | 1 calls |

## How to Explore

1. `gitnexus_context({name: "useContextMenuStateActions"})` — see callers and callees
2. `gitnexus_query({query: "options"})` — find related execution flows
3. Read key files listed above for implementation details
