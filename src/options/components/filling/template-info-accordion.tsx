import { Info } from "lucide-react"
import { AccordionCard } from "@/options/components/ui/accordion-card"

export function TemplateInfoAccordion() {
  return (
    <AccordionCard
      icon={<Info size={16} />}
      label="About Image Filling"
      colorTheme="sky"
      alwaysOpen={true}
    >
      <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
        <p>
          Create reusable vector templates with customizable shapes, then fill them with images
          to produce composites.
        </p>
        <p>
          Templates define the structure (canvas size, shape layers), while the fill step lets
          you place images into each shape with clipping, borders, and corner radius controls.
        </p>
        {/* <p className="font-medium text-slate-700 dark:text-slate-300">
          Workflow: Select Template &rarr; Fill Images &rarr; Export
        </p> */}
      </div>
    </AccordionCard>
  )
}
