---
name: ui
description: "Skill for the Ui area of imify. 279 symbols across 138 files."
---

# Ui

279 symbols | 138 files | Cohesion: 78%

## When to Use

- Working with code in `packages/`
- Understanding how loadSeoAuditSnapshot, getConcurrencyTooltip, useSeoAudit work
- Modifying ui-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/ui/src/ui/color-picker-popover.tsx` | clampByte, clampAlpha, parseRgbaColor, toHex2, toHex6 (+17) |
| `packages/ui/src/ui/workspace-config-sidebar-panel.tsx` | mergeOrderedIds, SortableWorkspaceConfigItem, WorkspaceConfigSidebarPanel, moveItem, moveItemRelativeTo (+9) |
| `packages/ui/src/ui/number-input.tsx` | NumberInput, clearHoldTimers, startHold, normalize, applyDelta (+3) |
| `packages/stores/src/shortcuts.ts` | normalizeShortcutKey, normalizeModifier, normalizeShortcutBinding, normalizeShortcutPreferences, keyboardEventToBinding (+3) |
| `packages/features/src/workspace-chrome/settings-dialog.tsx` | WorkspaceSettingsDialog, setSkipDownloadConfirm, setSkipOomWarning, setSkipSplicingHeavyPreviewQualityWarning, update (+2) |
| `apps/extension/src/options/components/context-menu/custom-formats-tab.tsx` | CustomFormatsTab, clearDeleteTimer, triggerDeleteWithUndo, handleUndoDelete, getResizeLabel (+1) |
| `packages/ui/src/ui/typography.tsx` | Heading, Subheading, BodyText, MutedText, LabelText (+1) |
| `packages/ui/src/ui/controlled-popover.tsx` | clearOpenTimer, clearCloseTimer, clearTimers, openPopover, closePopover (+1) |
| `apps/extension/src/sidepanel/components/seo-audit-snapshot-inline.tsx` | formatBytes, levelClass, SeoAuditSnapshotInline, handleOpenInspector, handleOpenSingleProcessor |
| `packages/ui/src/ui/zoom-pan-control.tsx` | ZoomPanControl, clampZoom, commitZoomDraft, cancelZoomEdit, resetZoomAndPan |

## Entry Points

Start here when exploring this area:

- **`loadSeoAuditSnapshot`** (Function) — `apps/extension/src/features/seo-audit/snapshot-store.ts:11`
- **`getConcurrencyTooltip`** (Function) — `apps/extension/src/options/shared/concurrency-messages.ts:7`
- **`useSeoAudit`** (Function) — `apps/extension/src/popup/hooks/use-seo-audit.ts:9`
- **`useSeoAuditSnapshot`** (Function) — `apps/extension/src/sidepanel/hooks/use-seo-audit-snapshot.ts:7`
- **`refreshSnapshot`** (Function) — `apps/extension/src/sidepanel/hooks/use-seo-audit-snapshot.ts:11`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `loadSeoAuditSnapshot` | Function | `apps/extension/src/features/seo-audit/snapshot-store.ts` | 11 |
| `getConcurrencyTooltip` | Function | `apps/extension/src/options/shared/concurrency-messages.ts` | 7 |
| `useSeoAudit` | Function | `apps/extension/src/popup/hooks/use-seo-audit.ts` | 9 |
| `useSeoAuditSnapshot` | Function | `apps/extension/src/sidepanel/hooks/use-seo-audit-snapshot.ts` | 7 |
| `refreshSnapshot` | Function | `apps/extension/src/sidepanel/hooks/use-seo-audit-snapshot.ts` | 11 |
| `buildToolEntryHref` | Function | `apps/web/src/features/presets/tool-entry-route.ts` | 15 |
| `useToast` | Function | `packages/core/src/hooks/use-toast.ts` | 45 |
| `initWorker` | Function | `packages/features/src/background-removal/use-background-removal.ts` | 112 |
| `removeBackground` | Function | `packages/features/src/background-removal/use-background-removal.ts` | 136 |
| `useDevModeEnabled` | Function | `packages/features/src/dev-mode/dev-mode-store.ts` | 38 |
| `useRuntimeLogStore` | Function | `packages/features/src/dev-mode/runtime-log-collector.ts` | 23 |
| `normalizePerformancePreferences` | Function | `packages/features/src/processor/performance-preferences.ts` | 119 |
| `BatchDownloadConfirmDialog` | Function | `apps/extension/src/options/components/batch/download-confirm-dialog.tsx` | 23 |
| `SortableQueueItem` | Function | `apps/extension/src/options/components/batch/sortable-queue-item.tsx` | 9 |
| `ContextMenuSettingsTab` | Function | `apps/extension/src/options/components/context-menu/context-menu-settings-tab.tsx` | 22 |
| `CustomFormatsTab` | Function | `apps/extension/src/options/components/context-menu/custom-formats-tab.tsx` | 81 |
| `clearDeleteTimer` | Function | `apps/extension/src/options/components/context-menu/custom-formats-tab.tsx` | 111 |
| `triggerDeleteWithUndo` | Function | `apps/extension/src/options/components/context-menu/custom-formats-tab.tsx` | 120 |
| `handleUndoDelete` | Function | `apps/extension/src/options/components/context-menu/custom-formats-tab.tsx` | 139 |
| `getResizeLabel` | Function | `apps/extension/src/options/components/context-menu/custom-formats-tab.tsx` | 267 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `SplicingLandingPage → ClampNumber` | cross_community | 8 |
| `ProcessorWorkPage → ClampNumber` | cross_community | 8 |
| `SplicingWorkPage → ClampNumber` | cross_community | 8 |
| `FillLayerAccordion → ClearOpenTimer` | cross_community | 6 |
| `FillLayerAccordion → ClearCloseTimer` | cross_community | 6 |
| `WorkspaceSettingsDialog → ClampNumber` | cross_community | 5 |
| `DevToolsDialog → ClampNumber` | cross_community | 5 |
| `ZoomPanControl → ClearOpenTimer` | cross_community | 5 |
| `ZoomPanControl → ClearCloseTimer` | cross_community | 5 |
| `OptionsPage → ParseDarkModeValue` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Processor | 7 calls |
| Components | 5 calls |
| Splicing | 5 calls |
| Grid-designer | 4 calls |
| Filling | 4 calls |
| Fill | 4 calls |
| Options | 3 calls |
| Hooks | 2 calls |

## How to Explore

1. `gitnexus_context({name: "loadSeoAuditSnapshot"})` — see callers and callees
2. `gitnexus_query({query: "ui"})` — find related execution flows
3. Read key files listed above for implementation details
