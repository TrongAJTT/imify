import { ImagePlus } from "lucide-react"
import type React from "react"

import type {
  LayoutResult,
  SplicingCanvasStyle,
  SplicingImageItem,
  SplicingImageResize,
  SplicingImageStyle,
  SplicingLayoutConfig
} from "@/features/splicing/types"
import type { PreviewInteractionMode } from "@/options/components/ui/preview-interaction-mode-toggle"
import { CanvasPreview } from "@/options/components/splicing/canvas-preview"
import { ImageStrip } from "@/options/components/splicing/image-strip"
import { EmptyDropCard } from "@/options/components/ui/empty-drop-card"

interface SplicingWorkspaceProps {
  hasImages: boolean
  fileInputRef: React.RefObject<HTMLInputElement>
  images: SplicingImageItem[]
  layoutConfig: SplicingLayoutConfig
  canvasStyle: SplicingCanvasStyle
  imageStyle: SplicingImageStyle
  imageResize: SplicingImageResize
  imageFitValue: number
  previewInteractionMode: PreviewInteractionMode
  previewQualityPercent: number
  previewShowImageNumber: boolean
  onLayoutComputed: (layout: LayoutResult | null) => void
  onPreviewRendered: (imageCount: number) => void
  onPreviewSourcesProgress: (payload: { completed: number; total: number }) => void
  onPreviewNumberingProgress: (payload: { status: "processing" | "done"; completed: number; total: number }) => void
  onOpenFilePicker: () => void
  onDropFiles: (e: React.DragEvent) => void
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: (id: string) => void
  onReorderImage: (fromIndex: number, toIndex: number) => void
  onAddMore: () => void
  onPreviewQualityChange: (next: number) => void
  onPreviewShowImageNumberChange: (next: boolean) => void
}

export function SplicingWorkspace({
  hasImages,
  fileInputRef,
  images,
  layoutConfig,
  canvasStyle,
  imageStyle,
  imageResize,
  imageFitValue,
  previewInteractionMode,
  previewQualityPercent,
  previewShowImageNumber,
  onLayoutComputed,
  onPreviewRendered,
  onPreviewSourcesProgress,
  onPreviewNumberingProgress,
  onOpenFilePicker,
  onDropFiles,
  onFileInput,
  onRemoveImage,
  onReorderImage,
  onAddMore,
  onPreviewQualityChange,
  onPreviewShowImageNumberChange
}: SplicingWorkspaceProps) {
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onFileInput}
      />

      {!hasImages ? (
        <EmptyDropCard
          icon={<ImagePlus size={28} className="text-sky-500" />}
          iconWrapperClassName="bg-sky-100 dark:bg-sky-900/30 border-transparent shadow-none"
          title="Drop images here or click to browse"
          subtitle="Supports JPG, PNG, WebP, AVIF, and more"
          onDropFiles={(files) => {
            const event = {
              preventDefault: () => {},
              dataTransfer: { files }
            } as any
            onDropFiles(event)
          }}
          onClick={onOpenFilePicker}
        />
      ) : (
        <div className="space-y-4">
          <div onDragOver={(e) => e.preventDefault()} onDrop={onDropFiles}>
            <CanvasPreview
              images={images}
              layoutConfig={layoutConfig}
              canvasStyle={canvasStyle}
              imageStyle={imageStyle}
              imageResize={imageResize}
              fitValue={imageFitValue}
              previewInteractionMode={previewInteractionMode}
              onLayoutComputed={(layout) => onLayoutComputed(layout)}
              onPreviewRendered={onPreviewRendered}
              onPreviewSourcesProgress={onPreviewSourcesProgress}
              onNumberingProgress={onPreviewNumberingProgress}
            />
          </div>

          <ImageStrip
            images={images}
            onRemove={onRemoveImage}
            onReorder={onReorderImage}
            onAddMore={onAddMore}
          />
        </div>
      )}
    </>
  )
}

