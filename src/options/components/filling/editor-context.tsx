import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { LayerGroup, VectorLayer } from "@/features/filling/types"
import { regenerateLayerShapePoints } from "@/features/filling/shape-generators"

interface EditorContextValue {
  editorLayers: VectorLayer[]
  setEditorLayers: (layers: VectorLayer[] | ((prev: VectorLayer[]) => VectorLayer[])) => void
  selectedLayerId: string | null
  setSelectedLayerId: (id: string | null) => void
  updateLayer: (id: string, partial: Partial<VectorLayer>) => void
  editorGroups: LayerGroup[]
  setEditorGroups: (groups: LayerGroup[] | ((prev: LayerGroup[]) => LayerGroup[])) => void
  canvasWidth: number
  canvasHeight: number
  setCanvasSize: (width: number, height: number) => void
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function EditorProvider({ children }: { children: ReactNode }) {
  const [editorLayers, setEditorLayers] = useState<VectorLayer[]>([])
  const [editorGroups, setEditorGroups] = useState<LayerGroup[]>([])
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [canvasWidth, setCanvasWidth] = useState(1920)
  const [canvasHeight, setCanvasHeight] = useState(1080)

  const updateLayer = useCallback((id: string, partial: Partial<VectorLayer>) => {
    setEditorLayers((prev) =>
      prev.map((layer) => {
        if (layer.id !== id) {
          return layer
        }

        const nextLayer: VectorLayer = {
          ...layer,
          ...partial,
        }

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

  const setCanvasSize = useCallback((width: number, height: number) => {
    setCanvasWidth(Math.max(1, Math.round(width)))
    setCanvasHeight(Math.max(1, Math.round(height)))
  }, [])

  return (
    <EditorContext.Provider
      value={{
        editorLayers,
        setEditorLayers,
        selectedLayerId,
        setSelectedLayerId,
        updateLayer,
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
  selectedLayerId: null,
  setSelectedLayerId: () => {},
  updateLayer: () => {},
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
