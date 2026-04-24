import React, { useMemo, useRef, useState } from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Brush, ImagePlus, Trash2, Upload } from "lucide-react"

import {
  DEFAULT_PATTERN_ASSET_BORDER_SETTINGS,
  DEFAULT_PATTERN_ASSET_MONOCHROME_SETTINGS,
  type PatternAsset,
} from "./types"
import { PatternAssetDrawingDialog } from "./pattern-asset-drawing-dialog"
import { PatternAssetListItem } from "./pattern-asset-list-item"
import { Button } from "@imify/ui"
import { ResizableAccordionCard } from "@imify/ui"
import { PATTERN_TOOLTIPS } from "./pattern-tooltips"
import { usePatternStore } from "@imify/stores/stores/pattern-store"
import { Tooltip } from "../shared/tooltip"

const ASSET_CARD_MIN_HEIGHT = 220
const ASSET_CARD_MAX_HEIGHT = 760
const BLOB_URL_PREFIX = "blob:"

type DrawingSession =
  | { kind: "create" }
  | { kind: "edit"; assetId: string }

function createPatternAssetId(): string {
  return `pattern_asset_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function toSuggestedAssetName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) {
    return "drawn-asset"
  }

  return trimmed.replace(/\.[^./\\]+$/, "")
}

function revokeObjectUrlIfNeeded(url: string | null | undefined): void {
  if (!url || !url.startsWith(BLOB_URL_PREFIX)) {
    return
  }

  URL.revokeObjectURL(url)
}

async function resolveBitmapSize(source: Blob): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(source)

  try {
    return {
      width: Math.max(1, bitmap.width),
      height: Math.max(1, bitmap.height),
    }
  } finally {
    bitmap.close()
  }
}

function buildAssetFromBlob(params: {
  blob: Blob
  objectUrl: string
  name: string
  source: PatternAsset["source"]
  size: { width: number; height: number }
}): PatternAsset {
  return {
    id: createPatternAssetId(),
    name: params.name,
    source: params.source,
    imageUrl: params.objectUrl,
    mimeType: params.blob.type || "image/png",
    width: params.size.width,
    height: params.size.height,
    enabled: true,
    opacity: 1,
    monochrome: { ...DEFAULT_PATTERN_ASSET_MONOCHROME_SETTINGS },
    border: { ...DEFAULT_PATTERN_ASSET_BORDER_SETTINGS },
    cornerRadius: 0,
  }
}

export function PatternAssetsAccordion() {
  const assets = usePatternStore((state) => state.assets)
  const addAsset = usePatternStore((state) => state.addAsset)
  const updateAsset = usePatternStore((state) => state.updateAsset)
  const removeAsset = usePatternStore((state) => state.removeAsset)
  const clearAssets = usePatternStore((state) => state.clearAssets)
  const reorderAssetsByIds = usePatternStore((state) => state.reorderAssetsByIds)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [drawingSession, setDrawingSession] = useState<DrawingSession | null>(null)
  const [cardHeight, setCardHeight] = useState(360)

  const editingAsset = useMemo(() => {
    if (!drawingSession || drawingSession.kind !== "edit") {
      return null
    }

    return assets.find((asset) => asset.id === drawingSession.assetId) ?? null
  }, [assets, drawingSession])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleAssetFilesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        continue
      }

      const objectUrl = URL.createObjectURL(file)

      try {
        const size = await resolveBitmapSize(file)
        addAsset(
          buildAssetFromBlob({
            blob: file,
            objectUrl,
            name: file.name,
            source: "upload",
            size,
          })
        )
      } catch {
        revokeObjectUrlIfNeeded(objectUrl)
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemoveAsset = (assetId: string) => {
    const asset = assets.find((entry) => entry.id === assetId)
    revokeObjectUrlIfNeeded(asset?.imageUrl)
    removeAsset(assetId)
  }

  const handleClearAssets = () => {
    for (const asset of assets) {
      revokeObjectUrlIfNeeded(asset.imageUrl)
    }

    clearAssets()
  }

  const handleDrawingSave = async ({ blob, suggestedName }: { blob: Blob; suggestedName: string }) => {
    const objectUrl = URL.createObjectURL(blob)
    const normalizedName = `${toSuggestedAssetName(suggestedName)}.png`

    try {
      const size = await resolveBitmapSize(blob)

      if (drawingSession?.kind === "edit") {
        const currentAsset = assets.find((asset) => asset.id === drawingSession.assetId)

        if (currentAsset) {
          updateAsset(currentAsset.id, {
            name: normalizedName,
            source: "draw",
            imageUrl: objectUrl,
            mimeType: blob.type || "image/png",
            width: size.width,
            height: size.height,
          })

          revokeObjectUrlIfNeeded(currentAsset.imageUrl)
          setDrawingSession(null)
          return
        }
      }

      addAsset(
        buildAssetFromBlob({
          blob,
          objectUrl,
          name: normalizedName,
          source: "draw",
          size,
        })
      )
      setDrawingSession(null)
    } catch {
      revokeObjectUrlIfNeeded(objectUrl)
    }
  }

  const handleOpenDrawDialog = () => {
    setDrawingSession({ kind: "create" })
  }

  const handleEditAsset = (assetId: string) => {
    setDrawingSession({ kind: "edit", assetId })
  }

  const handleCloseDrawDialog = () => {
    setDrawingSession(null)
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = assets.findIndex((asset) => asset.id === active.id)
    const newIndex = assets.findIndex((asset) => asset.id === over.id)

    if (oldIndex < 0 || newIndex < 0) {
      return
    }

    const next = arrayMove(assets, oldIndex, newIndex)
    reorderAssetsByIds(next.map((asset) => asset.id))
  }

  return (
    <>
      <ResizableAccordionCard
        icon={<ImagePlus size={16} />}
        label="Assets"
        sublabel={assets.length > 0 ? `${assets.length} layer${assets.length === 1 ? "" : "s"}` : "No assets yet"}
        colorTheme="amber"
        defaultOpen={true}
        height={cardHeight}
        initialHeight={360}
        minHeight={ASSET_CARD_MIN_HEIGHT}
        maxHeight={ASSET_CARD_MAX_HEIGHT}
        onHeightChange={setCardHeight}
      >
        <div className="space-y-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.svg"
            className="hidden"
            multiple
            onChange={(event) => void handleAssetFilesUpload(event)}
          />

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} />
              Upload
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={handleOpenDrawDialog}
            >
              <Brush size={14} />
              Draw
            </Button>

            {assets.length > 0 && (
              <Tooltip content={PATTERN_TOOLTIPS.assets.clearAllAssets}>
                <Button className="flex" variant="secondary" size="sm" onClick={handleClearAssets}>
                  <Trash2 size={13} color="red" />
                </Button>
              </Tooltip>
            )}
          </div>

          {assets.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Add images or draw your own icon asset, then reorder to set layer priority.
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={assets.map((asset) => asset.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {assets.map((asset) => (
                    <PatternAssetListItem
                      key={asset.id}
                      asset={asset}
                      onToggleEnabled={(assetId, enabled) => updateAsset(assetId, { enabled })}
                      onOpacityChange={(assetId, opacity) => updateAsset(assetId, { opacity })}
                      onMonochromeChange={(assetId, monochrome) => updateAsset(assetId, { monochrome })}
                      onBorderChange={(assetId, border) => updateAsset(assetId, { border })}
                      onCornerRadiusChange={(assetId, cornerRadius) => updateAsset(assetId, { cornerRadius })}
                      onEdit={handleEditAsset}
                      onRemove={handleRemoveAsset}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </ResizableAccordionCard>

      <PatternAssetDrawingDialog
        isOpen={drawingSession !== null}
        mode={drawingSession?.kind === "edit" ? "edit" : "create"}
        sourceImageUrl={editingAsset?.imageUrl ?? null}
        initialSuggestedName={toSuggestedAssetName(editingAsset?.name ?? "drawn-asset")}
        onClose={handleCloseDrawDialog}
        onSave={handleDrawingSave}
      />
    </>
  )
}



