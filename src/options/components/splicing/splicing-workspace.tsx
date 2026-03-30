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
import { CanvasPreview } from "@/options/components/splicing/canvas-preview"
import { ImageStrip } from "@/options/components/splicing/image-strip"
import { SplicingPreviewSettings } from "@/options/components/splicing/splicing-preview-settings"

interface SplicingWorkspaceProps {
  hasImages: boolean
  fileInputRef: React.RefObject<HTMLInputElement>
  images: SplicingImageItem[]
  layoutConfig: SplicingLayoutConfig
  canvasStyle: SplicingCanvasStyle
  imageStyle: SplicingImageStyle
  imageResize: SplicingImageResize
  imageFitValue: number
  isScrollPan: boolean
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
  onReorderImage: (draggedId: string, targetId: string) => void
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
  isScrollPan,
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
        <div
          className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/30 py-16 cursor-pointer hover:border-sky-400 dark:hover:border-sky-600 hover:bg-sky-50/50 dark:hover:bg-sky-900/10 transition-all"
          onClick={onOpenFilePicker}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDropFiles}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-500">
            <ImagePlus size={28} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Drop images here or click to browse
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Supports JPG, PNG, WebP, AVIF, and more
            </p>
          </div>
        </div>
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
              isScrollPan={isScrollPan}
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

          <SplicingPreviewSettings
            previewQualityPercent={previewQualityPercent}
            previewShowImageNumber={previewShowImageNumber}
            onPreviewQualityChange={onPreviewQualityChange}
            onPreviewShowImageNumberChange={onPreviewShowImageNumberChange}
          />
        </div>
      )}
    </>
  )
}

