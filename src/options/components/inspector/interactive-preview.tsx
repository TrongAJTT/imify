import { useEffect, useMemo, useRef, useState } from "react"
import type { ColorBlindMode, PreviewChannelMode } from "@/features/inspector"
import { rgbToHex, transformPixelForPreview } from "@/features/inspector"

export type PixelSample = {
  x: number
  y: number
  r: number
  g: number
  b: number
  a: number
  hex: string
}

interface InteractivePreviewProps {
  imageUrl: string
  alt: string
  channelMode: PreviewChannelMode
  colorBlindMode: ColorBlindMode
  loupeEnabled: boolean
  loupeZoom: number
  onSampleChange?: (sample: PixelSample | null) => void
  isReady?: boolean
  onReadyChange?: (ready: boolean) => void
  hideOverlays?: boolean
}

const MAX_PREVIEW_EDGE = 1600
const LOUPE_SIZE = 112
const LOUPE_SAMPLE_SIZE = 14

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function InteractivePreview({
  imageUrl,
  alt,
  channelMode,
  colorBlindMode,
  loupeEnabled,
  loupeZoom,
  onSampleChange,
  onReadyChange,
  hideOverlays = false
}: InteractivePreviewProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const loupeCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const transformedDataRef = useRef<Uint8ClampedArray | null>(null)
  const [sample, setSampleState] = useState<PixelSample | null>(null)
  const [isReady, setIsReady] = useState(false)

  const setSample = (s: PixelSample | null) => {
    setSampleState(s)
    onSampleChange?.(s)
  }

  useEffect(() => {
    onReadyChange?.(isReady)
  }, [isReady, onReadyChange])

  const modeLabel = useMemo(() => {
    const channelText =
      channelMode === "all"
        ? "RGB"
        : channelMode === "red"
        ? "R"
        : channelMode === "green"
        ? "G"
        : channelMode === "blue"
        ? "B"
        : "Alpha"

    const simulationText =
      colorBlindMode === "none"
        ? "Normal"
        : colorBlindMode === "protanopia"
        ? "Protanopia"
        : colorBlindMode === "deuteranopia"
        ? "Deuteranopia"
        : "Tritanopia"

    return `${channelText} • ${simulationText}`
  }, [channelMode, colorBlindMode])

  useEffect(() => {
    let cancelled = false

    const image = new Image()
    image.decoding = "async"

    image.onload = () => {
      if (cancelled) {
        return
      }

      const previewCanvas = previewCanvasRef.current
      if (!previewCanvas) {
        return
      }

      const scale = Math.min(1, MAX_PREVIEW_EDGE / Math.max(image.width, image.height))
      const width = Math.max(1, Math.round(image.width * scale))
      const height = Math.max(1, Math.round(image.height * scale))

      previewCanvas.width = width
      previewCanvas.height = height

      const previewCtx = previewCanvas.getContext("2d")
      if (!previewCtx) {
        setIsReady(false)
        return
      }

      previewCtx.imageSmoothingEnabled = true
      previewCtx.drawImage(image, 0, 0, width, height)

      const imageData = previewCtx.getImageData(0, 0, width, height)
      const transformed = imageData.data.slice(0)

      for (let index = 0; index < transformed.length; index += 4) {
        const [r, g, b, a] = transformPixelForPreview(
          transformed[index],
          transformed[index + 1],
          transformed[index + 2],
          transformed[index + 3],
          channelMode,
          colorBlindMode
        )

        transformed[index] = r
        transformed[index + 1] = g
        transformed[index + 2] = b
        transformed[index + 3] = a
      }

      transformedDataRef.current = transformed
      const transformedImageData = new ImageData(transformed, width, height)
      previewCtx.putImageData(transformedImageData, 0, 0)
      setIsReady(true)
      setSample(null)
    }

    image.onerror = () => {
      if (!cancelled) {
        setIsReady(false)
      }
    }

    image.src = imageUrl

    return () => {
      cancelled = true
    }
  }, [imageUrl, channelMode, colorBlindMode])

  useEffect(() => {
    if (!sample || !loupeEnabled) {
      return
    }

    const previewCanvas = previewCanvasRef.current
    const loupeCanvas = loupeCanvasRef.current
    if (!previewCanvas || !loupeCanvas) {
      return
    }

    loupeCanvas.width = LOUPE_SIZE
    loupeCanvas.height = LOUPE_SIZE
    const loupeCtx = loupeCanvas.getContext("2d")
    if (!loupeCtx) {
      return
    }

    const effectiveSampleSize = Math.max(4, Math.round((LOUPE_SAMPLE_SIZE * 8) / Math.max(2, loupeZoom)))
    const half = Math.floor(effectiveSampleSize / 2)
    const sx = clamp(sample.x - half, 0, Math.max(0, previewCanvas.width - effectiveSampleSize))
    const sy = clamp(sample.y - half, 0, Math.max(0, previewCanvas.height - effectiveSampleSize))

    loupeCtx.clearRect(0, 0, LOUPE_SIZE, LOUPE_SIZE)
    loupeCtx.imageSmoothingEnabled = false
    loupeCtx.drawImage(
      previewCanvas,
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
  }, [sample, loupeEnabled, loupeZoom])

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = previewCanvasRef.current
    const transformed = transformedDataRef.current

    if (!canvas || !transformed) {
      return
    }

    const rect = canvas.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) {
      return
    }

    const x = clamp(
      Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width),
      0,
      canvas.width - 1
    )
    const y = clamp(
      Math.floor(((event.clientY - rect.top) / rect.height) * canvas.height),
      0,
      canvas.height - 1
    )

    const index = (y * canvas.width + x) * 4
    const r = transformed[index]
    const g = transformed[index + 1]
    const b = transformed[index + 2]
    const a = transformed[index + 3]

    setSample({
      x,
      y,
      r,
      g,
      b,
      a,
      hex: rgbToHex(r, g, b)
    })
  }

  return (
    <div className="relative flex items-center justify-center mb-3" style={{ maxHeight: 280 }}>
      <canvas
        ref={previewCanvasRef}
        aria-label={alt}
        className="max-w-full max-h-[260px] w-auto h-auto rounded border border-slate-200/80 dark:border-slate-700/70 bg-slate-100/80 dark:bg-slate-900/60"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setSample(null)}
      />

      {!hideOverlays && (
        <div className="absolute top-2 left-2 rounded-md bg-slate-900/70 text-white text-[10px] px-2 py-1 backdrop-blur-sm">
          {modeLabel}
        </div>
      )}

      {!hideOverlays && loupeEnabled && isReady && sample && (
        <div className="absolute top-2 right-2 rounded-md border border-slate-300/70 dark:border-slate-700/70 bg-slate-950/70 p-1 backdrop-blur-sm">
          <canvas
            ref={loupeCanvasRef}
            style={{ imageRendering: "pixelated" }}
            className="rounded"
          />
          <div className="mt-1 text-[10px] text-white/90 text-center">{loupeZoom}x loupe</div>
        </div>
      )}

      {!hideOverlays && sample && (
        <div className="absolute bottom-2 left-2 rounded-md bg-slate-900/78 text-white text-[10px] px-2 py-1.5 backdrop-blur-sm leading-tight">
          <div className="font-semibold">{sample.hex}</div>
          <div>
            RGB({sample.r}, {sample.g}, {sample.b}) • A {sample.a}
          </div>
          <div className="text-white/80">
            Pixel ({sample.x}, {sample.y})
          </div>
        </div>
      )}
    </div>
  )
}
