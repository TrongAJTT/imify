import {
  DEFAULT_PATTERN_ASSET_BORDER_SETTINGS,
  DEFAULT_PATTERN_ASSET_MONOCHROME_SETTINGS,
  type PatternAsset,
  type PatternAssetBorderSettings,
  type PatternAssetMonochromeSettings
} from "./types"
import { Button } from "@imify/ui"
import { CheckboxCard } from "@imify/ui"
import { ColorPickerPopover } from "@imify/ui"
import { ControlledPopover } from "@imify/ui"
import { NumberInput } from "@imify/ui"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Eye,
  EyeOff,
  PencilLine,
  SlidersHorizontal,
  Trash2
} from "lucide-react"

interface PatternAssetListItemProps {
  asset: PatternAsset
  onToggleEnabled: (assetId: string, enabled: boolean) => void
  onOpacityChange: (assetId: string, opacity: number) => void
  onMonochromeChange: (
    assetId: string,
    monochrome: PatternAssetMonochromeSettings
  ) => void
  onBorderChange: (assetId: string, border: PatternAssetBorderSettings) => void
  onCornerRadiusChange: (assetId: string, cornerRadius: number) => void
  onEdit: (assetId: string) => void
  onRemove: (assetId: string) => void
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function PatternAssetListItem({
  asset,
  onToggleEnabled,
  onOpacityChange,
  onMonochromeChange,
  onBorderChange,
  onCornerRadiusChange,
  onEdit,
  onRemove
}: PatternAssetListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: asset.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 40 : undefined,
    opacity: isDragging ? 0.85 : 1
  }
  const monochrome =
    asset.monochrome ?? DEFAULT_PATTERN_ASSET_MONOCHROME_SETTINGS
  const border = asset.border ?? DEFAULT_PATTERN_ASSET_BORDER_SETTINGS
  const cornerRadius = Math.max(0, asset.cornerRadius ?? 0)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`rounded-lg border ${
        asset.enabled
          ? "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          : "border-slate-200/70 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/40"
      } p-2 touch-none cursor-grab active:cursor-grabbing`}>
      <div className="flex items-center gap-2">
        <div className="h-12 w-12 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0">
          <img
            src={asset.imageUrl}
            alt={asset.name}
            className="h-full w-full object-contain"
            draggable={false}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div
            className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 truncate"
            title={asset.name}>
            {asset.name}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            {Math.round(asset.width)} x {Math.round(asset.height)} px
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToggleEnabled(asset.id, !asset.enabled)}
          onPointerDown={(event) => event.stopPropagation()}
          className="h-6 w-6 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label={asset.enabled ? "Hide asset" : "Show asset"}>
          {asset.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>

        <ControlledPopover
          preset="tooltip"
          behavior="hover"
          side="top"
          align="end"
          openDelayMs={120}
          closeDelayMs={100}
          contentOnMouseDown={(event) => event.stopPropagation()}
          contentOnPointerDown={(event) => event.stopPropagation()}
          trigger={
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              className="h-6 w-6 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Customize asset">
              <SlidersHorizontal size={14} />
            </button>
          }
          contentClassName="z-[120] w-72 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-xl">
          <div className="space-y-3 pointer-events-auto">
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => onEdit(asset.id)}
              onPointerDown={(event) => event.stopPropagation()}>
              <PencilLine size={14} />
              Edit in Draw
            </Button>

            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Opacity
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.round(clamp(asset.opacity, 0, 1) * 100)}
                onChange={(event) =>
                  onOpacityChange(
                    asset.id,
                    clamp(Number(event.target.value) / 100, 0, 1)
                  )
                }
                onPointerDown={(event) => event.stopPropagation()}
                className="flex-1 accent-sky-500"
              />
              <span className="w-10 text-right text-[10px] text-slate-500 dark:text-slate-400">
                {Math.round(clamp(asset.opacity, 0, 1) * 100)}%
              </span>
            </div>

            <CheckboxCard
              title="Monochrome"
              subtitle={
                monochrome.enabled
                  ? `Enabled (${monochrome.color})`
                  : "Disabled"
              }
              checked={monochrome.enabled}
              onChange={(checked) =>
                onMonochromeChange(asset.id, {
                  ...monochrome,
                  enabled: checked
                })
              }
              className="px-2 py-1.5"
            />

            {monochrome.enabled && (
              <ColorPickerPopover
                label="Monochrome Color"
                value={monochrome.color}
                onChange={(value) =>
                  onMonochromeChange(asset.id, {
                    ...monochrome,
                    color: value
                  })
                }
                enableGradient={false}
                enableAlpha={false}
                outputMode="hex"
              />
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Border & Corner
              </div>
              <div className="grid grid-cols-2 gap-2">
                <NumberInput
                  label="Border Width"
                  value={Math.round(border.width * 10) / 10}
                  min={0}
                  max={200}
                  step={0.5}
                  onChangeValue={(value) =>
                    onBorderChange(asset.id, {
                      ...border,
                      width: Math.max(0, value)
                    })
                  }
                />
                <NumberInput
                  label="Corner Radius"
                  value={Math.round(cornerRadius * 10) / 10}
                  min={0}
                  max={1024}
                  step={0.5}
                  onChangeValue={(value) =>
                    onCornerRadiusChange(asset.id, Math.max(0, value))
                  }
                />
              </div>
              <ColorPickerPopover
                label="Border Color"
                value={border.color}
                onChange={(value) =>
                  onBorderChange(asset.id, {
                    ...border,
                    color: value
                  })
                }
                enableGradient={false}
                enableAlpha={true}
                outputMode="rgba"
              />
            </div>
          </div>
        </ControlledPopover>

        <button
          type="button"
          onClick={() => onRemove(asset.id)}
          onPointerDown={(event) => event.stopPropagation()}
          className="h-6 w-6 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          aria-label="Remove asset">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}


