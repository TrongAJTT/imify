import { useEffect, useRef, useState } from "react"
import { useInspectorStore } from "@/options/stores/inspector-store"
import { BaseDialog } from "@/options/components/ui/base-dialog"
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

  const LOUPE_SIZE = 128
  const LOUPE_SAMPLE_SIZE = 14

  useEffect(() => {
    if (!sample || !loupeEnabled || !isReady) return

    const loupeCanvas = loupeCanvasRef.current
    if (!loupeCanvas) return

    loupeCanvas.width = LOUPE_SIZE
    loupeCanvas.height = LOUPE_SIZE
    const loupeCtx = loupeCanvas.getContext("2d")
    if (!loupeCtx) return

    // Re-create loupe rendering logic from InteractivePreview but for this standalone canvas
    const img = new Image()
    img.src = imageUrl
    img.onload = () => {
      const MAX_PREVIEW_EDGE = 1600
      const scale = Math.min(1, MAX_PREVIEW_EDGE / Math.max(img.width, img.height))
      const width = Math.max(1, Math.round(img.width * scale))
      const height = Math.max(1, Math.round(img.height * scale))

      const tempCanvas = new OffscreenCanvas(width, height)
      const tempCtx = tempCanvas.getContext("2d")!
      tempCtx.drawImage(img, 0, 0, width, height)
      
      const effectiveSampleSize = Math.max(4, Math.round((LOUPE_SAMPLE_SIZE * 8) / Math.max(2, loupeZoom)))
      const half = Math.floor(effectiveSampleSize / 2)
      
      const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
      const sx = clamp(sample.x - half, 0, Math.max(0, width - effectiveSampleSize))
      const sy = clamp(sample.y - half, 0, Math.max(0, height - effectiveSampleSize))

      loupeCtx.clearRect(0, 0, LOUPE_SIZE, LOUPE_SIZE)
      loupeCtx.imageSmoothingEnabled = false
      loupeCtx.drawImage(
        tempCanvas,
        sx,
        sy,
        effectiveSampleSize,
        effectiveSampleSize,
        0,
        0,
        LOUPE_SIZE,
        LOUPE_SIZE
      )

      loupeCtx.strokeStyle = "rgba(255,255,255,0.9)"
      loupeCtx.lineWidth = 1
      loupeCtx.beginPath()
      loupeCtx.moveTo(LOUPE_SIZE / 2, 0)
      loupeCtx.lineTo(LOUPE_SIZE / 2, LOUPE_SIZE)
      loupeCtx.moveTo(0, LOUPE_SIZE / 2)
      loupeCtx.lineTo(LOUPE_SIZE, LOUPE_SIZE / 2)
      loupeCtx.stroke()
    }
  }, [sample, loupeEnabled, loupeZoom, isReady, imageUrl])

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      contentClassName="w-[95%] h-[90%] max-w-7xl rounded-md p-8"
    >
      <div className="flex flex-col h-full gap-6">
        <div className="flex-1 flex gap-8 min-h-0">
          {/* Left side: Image */}
          <div className="flex-1 flex-col flex items-center justify-center overflow-auto bg-slate-50/50 dark:bg-slate-950/20 rounded-md border border-dashed border-slate-200 dark:border-slate-800">
            {/* <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 px-1">
              Visual Inspection
            </h3> */}
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
            />
          </div>

          {/* Right side: Standalone Loupe and Sample info */}
          <div className="w-64 flex flex-col gap-6 overflow-y-auto pr-2">
            <div>
              
              {/* Standalone Loupe */}
              <div className="relative aspect-square w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-950 flex flex-col items-center justify-center overflow-hidden shadow-sm">
                {loupeEnabled && isReady && sample ? (
                  <>
                    <canvas
                      ref={loupeCanvasRef}
                      style={{ imageRendering: "pixelated", width: "100%", height: "100%" }}
                    />
                    <div className="absolute bottom-2 right-2 rounded-md bg-slate-900/60 transition-colors text-white text-[10px] px-2 py-0.5 backdrop-blur-sm">
                      {loupeZoom}x
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <p className="text-xs text-slate-500">
                      {loupeEnabled ? "Hover over image to inspect" : "Loupe is disabled"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Standalone Color & Pixel Info */}
            <div className="space-y-4">
              <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 p-4 shadow-sm">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Pixel Sample
                </span>
                
                {sample ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-md shadow-inner border border-white/20"
                        style={{ backgroundColor: sample.hex }}
                      />
                      <div>
                        <div className="text-sm font-bold font-mono text-slate-900 dark:text-white uppercase">
                          {sample.hex}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          RGB({sample.r}, {sample.g}, {sample.b})
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 grid grid-cols-2 gap-4">
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
                  <div className="h-24 flex items-center justify-center text-[11px] text-slate-400 italic">
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

              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700/50 px-1">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
                  Move mouse over image to analyze. Adjust modes in Display Accordion.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseDialog>
  )
}
