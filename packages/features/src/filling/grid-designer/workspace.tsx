"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Stage } from "react-konva"
import type Konva from "konva"
import { ChevronDown, Save } from "lucide-react"
import { Button, PreviewInteractionModeToggle, ZoomPanControl } from "@imify/ui"
import { ControlledPopover } from "@imify/ui/ui/controlled-popover"
import { MutedText, Subheading } from "@imify/ui/ui/typography"
import type { PreviewInteractionMode } from "@imify/ui/ui/preview-interaction-mode-toggle"
import { useFillingStore } from "@imify/stores/stores/filling-store"
import { useShortcutPreferences } from "@imify/stores/use-shortcut-preferences"
import { useShortcutActions } from "../use-shortcut-actions"
import { parseGridDesign, generateGridLayers } from "./generator"
import { GridDesignCanvasLayer } from "./canvas-layer"
import { templateStorage } from "../template-storage"
import type { FillingTemplate } from "../types"
import { DEFAULT_GRID_DESIGN_PARAMS } from "../types"

const CANVAS_PADDING = 40
const PREVIEW_MIN_ZOOM = 50
const PREVIEW_MAX_ZOOM = 10000
const PREVIEW_ZOOM_STEP = 10

interface GridDesignWorkspaceProps {
  template: FillingTemplate
  onRefresh: () => Promise<void>
  onSaved?: (template: FillingTemplate, destination: "fill" | "edit" | "list") => void | Promise<void>
}

