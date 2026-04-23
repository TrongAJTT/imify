import { ManualEditorWorkspace as SharedManualEditorWorkspace } from "@imify/features/filling/manual-editor-workspace"
import type { LayerGroup, VectorLayer } from "@imify/features/filling/types"
import { FILLING_TOOLTIPS } from "@/options/components/filling/filling-tooltips"
import manualEditorMultiSelectVideo from "url:assets/features/image_filling_manual-visual_multi_select.webm"

interface ManualEditorWorkspaceProps {
  canvasWidth: number
  canvasHeight: number
  groups: LayerGroup[]
  layers: VectorLayer[]
  selectedLayerId: string | null
  selectedLayerIds: string[]
  onSelectLayer: (id: string | null) => void
  onToggleLayerSelection: (id: string) => void
  onSetSelectedLayers: (ids: string[]) => void
  onClearSelection: () => void
  onUpdateLayer: (id: string, partial: Partial<VectorLayer>) => void
  onSaveTemplate: () => Promise<void>
  isSavingTemplate: boolean
}

export function ManualEditorWorkspace({
  canvasWidth,
  canvasHeight,
  groups,
  layers,
  selectedLayerId,
  selectedLayerIds,
  onSelectLayer,
  onToggleLayerSelection,
  onSetSelectedLayers,
  onClearSelection,
  onUpdateLayer,
  onSaveTemplate,
  isSavingTemplate,
}: ManualEditorWorkspaceProps) {
  return (
    <SharedManualEditorWorkspace
      canvasWidth={canvasWidth}
      canvasHeight={canvasHeight}
      groups={groups}
      layers={layers}
      selectedLayerId={selectedLayerId}
      selectedLayerIds={selectedLayerIds}
      onSelectLayer={onSelectLayer}
      onToggleLayerSelection={onToggleLayerSelection}
      onSetSelectedLayers={onSetSelectedLayers}
      onClearSelection={onClearSelection}
      onUpdateLayer={onUpdateLayer}
      onSaveTemplate={onSaveTemplate}
      isSavingTemplate={isSavingTemplate}
      visualHelp={{
        label: FILLING_TOOLTIPS.visualHelp.manualEditor.label,
        description: FILLING_TOOLTIPS.visualHelp.manualEditor.description,
        webmSrc: manualEditorMultiSelectVideo,
        buttonAriaLabel: FILLING_TOOLTIPS.visualHelp.manualEditor.buttonAriaLabel,
        mediaAlt: FILLING_TOOLTIPS.visualHelp.manualEditor.mediaAlt,
      }}
    />
  )
}
