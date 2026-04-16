import { WorkflowInfoAccordion } from "@/options/components/shared/workflow-info-accordion"

export function TemplateInfoAccordion() {
  return (
    <WorkflowInfoAccordion
      label="About Image Filling"
      colorTheme="sky"
      paragraphs={[
        "Create reusable vector templates with customizable shapes, then fill them with images to produce composites.",
        "Templates define the structure (canvas size, shape layers), while the fill step lets you place images into each shape with clipping, borders, and corner radius controls."
      ]}
    />
  )
}
