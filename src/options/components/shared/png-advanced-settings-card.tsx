import { Sparkles, Eraser, Palette, Cpu, ScanLine } from "lucide-react"

import { AccordionCard } from "@/options/components/ui/accordion-card"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"

export interface PngAdvancedSettingsCardProps {
  cleanTransparentPixels: boolean
  autoGrayscale: boolean
  oxipngCompression: boolean
  progressiveInterlaced: boolean
  onCleanTransparentPixelsChange: (value: boolean) => void
  onAutoGrayscaleChange: (value: boolean) => void
  onOxiPngCompressionChange: (value: boolean) => void
  onProgressiveInterlacedChange: (value: boolean) => void
  disabled?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  alwaysOpen?: boolean
  groupId?: string
}

export function PngAdvancedSettingsCard({
  cleanTransparentPixels,
  autoGrayscale,
  oxipngCompression,
  progressiveInterlaced,
  onCleanTransparentPixelsChange,
  onAutoGrayscaleChange,
  onOxiPngCompressionChange,
  onProgressiveInterlacedChange,
  disabled,
  isOpen,
  onOpenChange,
  alwaysOpen,
  groupId
}: PngAdvancedSettingsCardProps) {
  const tags: string[] = []

  if (cleanTransparentPixels) {
    tags.push("Clean Alpha")
  }

  if (autoGrayscale) {
    tags.push("Auto Gray")
  }

  if (oxipngCompression) {
    tags.push("OxiPNG")
  }

  if (progressiveInterlaced) {
    tags.push("Interlaced")
  }

  const sublabel = tags.length > 0 ? tags.join(" • ") : "Visual lossless optimizations"

  return (
    <AccordionCard
      icon={<Sparkles size={14} />}
      label="PNG Advanced"
      sublabel={sublabel}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      disabled={disabled}
      alwaysOpen={alwaysOpen}
      groupId={groupId}
      colorTheme="amber"
    >
      <div className="space-y-3">
        <CheckboxCard
          icon={<Eraser size={16} />}
          title="Clean Transparent Pixels"
          subtitle={cleanTransparentPixels ? "Enabled" : "Zero RGB where alpha is 0 to improve PNG compression"}
          tooltipContent={`Removes hidden data from transparent areas to shrink file size. It's 100% invisible to the eye and perfect for logos and icons.\nSometimes 'invisible' parts of an image still carry hidden data. We scrub that away to make your file lighter while keeping it looking exactly the same.`}
          checked={cleanTransparentPixels}
          onChange={onCleanTransparentPixelsChange}
          disabled={disabled}
          theme="amber"
        />

        <CheckboxCard
          icon={<Palette size={16} />}
          title="Auto Grayscale Detection"
          subtitle={autoGrayscale ? "Enabled" : "Prefer grayscale encode path when image has no chroma"}
          tooltipContent="Automatically shrinks the file size for black-and-white images without any loss in quality. Perfect for logos and scans."
          checked={autoGrayscale}
          onChange={onAutoGrayscaleChange}
          disabled={disabled}
          theme="amber"
        />

        <CheckboxCard
          icon={<Cpu size={16} />}
          title="OxiPNG Compression"
          subtitle={oxipngCompression ? "Enabled" : "Run OxiPNG pass for stronger lossless compression"}
          tooltipContent="Optimizes PNG filters for minimum file size. Process is slower but results are lossless."
          checked={oxipngCompression}
          onChange={onOxiPngCompressionChange}
          disabled={disabled}
          theme="amber"
        />

        <CheckboxCard
          icon={<ScanLine size={16} />}
          title="Progressive Loading (Interlaced)"
          tooltipLabel="Progressive Loading (Interlaced)"
          subtitle={
            progressiveInterlaced
              ? "Enabled"
              : "Adam7 interlacing for progressive web loading"
          }
          tooltipContent="Makes the image appear faster on websites by showing a blurry version first. Recommended for web use, though it increases file size by 5-10%."
          checked={progressiveInterlaced}
          onChange={onProgressiveInterlacedChange}
          disabled={disabled}
          theme="amber"
        />
      </div>
    </AccordionCard>
  )
}
