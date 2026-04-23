import { Info } from "lucide-react"

import { AccordionCard } from "@imify/ui/ui/accordion-card"
import type { ColorTheme } from "@imify/ui/ui/theme-config"

interface WorkflowInfoAccordionProps {
  label: string
  paragraphs: string[]
  colorTheme?: ColorTheme
}

export function WorkflowInfoAccordion({
  label,
  paragraphs,
  colorTheme = "sky"
}: WorkflowInfoAccordionProps) {
  return (
    <AccordionCard
      icon={<Info size={16} />}
      label={label}
      colorTheme={colorTheme}
      alwaysOpen
    >
      <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
        {paragraphs.map((paragraph, index) => (
          <p key={`${label}_${index}`}>{paragraph}</p>
        ))}
      </div>
    </AccordionCard>
  )
}
