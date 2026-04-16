import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ImageOff, ImagePlus, RotateCcw, Square, X } from "lucide-react"

import type { LayerFillState, VectorLayer, ImageTransform } from "@/features/filling/types"
import { DEFAULT_IMAGE_TRANSFORM } from "@/features/filling/types"
import { SHAPE_LABELS } from "@/features/filling/shape-generators"
import { useFillingStore } from "@/options/stores/filling-store"
import { ControlledPopover } from "@/options/components/ui/controlled-popover"
import { NumberInput } from "@/options/components/ui/number-input"
import { ColorPickerPopover } from "@/options/components/ui/color-picker-popover"
import { Button } from "@/options/components/ui/button"
import { Kicker } from "@/options/components/ui/typography"
import { Tooltip } from "@/options/components/tooltip"

interface FillLayerCardProps {
  layer: VectorLayer
  fillState: LayerFillState | undefined
}

const LAYER_PREVIEW_RESIZE_WIDTH = 100
const LAYER_PREVIEW_QUALITY = 0.6

async function blobToDataUrl(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(blob)
  })
}

async function generateLayerPreview(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    if (!blob.type.startsWith("image/")) return null

    const bitmap = await createImageBitmap(blob, {
      resizeWidth: LAYER_PREVIEW_RESIZE_WIDTH,
      resizeQuality: "low",
    })

    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      bitmap.close()
      return null
    }

    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()

    const thumbnailBlob = await canvas.convertToBlob({
      type: "image/jpeg",
      quality: LAYER_PREVIEW_QUALITY,
    })
    return blobToDataUrl(thumbnailBlob)
  } catch {
    return null
  }
}

