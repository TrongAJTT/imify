import { Info } from "lucide-react"
import { AccordionCard, MutedText } from "@imify/ui"

export function InformationAccordion() {
  return (
    <AccordionCard icon={<Info size={16} />} label="Information" sublabel="About this tool" colorTheme="orange" defaultOpen={false}>
      <div className="space-y-3">
        <MutedText className="text-xs">
          Inspect an image in detail: view file info, extract metadata (EXIF), explore dominant colors, and quickly check
          for privacy-sensitive fields before sharing. All analysis is performed 100% locally in your browser. No image data
          is ever sent to any server.
        </MutedText>
      </div>
    </AccordionCard>
  )
}
