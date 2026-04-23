import type { SetupContext } from "@imify/stores/stores/batch-store"
import { WorkflowInfoAccordion } from "@/options/components/shared/workflow-info-accordion"

interface ProcessorPresetInfoAccordionProps {
  context: SetupContext
}

export function ProcessorPresetInfoAccordion({ context }: ProcessorPresetInfoAccordionProps) {
  const contextLabel = context === "single" ? "Single Processor" : "Batch Processor"

  return (
    <WorkflowInfoAccordion
      label={`About ${contextLabel}`}
      colorTheme={context === "single" ? "sky" : "purple"}
      paragraphs={[
        "Presets store complete conversion settings, including format options, resize behavior, naming, and export-related toggles.",
        "Choose or create a preset to enter workspace mode. Configuration changes are saved asynchronously to the active preset.",
        "Use the breadcrumb to return to preset selection mode at any time."
      ]}
    />
  )
}