export function FillLayerCard({ layer, fillState }: FillLayerCardProps) {
  const updateLayerFillState = useFillingStore((s) => s.updateLayerFillState)
  const setSelectedLayerId = useFillingStore((s) => s.setSelectedLayerId)
  const selectedLayerId = useFillingStore((s) => s.selectedLayerId)
  const canvasFillState = useFillingStore((s) => s.canvasFillState)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

  const selected = selectedLayerId === layer.id
  const hasImage = Boolean(fillState?.imageUrl)

  useEffect(() => {
    let isMounted = true

    const loadPreview = async () => {
      if (!fillState?.imageUrl) {
        if (isMounted) setPreviewImageUrl(null)
        return
      }

      const preview = await generateLayerPreview(fillState.imageUrl)
      if (!isMounted) return

      setPreviewImageUrl(preview ?? fillState.imageUrl)
    }

    void loadPreview()

    return () => {
      isMounted = false
    }
  }, [fillState?.imageUrl])

  const sublabel = useMemo(() => {
    if (hasImage && fillState) {
      return `Filled, ${Math.round(layer.width)}x${Math.round(layer.height)}`
    }
    return `Empty, ${SHAPE_LABELS[layer.shapeType]}`
  }, [hasImage, fillState, layer.height, layer.shapeType, layer.width])

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const url = URL.createObjectURL(file)

      const img = new Image()
      img.onload = () => {
        const scaleToFit = Math.max(layer.width / img.naturalWidth, layer.height / img.naturalHeight)
        updateLayerFillState(layer.id, {
          imageUrl: url,
          imageTransform: {
            x: 0,
            y: 0,
            scaleX: scaleToFit,
            scaleY: scaleToFit,
            rotation: 0,
          },
        })
      }

      img.src = url

      // Allow re-selecting the same file
      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    [layer, updateLayerFillState]
  )

  const handleClearImage = useCallback(() => {
    if (!fillState?.imageUrl) return
    URL.revokeObjectURL(fillState.imageUrl)
    setPreviewImageUrl(null)

    updateLayerFillState(layer.id, {
      imageUrl: null,
      imageTransform: { ...DEFAULT_IMAGE_TRANSFORM },
    })
  }, [fillState?.imageUrl, layer.id, updateLayerFillState])

  const handleResetTransform = useCallback(() => {
    updateLayerFillState(layer.id, {
      imageTransform: { ...DEFAULT_IMAGE_TRANSFORM },
    })
  }, [layer.id, updateLayerFillState])

  const handleTransformChange = useCallback(
    (partial: Partial<ImageTransform>) => {
      if (!fillState) return
      updateLayerFillState(layer.id, {
        imageTransform: { ...fillState.imageTransform, ...partial },
      })
    },
    [fillState, layer.id, updateLayerFillState]
  )

  const borderWidth = fillState?.borderWidth ?? 0
  const cornerRadius = fillState?.cornerRadius ?? 0
  const borderColor = fillState?.borderColor ?? "#000000"
  const borderOverridden = canvasFillState.borderOverrideEnabled
  const cornerRadiusOverridden = canvasFillState.cornerRadiusOverrideEnabled

  const triggerImageClick = useCallback(() => {
    setSelectedLayerId(layer.id)
    fileInputRef.current?.click()
  }, [layer.id, setSelectedLayerId])

  return (
    <div
      role="button"
      tabIndex={0}
      className={[
        "group relative rounded-md border px-2.5 py-2.5 transition-colors shadow-sm",
        selected
          ? hasImage
            ? "border-sky-300 bg-sky-50/30"
            : "border-amber-300 bg-amber-50/40 ring-1 ring-amber-200/70"
          : "border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30",
      ].join(" ")}
      onClick={() => setSelectedLayerId(layer.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          setSelectedLayerId(layer.id)
          return
        }
        if (e.key === " ") {
          e.preventDefault()
          setSelectedLayerId(layer.id)
        }
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      <div className="flex items-start gap-3">
        {/* 200px preview moved to the left side of title/subtitle */}
        <div className="relative w-[32px] h-[32px] overflow-hidden bg-slate-50 dark:bg-slate-900/40 rounded-md border flex items-center justify-center shrink-0">
          {fillState?.imageUrl ? (
            <img
              src={previewImageUrl ?? fillState.imageUrl}
              alt={`${layer.name || "Layer"} preview`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-slate-400 dark:text-slate-500">
              <ImageOff size={14} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-[12px] font-bold text-slate-800 dark:text-slate-100">
                {layer.name || `Layer ${layer.id.slice(-5)}`}
              </div>
              <div className="truncate text-[10px] text-slate-400 mt-0.5">{sublabel}</div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Tooltip content="Add/Change image">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    triggerImageClick()
                  }}
                  className="h-8 w-8 rounded-md"
                  aria-label="Add/Change image"
                >
                  <ImagePlus size={16} />
                </Button>
              </Tooltip>

              <ControlledPopover
                behavior="hover"
                preset="inspector"
                side="bottom"
                align="end"
                trigger={
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-md"
                    aria-label="Layer border options"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedLayerId(layer.id)
                    }}
                  >
                    <Square size={16} />
                  </Button>
                }
                contentClassName="z-[9999] w-[260px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-3"
              >
                <div className="space-y-3">
                  <Kicker>Border options</Kicker>
                  <div className="grid grid-cols-2 gap-2">
                    <NumberInput
                      label="Border"
                      value={borderWidth}
                      onChangeValue={(v) => updateLayerFillState(layer.id, { borderWidth: v })}
                      min={0}
                      max={50}
                      disabled={borderOverridden}
                      tooltip={borderOverridden ? "Disabled because Canvas border override is enabled." : undefined}
                    />
                    <NumberInput
                      label="Corner Radius"
                      value={cornerRadius}
                      onChangeValue={(v) => updateLayerFillState(layer.id, { cornerRadius: v })}
                      min={0}
                      max={200}
                      disabled={cornerRadiusOverridden}
                      tooltip={cornerRadiusOverridden ? "Disabled because Canvas corner radius override is enabled." : undefined}
                    />
                  </div>
                  <div className="pt-1">
                    <div className={borderOverridden ? "pointer-events-none opacity-50" : ""}>
                      <ColorPickerPopover
                        label="Border Color"
                        value={borderColor}
                        onChange={(v) => updateLayerFillState(layer.id, { borderColor: v })}
                        enableAlpha={false}
                        enableGradient
                        outputMode="hex"
                      />
                    </div>
                  </div>
                  {(borderOverridden || cornerRadiusOverridden) && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Layer border options are currently controlled by Canvas override settings.
                    </div>
                  )}
                </div>
              </ControlledPopover>
            </div>
          </div>

          {/* Keep transforms accessible but only when the layer is active (avoids accordion-like bloat) */}
          {selected && hasImage && fillState ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <NumberInput
                  label="Rotation"
                  value={Math.round(fillState.imageTransform.rotation)}
                  onChangeValue={(v) => handleTransformChange({ rotation: v })}
                  min={-360}
                  max={360}
                />
                <div className="flex items-center gap-1 mt-4">
                <Tooltip content="Reset transform">
                  <Button
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleResetTransform()
                    }}
                    size="sm"
                  >
                    <RotateCcw size={14} />
                  </Button>
                </Tooltip>
                <Tooltip content="Remove image">
                  <Button
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClearImage()
                    }}
                    size="sm"
                    >
                      <X size={14} />
                    </Button>
                  </Tooltip>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <NumberInput
                  label="Offset X"
                  value={Math.round(fillState.imageTransform.x)}
                  onChangeValue={(v) => handleTransformChange({ x: v })}
                  min={-9999}
                  max={9999}
                />
                <NumberInput
                  label="Offset Y"
                  value={Math.round(fillState.imageTransform.y)}
                  onChangeValue={(v) => handleTransformChange({ y: v })}
                  min={-9999}
                  max={9999}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <NumberInput
                  label="Scale X"
                  value={Math.round(fillState.imageTransform.scaleX * 100)}
                  onChangeValue={(v) => handleTransformChange({ scaleX: v / 100 })}
                  min={1}
                  max={1000}
                  tooltip="Scale in percentage"
                />
                <NumberInput
                  label="Scale Y"
                  value={Math.round(fillState.imageTransform.scaleY * 100)}
                  onChangeValue={(v) => handleTransformChange({ scaleY: v / 100 })}
                  min={1}
                  max={1000}
                  tooltip="Scale in percentage"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

