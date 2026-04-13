import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { VectorLayer } from "@/features/filling/types"

interface EditorContextValue {
  editorLayers: VectorLayer[]
  setEditorLayers: (layers: VectorLayer[] | ((prev: VectorLayer[]) => VectorLayer[])) => void
  selectedLayerId: string | null
  setSelectedLayerId: (id: string | null) => void
  updateLayer: (id: string, partial: Partial<VectorLayer>) => void
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function EditorProvider({ children }: { children: ReactNode }) {
  const [editorLayers, setEditorLayers] = useState<VectorLayer[]>([])
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)

  const updateLayer = useCallback((id: string, partial: Partial<VectorLayer>) => {
    setEditorLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...partial } : l))
    )
  }, [])

  return (
    <EditorContext.Provider
      value={{
        editorLayers,
        setEditorLayers,
        selectedLayerId,
        setSelectedLayerId,
        updateLayer,
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
}

export function useEditorContext(): EditorContextValue {
  const ctx = useContext(EditorContext)
  return ctx ?? NOOP_CONTEXT
}

export function useEditorContextSafe(): EditorContextValue | null {
  return useContext(EditorContext)
}
