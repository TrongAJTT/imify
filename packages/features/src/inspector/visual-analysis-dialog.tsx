import { useEffect, useRef, useState } from "react"
import { BaseDialog, Kicker } from "@imify/ui"
import { useInspectorStore } from "@imify/stores/stores/inspector-store"
import { InteractivePreview, type PixelSample } from "./interactive-preview"

interface VisualAnalysisDialogProps {
  imageUrl: string
  alt: string
}

export function VisualAnalysisDialog({ imageUrl, alt }: VisualAnalysisDialogProps) {
  const isOpen = useInspectorStore((s) => s.visualAnalysisDialogOpen)
  const setOpen = useInspectorStore((s) => s.setVisualAnalysisDialogOpen)
  const previewChannelMode = useInspectorStore((s) => s.previewChannelMode)
  const colorBlindMode = useInspectorStore((s) => s.colorBlindMode)
  const loupeEnabled = useInspectorStore((s) => s.loupeEnabled)
  const loupeZoom = useInspectorStore((s) => s.loupeZoom)
  const [sample, setSample] = useState<PixelSample | null>(null)
  const [isReady, setIsReady] = useState(false)
  const loupeCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const LOUPE_WIDTH = 192
  const LOUPE_HEIGHT = 108
  const LOUPE_SAMPLE_SIZE = 14

  useEffect(() => {
    if (!sample || !loupeEnabled || !isReady) return
    const loupeCanvas = loupeCanvasRef.current
    if (!loupeCanvas) return
    loupeCanvas.width = LOUPE_WIDTH
    loupeCanvas.height = LOUPE_HEIGHT
    const loupeCtx = loupeCanvas.getContext("2d")
    if (!loupeCtx) return
    const img = new Image()
    img.src = imageUrl
    img.onload = () => {
      const MAX_PREVIEW_EDGE = 1600
      const scale = Math.min(1, MAX_PREVIEW_EDGE / Math.max(img.width, img.height))
      const width = Math.max(1, Math.round(img.width * scale))
      const height = Math.max(1, Math.round(img.height * scale))
      const tempCanvas = new OffscreenCanvas(width, height)
      const tempCtx = tempCanvas.getContext("2d")
      if (!tempCtx) return
      tempCtx.drawImage(img, 0, 0, width, height)
      const loupeRatio = LOUPE_WIDTH / LOUPE_HEIGHT
      const effectiveSampleHeight = Math.max(4, Math.round((LOUPE_SAMPLE_SIZE * 8) / Math.max(2, loupeZoom)))
      const effectiveSampleWidth = Math.max(4, Math.round(effectiveSampleHeight * loupeRatio))
      const halfWidth = Math.floor(effectiveSampleWidth / 2)
      const halfHeight = Math.floor(effectiveSampleHeight / 2)
      const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
      const sx = clamp(sample.x - halfWidth, 0, Math.max(0, width - effectiveSampleWidth))
      const sy = clamp(sample.y - halfHeight, 0, Math.max(0, height - effectiveSampleHeight))
      loupeCtx.clearRect(0, 0, LOUPE_WIDTH, LOUPE_HEIGHT)
      loupeCtx.imageSmoothingEnabled = false
      loupeCtx.drawImage(tempCanvas, sx, sy, effectiveSampleWidth, effectiveSampleHeight, 0, 0, LOUPE_WIDTH, LOUPE_HEIGHT)
      loupeCtx.strokeStyle = "rgba(255,255,255,0.9)"
      loupeCtx.lineWidth = 1
      loupeCtx.beginPath()
      loupeCtx.moveTo(LOUPE_WIDTH / 2, 0)
      loupeCtx.lineTo(LOUPE_WIDTH / 2, LOUPE_HEIGHT)
      loupeCtx.moveTo(0, LOUPE_HEIGHT / 2)
      loupeCtx.lineTo(LOUPE_WIDTH, LOUPE_HEIGHT / 2)
      loupeCtx.stroke()
    }
  }, [isReady, imageUrl, loupeEnabled, loupeZoom, sample])

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      contentClassName="h-[70vh] max-h-[70vh] w-[min(1100px,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] overflow-x-hidden rounded-md p-3 sm:p-4 lg:p-5"
    >
      <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 sm:gap-4 lg:gap-6">
        <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4 lg:flex-row lg:gap-6">
          <div className="flex min-h-[220px] min-w-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-md border border-dashed border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/20">
            <div className="flex h-full w-full items-center justify-center p-2">
              <div className="mt-auto aspect-square w-full">
                <InteractivePreview
                  imageUrl={imageUrl}
                  alt={alt}
                  channelMode={previewChannelMode}
                  colorBlindMode={colorBlindMode}
                  loupeEnabled={loupeEnabled}
                  loupeZoom={loupeZoom}
                  onSampleChange={setSample}
                  onReadyChange={setIsReady}
                  hideOverlays={true}
                  maxDisplayHeight={560}
                />
              </div>
            </div>
          </div>
          <div className="w-full min-w-0 shrink-0 overflow-y-auto lg:w-72 lg:pr-1">
            <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6">
            <div>
            <Kicker>Move mouse over image to analyze. Adjust modes in Display Accordion. Click inside the image to copy the pixel color.</Kicker>
              {/* Standalone Loupe */}
              <div className="mt-2 relative aspect-[16/9] w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center overflow-hidden shadow-sm">
                {loupeEnabled && isReady && sample ? (
                  <>
                    <canvas
                      ref={loupeCanvasRef}
                      style={{ imageRendering: "pixelated", width: "100%", height: "100%" }}
                    />
                    <div className="absolute bottom-1.5 right-1.5 rounded-md bg-slate-900/60 transition-colors text-white text-[10px] px-2 py-0.5 backdrop-blur-sm">
                      {loupeZoom}x
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {loupeEnabled ? "Hover over image to inspect" : "Loupe is disabled"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Standalone Color & Pixel Info */}
            <div className="space-y-3">
              <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 p-3 shadow-sm">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Pixel Sample
                </span>
                
                {sample ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="h-8 w-8 rounded-md shadow-inner border border-white/20"
                        style={{ backgroundColor: sample.hex }}
                      />
                      <div>
                        <div className="text-xs font-bold font-mono text-slate-900 dark:text-white uppercase">
                          {sample.hex}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          RGB({sample.r}, {sample.g}, {sample.b})
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50 grid grid-cols-3 gap-2">
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase mb-0.5">X coord</span>
                        <span className="text-xs font-mono font-medium">{sample.x}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase mb-0.5">Y coord</span>
                        <span className="text-xs font-mono font-medium">{sample.y}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase mb-0.5">Alpha</span>
                        <span className="text-xs font-mono font-medium">{sample.a}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-16 flex items-center justify-center text-[11px] text-slate-400 italic">
                    Sample pixels...
                  </div>
                )}
              </div>

              {/* Tools info (compact) */}
              <div className="px-1 space-y-3">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Channel</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                    {previewChannelMode === "all" ? "RGB" : previewChannelMode}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Simulation</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                    {colorBlindMode === "none" ? "Normal" : colorBlindMode}
                  </span>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </BaseDialog>
  )
}
