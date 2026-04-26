import React, { useEffect, useMemo, useRef, useState } from "react"
import { AnimatingSpinner } from "@imify/ui"
import { usePanDrag } from "../shared/use-pan-drag"
import { ZoomPanControl } from "@imify/ui"
import type { PreviewInteractionMode } from "@imify/ui"
import type { SplitterSplitPlan, SplitterSplitSettings } from "./types"
import { hasFileDragPayload } from "../shared/image-file-utils"

interface SplitterPreviewProps {
  image: {
    name: string
    previewUrl: string
    width: number
    height: number
  } | null
  plan: SplitterSplitPlan | null
  warningText?: string | null
  onDropFiles?: (files: FileList | null) => void
  isComputing?: boolean
  previewInteractionMode?: PreviewInteractionMode
  splitSettings?: SplitterSplitSettings
  onBasicGuideChange?: (axis: "x" | "y", value: number) => void
}

export function SplitterPreview({
  image,
  plan,
  warningText,
  onDropFiles,
  isComputing = false,
  previewInteractionMode = "zoom",
  splitSettings,
  onBasicGuideChange
}: SplitterPreviewProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [containerHeight, setContainerHeight] = useState(620)
  const [isResizing, setIsResizing] = useState(false)
  const previewFrameRef = useRef<HTMLDivElement>(null)
  const guideBoxRef = useRef<HTMLDivElement>(null)
  const dragAxisRef = useRef<"x" | "y" | null>(null)
  const [frameWidth, setFrameWidth] = useState(0)
  const { pan, setPan, handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel } = usePanDrag({
    enabled: previewInteractionMode === "pan",
    onlyWhenZoomed: false,
    currentZoom: zoom
  })

  if (!image) {
    return null
  }

  const xCuts = plan?.xCuts.slice(1, -1) ?? []
  const yCuts = plan?.yCuts.slice(1, -1) ?? []
  const isAutoSpriteMode =
    splitSettings?.mode === "advanced" && splitSettings.advancedMethod === "auto_sprite"
  const firstXCut = xCuts[0] ?? null
  const firstYCut = yCuts[0] ?? null
  const canDragXGuide =
    splitSettings?.mode === "basic" &&
    (splitSettings.direction === "vertical" || splitSettings.direction === "grid") &&
    firstXCut != null
  const canDragYGuide =
    splitSettings?.mode === "basic" &&
    (splitSettings.direction === "horizontal" || splitSettings.direction === "grid") &&
    firstYCut != null
  const renderedImageBox = useMemo(() => {
    const safeHeight = Math.max(1, containerHeight)
    const safeWidth = Math.max(1, frameWidth)
    const imageAspect = Math.max(1, image.width) / Math.max(1, image.height)
    const frameAspect = safeWidth / safeHeight

    if (frameAspect > imageAspect) {
      return {
        width: Math.round(safeHeight * imageAspect),
        height: safeHeight
      }
    }

    return {
      width: safeWidth,
      height: Math.round(safeWidth / imageAspect)
    }
  }, [containerHeight, frameWidth, image.height, image.width])
  const guideColor = splitSettings?.guideColor?.trim() || "#06b6d4"

  useEffect(() => {
    if (!isResizing) {
      return
    }

    const handleMouseMove = (event: MouseEvent) => {
      const frame = previewFrameRef.current
      if (!frame) {
        return
      }
      const rect = frame.getBoundingClientRect()
      const nextHeight = Math.max(240, Math.round(event.clientY - rect.top))
      setContainerHeight(nextHeight)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing])

  useEffect(() => {
    const frame = previewFrameRef.current
    if (!frame) {
      return
    }

    const syncFrameWidth = () => {
      setFrameWidth(frame.clientWidth)
    }

    syncFrameWidth()
    const observer = new ResizeObserver(syncFrameWidth)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const axis = dragAxisRef.current
      const guideBox = guideBoxRef.current
      if (!axis || !guideBox || !onBasicGuideChange) {
        return
      }

      const rect = guideBox.getBoundingClientRect()
      if (axis === "x") {
        const relative = Math.max(1, Math.min(rect.width - 1, event.clientX - rect.left))
        const sourceValue = Math.round((relative / rect.width) * image.width)
        onBasicGuideChange("x", sourceValue)
        return
      }

      const relative = Math.max(1, Math.min(rect.height - 1, event.clientY - rect.top))
      const sourceValue = Math.round((relative / rect.height) * image.height)
      onBasicGuideChange("y", sourceValue)
    }

    const handleUp = () => {
      dragAxisRef.current = null
    }

    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", handleUp)
    window.addEventListener("pointercancel", handleUp)
    return () => {
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", handleUp)
      window.removeEventListener("pointercancel", handleUp)
    }
  }, [image.height, image.width, onBasicGuideChange])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="truncate">Preview: {image.name}</span>
        <span>{plan?.rects.length ?? 0} slices</span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-100 p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <div
          ref={previewFrameRef}
          className={`relative mx-auto overflow-hidden rounded-lg border bg-white dark:bg-slate-950 ${
            isDragOver
              ? "border-cyan-500 ring-2 ring-cyan-300/60 dark:ring-cyan-700/60"
              : "border-slate-300 dark:border-slate-700"
          }`}
          style={{
            width: "100%",
            height: `${containerHeight}px`
          }}
          onWheel={(event) => {
            if (previewInteractionMode === "idle") {
              return
            }

            if (event.cancelable) {
              event.preventDefault()
            }

            if (previewInteractionMode === "pan") {
              const delta = event.deltaY > 0 ? 50 : -50
              if (event.shiftKey) {
                setPan((current) => ({ ...current, x: current.x - delta }))
                return
              }
              setPan((current) => ({ ...current, y: current.y - delta }))
              return
            }

            setZoom((current) => {
              const next = current + (event.deltaY > 0 ? -10 : 10)
              return Math.max(50, Math.min(10000, Math.round(next)))
            })
          }}
          onDragOver={(event) => {
            if (!onDropFiles) {
              return
            }
            if (!hasFileDragPayload(event.dataTransfer)) {
              return
            }
            event.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => {
            if (!onDropFiles) {
              return
            }
            setIsDragOver(false)
          }}
          onDrop={(event) => {
            if (!onDropFiles) {
              return
            }
            if (!hasFileDragPayload(event.dataTransfer)) {
              return
            }
            event.preventDefault()
            setIsDragOver(false)
            onDropFiles(event.dataTransfer.files)
          }}
        >
          <div className="relative h-full w-full overflow-hidden">
            <div
              className="relative h-full w-full flex items-center justify-center"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
                transformOrigin: "center center",
                cursor:
                  previewInteractionMode === "pan"
                    ? "grab"
                    : previewInteractionMode === "idle"
                      ? "default"
                      : "zoom-in"
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
            >
              <div
                ref={guideBoxRef}
                className="relative overflow-hidden"
                style={{
                  width: `${Math.max(1, renderedImageBox.width)}px`,
                  height: `${Math.max(1, renderedImageBox.height)}px`
                }}
              >
                <img
                  src={image.previewUrl}
                  alt={image.name}
                  className="h-full w-full object-fill"
                  draggable={false}
                />

                <div className="pointer-events-none absolute inset-0">
                  {isAutoSpriteMode
                    ? (plan?.rects ?? []).map((rect) => (
                        <div
                          key={`sprite_${rect.index}_${rect.x}_${rect.y}`}
                          className="absolute border"
                          style={{
                            left: `${(rect.x / image.width) * 100}%`,
                            top: `${(rect.y / image.height) * 100}%`,
                            width: `${(rect.width / image.width) * 100}%`,
                            height: `${(rect.height / image.height) * 100}%`,
                            borderColor: guideColor
                          }}
                        />
                      ))
                    : null}

                  {!isAutoSpriteMode
                    ? xCuts.map((cut) => (
                        <div
                          key={`x_${cut}`}
                          className="absolute top-0 bottom-0 w-px"
                          style={{
                            left: `${(cut / image.width) * 100}%`,
                            backgroundColor: guideColor
                          }}
                        />
                      ))
                    : null}

                  {!isAutoSpriteMode
                    ? yCuts.map((cut) => (
                        <div
                          key={`y_${cut}`}
                          className="absolute left-0 right-0 h-px"
                          style={{
                            top: `${(cut / image.height) * 100}%`,
                            backgroundColor: guideColor
                          }}
                        />
                      ))
                    : null}
                </div>
                {canDragXGuide ? (
                  <button
                    type="button"
                    className="absolute top-0 bottom-0 z-20 w-3 -translate-x-1/2 cursor-ew-resize bg-transparent"
                    style={{ left: `${(firstXCut / image.width) * 100}%` }}
                    onPointerDown={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      dragAxisRef.current = "x"
                    }}
                    aria-label="Adjust first vertical guide"
                  />
                ) : null}
                {canDragYGuide ? (
                  <button
                    type="button"
                    className="absolute left-0 right-0 z-20 h-3 -translate-y-1/2 cursor-ns-resize bg-transparent"
                    style={{ top: `${(firstYCut / image.height) * 100}%` }}
                    onPointerDown={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      dragAxisRef.current = "y"
                    }}
                    aria-label="Adjust first horizontal guide"
                  />
                ) : null}
              </div>
            </div>
          </div>

          {isDragOver ? (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-cyan-500/15 text-sm font-semibold text-cyan-700 dark:text-cyan-300">
              Drop images to import
            </div>
          ) : null}

          {isComputing ? (
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/90 bg-white/95 px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur dark:border-slate-600/90 dark:bg-slate-900/90 dark:text-slate-200">
                <AnimatingSpinner size={12} />
                Computing split preview...
              </div>
            </div>
          ) : null}

          <ZoomPanControl
            zoom={zoom}
            panX={pan.x}
            panY={pan.y}
            onZoomChange={(value) => setZoom(Math.max(50, Math.min(10000, value)))}
            onPanChange={(x, y) => setPan({ x, y })}
            minZoom={50}
            maxZoom={10000}
          />

          <div
            onMouseDown={(event) => {
              event.preventDefault()
              setIsResizing(true)
            }}
            className={`absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize transition-colors ${
              isResizing ? "bg-sky-500" : "bg-slate-300 hover:bg-sky-400 dark:bg-slate-600 dark:hover:bg-sky-500"
            }`}
          />
        </div>
      </div>

      {warningText ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300">
          {warningText}
        </div>
      ) : null}
    </div>
  )
}



