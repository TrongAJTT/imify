import React, { createContext, useCallback, useContext, useState, type ReactNode } from "react"
import type { LayerGroup, TextLayer, VectorLayer } from "./types"
import { regenerateLayerShapePoints } from "./shape-generators"

interface EditorContextValue {
  editorLayers: VectorLayer[]
  setEditorLayers: (layers: VectorLayer[] | ((prev: VectorLayer[]) => VectorLayer[])) => void
  editorTextLayers: TextLayer[]
  setEditorTextLayers: (layers: TextLayer[] | ((prev: TextLayer[]) => TextLayer[])) => void
  selectedLayerId: string | null
  selectedLayerIds: string[]
  selectedTextLayerId: string | null
  setSelectedLayerId: (id: string | null) => void
  setSelectedTextLayerId: (id: string | null) => void
  toggleSelectedLayerId: (id: string) => void
  setSelectedLayerIds: (ids: string[]) => void
  clearSelectedLayers: () => void
  updateLayer: (id: string, partial: Partial<VectorLayer>) => void
  updateTextLayer: (id: string, partial: Partial<TextLayer>) => void
  editorGroups: LayerGroup[]
  setEditorGroups: (groups: LayerGroup[] | ((prev: LayerGroup[]) => LayerGroup[])) => void
  canvasWidth: number
  canvasHeight: number
  setCanvasSize: (width: number, height: number) => void
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function EditorProvider({ children }: { children: ReactNode }) {
  const [editorLayers, setEditorLayers] = useState<VectorLayer[]>([])
  const [editorTextLayers, setEditorTextLayers] = useState<TextLayer[]>([])
  const [editorGroups, setEditorGroups] = useState<LayerGroup[]>([])
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [selectedLayerIds, setSelectedLayerIdsState] = useState<string[]>([])
  const [selectedTextLayerId, setSelectedTextLayerIdState] = useState<string | null>(null)
  const [canvasWidth, setCanvasWidth] = useState(1920)
  const [canvasHeight, setCanvasHeight] = useState(1080)

  const setSelectedLayerIds = useCallback((ids: string[]) => {
    const uniqueIds = Array.from(new Set(ids))
    setSelectedLayerIdsState(uniqueIds)
    setSelectedLayerId(uniqueIds[uniqueIds.length - 1] ?? null)
    if (uniqueIds.length > 0) {
      setSelectedTextLayerIdState(null)
    }
  }, [])

  const clearSelectedLayers = useCallback(() => {
    setSelectedLayerIdsState([])
    setSelectedLayerId(null)
    setSelectedTextLayerIdState(null)
  }, [])

  const toggleSelectedLayerId = useCallback((id: string) => {
    setSelectedLayerIdsState((prev) => {
      const exists = prev.includes(id)
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id]
      setSelectedLayerId(next[next.length - 1] ?? null)
      if (next.length > 0) {
        setSelectedTextLayerIdState(null)
      }
      return next
    })
  }, [])

  const setSelectedLayerIdWithSync = useCallback((id: string | null) => {
    setSelectedLayerId(id)
    setSelectedLayerIdsState(id ? [id] : [])
    if (id) {
      setSelectedTextLayerIdState(null)
    }
  }, [])

  const setSelectedTextLayerIdWithSync = useCallback((id: string | null) => {
    setSelectedTextLayerIdState(id)
    if (id) {
      setSelectedLayerId(null)
      setSelectedLayerIdsState([])
    }
  }, [])

  const updateLayer = useCallback((id: string, partial: Partial<VectorLayer>) => {
    setEditorLayers((prev) =>
      prev.map((layer) => {
        if (layer.id !== id) return layer

        const nextLayer: VectorLayer = { ...layer, ...partial }
        const needsRegeneratePoints =
          partial.width !== undefined ||
          partial.height !== undefined ||
          partial.shapeType !== undefined
        if (needsRegeneratePoints) {
          nextLayer.points = regenerateLayerShapePoints(nextLayer, nextLayer.width, nextLayer.height)
        }
        return nextLayer
      })
    )
  }, [])

  const updateTextLayer = useCallback((id: string, partial: Partial<TextLayer>) => {
    setEditorTextLayers((prev) =>
      prev.map((layer) => {
        if (layer.id !== id) return layer
        return { ...layer, ...partial }
      })
    )
  }, [])

  const setCanvasSize = useCallback((width: number, height: number) => {
    setCanvasWidth(Math.max(1, Math.round(width)))
    setCanvasHeight(Math.max(1, Math.round(height)))
  }, [])

  return (
    <EditorContext.Provider
      value={{
        editorLayers,
        setEditorLayers,
        editorTextLayers,
        setEditorTextLayers,
        selectedLayerId,
        selectedLayerIds,
        selectedTextLayerId,
        setSelectedLayerId: setSelectedLayerIdWithSync,
        setSelectedTextLayerId: setSelectedTextLayerIdWithSync,
        toggleSelectedLayerId,
        setSelectedLayerIds,
        clearSelectedLayers,
        updateLayer,
        updateTextLayer,
        editorGroups,
        setEditorGroups,
        canvasWidth,
        canvasHeight,
        setCanvasSize,
      }}
    >
      {children}
    </EditorContext.Provider>
  )
}

const NOOP_CONTEXT: EditorContextValue = {
  editorLayers: [],
  setEditorLayers: () => {},
  editorTextLayers: [],
  setEditorTextLayers: () => {},
  selectedLayerId: null,
  selectedLayerIds: [],
  selectedTextLayerId: null,
  setSelectedLayerId: () => {},
  setSelectedTextLayerId: () => {},
  toggleSelectedLayerId: () => {},
  setSelectedLayerIds: () => {},
  clearSelectedLayers: () => {},
  updateLayer: () => {},
  updateTextLayer: () => {},
  editorGroups: [],
  setEditorGroups: () => {},
  canvasWidth: 1920,
  canvasHeight: 1080,
  setCanvasSize: () => {},
}

export function useEditorContext(): EditorContextValue {
  const ctx = useContext(EditorContext)
  return ctx ?? NOOP_CONTEXT
}

export function useEditorContextSafe(): EditorContextValue | null {
  return useContext(EditorContext)
}