export function GridDesignWorkspace({ template, onRefresh, onSaved }: GridDesignWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [previewZoom, setPreviewZoom] = useState(100)
  const [previewPan, setPreviewPan] = useState({ x: 0, y: 0 })
  const [previewInteractionMode, setPreviewInteractionMode] = useState<PreviewInteractionMode>("zoom")
  const params = useFillingStore((state) => state.gridDesignParams)
  const setGridDesignParams = useFillingStore((state) => state.setGridDesignParams)
  const setGridLayerCount = useFillingStore((state) => state.setGridLayerCount)
  const updateTemplate = useFillingStore((state) => state.updateTemplate)
  const { getShortcutLabel } = useShortcutPreferences()
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setGridDesignParams(template.gridDesignParams ?? { ...DEFAULT_GRID_DESIGN_PARAMS })
  }, [setGridDesignParams, template.gridDesignParams, template.id])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) {
        return
      }

      setStageSize({
        width: Math.floor(entry.contentRect.width),
        height: Math.max(400, Math.floor(entry.contentRect.height)),
      })
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useShortcutActions([
    { actionId: "global.preview.zoom_mode", handler: () => setPreviewInteractionMode("zoom") },
    { actionId: "global.preview.pan_mode", handler: () => setPreviewInteractionMode("pan") },
    { actionId: "global.preview.idle_mode", handler: () => setPreviewInteractionMode("idle") },
  ])

  const activeParams = params ?? template.gridDesignParams ?? { ...DEFAULT_GRID_DESIGN_PARAMS }
  const parseResult = useMemo(
    () => parseGridDesign(activeParams, template.canvasWidth, template.canvasHeight),
    [activeParams, template.canvasHeight, template.canvasWidth]
  )

  useEffect(() => {
    setGridLayerCount(parseResult.layoutCells.length)
  }, [parseResult.layoutCells.length, setGridLayerCount])

  const fitScale = useMemo(() => {
    const availW = stageSize.width - CANVAS_PADDING * 2
    const availH = stageSize.height - CANVAS_PADDING * 2
    return Math.min(1, availW / template.canvasWidth, availH / template.canvasHeight)
  }, [stageSize, template.canvasHeight, template.canvasWidth])

  const clampPreviewZoom = useCallback((value: number) => {
    return Math.max(PREVIEW_MIN_ZOOM, Math.min(PREVIEW_MAX_ZOOM, Math.round(value)))
  }, [])

  const handlePreviewWheel = useCallback((event: WheelEvent) => {
    const target = event.target as HTMLElement | null
    if (target?.closest('[class*="pointer-events-auto"]')) {
      return
    }
    if (previewInteractionMode === "idle") {
      return
    }
    if (event.cancelable) {
      event.preventDefault()
    }

    if (previewInteractionMode === "pan") {
      const delta = event.deltaY > 0 ? 50 : -50
      if (event.shiftKey) {
        setPreviewPan((current) => ({ ...current, x: current.x - delta }))
      } else {
        setPreviewPan((current) => ({ ...current, y: current.y - delta }))
      }
      return
    }

    const oldZoom = previewZoom
    const nextZoom = clampPreviewZoom(oldZoom + (event.deltaY > 0 ? -PREVIEW_ZOOM_STEP : PREVIEW_ZOOM_STEP))
    if (nextZoom === oldZoom) {
      return
    }

    const oldRenderScale = fitScale * (oldZoom / 100)
    const newRenderScale = fitScale * (nextZoom / 100)
    const container = containerRef.current
    if (!container || oldRenderScale <= 0 || newRenderScale <= 0) {
      setPreviewZoom(nextZoom)
      return
    }

    const rect = container.getBoundingClientRect()
    const pointerX = event.clientX - rect.left
    const pointerY = event.clientY - rect.top
    const baseOffsetOldX = (stageSize.width - template.canvasWidth * oldRenderScale) / 2
    const baseOffsetOldY = (stageSize.height - template.canvasHeight * oldRenderScale) / 2
    const worldX = (pointerX - baseOffsetOldX - previewPan.x) / oldRenderScale
    const worldY = (pointerY - baseOffsetOldY - previewPan.y) / oldRenderScale
    const baseOffsetNewX = (stageSize.width - template.canvasWidth * newRenderScale) / 2
    const baseOffsetNewY = (stageSize.height - template.canvasHeight * newRenderScale) / 2

    setPreviewZoom(nextZoom)
    setPreviewPan({
      x: Math.round((pointerX - baseOffsetNewX - worldX * newRenderScale) * 100) / 100,
      y: Math.round((pointerY - baseOffsetNewY - worldY * newRenderScale) * 100) / 100,
    })
  }, [
    clampPreviewZoom,
    fitScale,
    previewInteractionMode,
    previewPan.x,
    previewPan.y,
    previewZoom,
    stageSize.height,
    stageSize.width,
    template.canvasHeight,
    template.canvasWidth,
  ])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    container.addEventListener("wheel", handlePreviewWheel, { passive: false })
    return () => container.removeEventListener("wheel", handlePreviewWheel)
  }, [handlePreviewWheel])

  const renderScale = fitScale * (previewZoom / 100)
  const offsetX = (stageSize.width - template.canvasWidth * renderScale) / 2 + previewPan.x
  const offsetY = (stageSize.height - template.canvasHeight * renderScale) / 2 + previewPan.y

  const buildUpdatedTemplate = useCallback((): FillingTemplate => {
    return {
      ...template,
      layers: generateGridLayers(activeParams, template.canvasWidth, template.canvasHeight),
      gridDesignParams: activeParams,
      updatedAt: Date.now(),
    }
  }, [activeParams, template])

  const handleSaveToDestination = useCallback(
    async (destination: "fill" | "edit" | "list") => {
      if (isSaving) {
        return
      }

      setIsSaving(true)
      try {
        const updated = buildUpdatedTemplate()
        await templateStorage.save(updated)
        updateTemplate(updated)
        await onRefresh()
        if (onSaved) {
          await onSaved(updated, destination)
        }
      } finally {
        setIsSaving(false)
      }
    },
    [buildUpdatedTemplate, isSaving, onRefresh, onSaved, updateTemplate]
  )

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const synced = buildUpdatedTemplate()
      updateTemplate(synced)
      void templateStorage.save(synced)
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [buildUpdatedTemplate, updateTemplate])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Subheading>Grid Designer</Subheading>
          <MutedText className="mt-0.5 text-xs">
            {parseResult.layoutCells.length} cell{parseResult.layoutCells.length !== 1 ? "s" : ""} generated &middot;{" "}
            {template.canvasWidth} x {template.canvasHeight} px
          </MutedText>
        </div>

        <div className="flex items-center gap-3">
          <PreviewInteractionModeToggle
            mode={previewInteractionMode}
            onChange={setPreviewInteractionMode}
            zoomKeyHint={getShortcutLabel("global.preview.zoom_mode")}
            panKeyHint={getShortcutLabel("global.preview.pan_mode")}
            idleKeyHint={getShortcutLabel("global.preview.idle_mode")}
          />
          <div className="flex items-center">
            <Button
              variant="primary"
              size="sm"
              disabled={isSaving}
              className="rounded-r-none px-2"
              onClick={() => void handleSaveToDestination("fill")}
            >
              <Save size={14} />
              Save & Fill
            </Button>
            <ControlledPopover
              preset="dropdown"
              side="bottom"
              align="end"
              sideOffset={6}
              collisionPadding={10}
              trigger={
                <Button
                  variant="primary"
                  size="sm"
                  aria-label="Open save actions"
                  disabled={isSaving}
                  className="rounded-l-none border-l border-sky-400/60 px-2"
                >
                  <ChevronDown size={14} />
                </Button>
              }
              contentClassName="z-[9999] min-w-[170px] rounded-md border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"
              closeOnContentClick
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => void handleSaveToDestination("edit")}
              >
                <Save size={14} />
                Save & Edit
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => void handleSaveToDestination("list")}
              >
                <Save size={14} />
                Save & Back to list
              </button>
            </ControlledPopover>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50"
        style={{ minHeight: 400 }}
      >
        <Stage ref={stageRef} width={stageSize.width} height={stageSize.height}>
          <GridDesignCanvasLayer
            canvasWidth={template.canvasWidth}
            canvasHeight={template.canvasHeight}
            offsetX={offsetX}
            offsetY={offsetY}
            renderScale={renderScale}
            cells={parseResult.layoutCells}
          />
        </Stage>
        <ZoomPanControl
          zoom={previewZoom}
          panX={previewPan.x}
          panY={previewPan.y}
          onZoomChange={setPreviewZoom}
          onPanChange={(x, y) => setPreviewPan({ x, y })}
          minZoom={PREVIEW_MIN_ZOOM}
          maxZoom={PREVIEW_MAX_ZOOM}
        />
      </div>
    </div>
  )
}
