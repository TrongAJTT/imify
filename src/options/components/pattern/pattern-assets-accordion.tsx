import { useRef, useState } from "react"
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
import { Brush, ImagePlus, Trash2 } from "lucide-react"

import type { PatternAsset } from "@/features/pattern/types"
import { PatternAssetDrawingDialog } from "@/options/components/pattern/pattern-asset-drawing-dialog"
import { PatternAssetListItem } from "@/options/components/pattern/pattern-asset-list-item"
import { Button } from "@/options/components/ui/button"
import { ResizableAccordionCard } from "@/options/components/ui/resizable-accordion-card"
import { usePatternStore } from "@/options/stores/pattern-store"
import { Tooltip } from "../tooltip"

const ASSET_CARD_MIN_HEIGHT = 220
const ASSET_CARD_MAX_HEIGHT = 760
const BLOB_URL_PREFIX = "blob:"

function createPatternAssetId(): string {
  return `pattern_asset_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
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
  const [isDrawingDialogOpen, setIsDrawingDialogOpen] = useState(false)
  const [cardHeight, setCardHeight] = useState(360)

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

    try {
      const size = await resolveBitmapSize(blob)
      addAsset(
        buildAssetFromBlob({
          blob,
          objectUrl,
          name: `${suggestedName}.png`,
          source: "draw",
          size,
        })
      )
      setIsDrawingDialogOpen(false)
    } catch {
      revokeObjectUrlIfNeeded(objectUrl)
    }
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
              <ImagePlus size={14} />
              Upload
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => setIsDrawingDialogOpen(true)}
            >
              <Brush size={14} />
              Draw
            </Button>

            {assets.length > 0 && (
                <Tooltip content="Clear all assets">
                    <Button className="flex" variant="secondary" size="sm" onClick={handleClearAssets}>
                        <Trash2 size={13} color="red" />
                    </Button>
                </Tooltip>
            )}
          </div>


          {assets.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 px-3 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
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
        isOpen={isDrawingDialogOpen}
        onClose={() => setIsDrawingDialogOpen(false)}
        onSave={(payload) => void handleDrawingSave(payload)}
      />
    </>
  )
}
