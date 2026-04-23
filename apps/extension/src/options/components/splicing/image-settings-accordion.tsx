import { Image as ImageIcon } from "lucide-react"
import { NumberInput } from "@imify/ui/ui/number-input"
import { ColorPickerPopover } from "@imify/ui/ui/color-picker-popover"
import { AccordionCard } from "@imify/ui/ui/accordion-card"
import { ResizeCard } from "@/options/components/shared/resize-card"
import type { SplicingImageResize } from "@imify/features/splicing/types"

interface ImageSettingsAccordionProps {
  imageResize: SplicingImageResize
  imageFitValue: number
  imagePadding: number
  imagePaddingColor: string
  imageBorderRadius: number
  imageBorderWidth: number
  imageBorderColor: string
  isImageResizeOpen: boolean

  onImageResizeChange: (mode: SplicingImageResize) => void
  onImageFitValueChange: (value: number) => void
  onImagePaddingChange: (value: number) => void
  onImagePaddingColorChange: (value: string) => void
  onImageBorderRadiusChange: (value: number) => void
  onImageBorderWidthChange: (value: number) => void
  onImageBorderColorChange: (value: string) => void
  onImageResizeOpenChange: (open: boolean) => void
}

/**
 * Accordion for Image Settings (Resize, Padding, Border)
 * Dynamically shows sublabel based on resize and padding values
 */
export function ImageSettingsAccordion({
  imageResize,
  imageFitValue,
  imagePadding,
  imagePaddingColor,
  imageBorderRadius,
  imageBorderWidth,
  imageBorderColor,
  isImageResizeOpen,
  onImageResizeChange,
  onImageFitValueChange,
  onImagePaddingChange,
  onImagePaddingColorChange,
  onImageBorderRadiusChange,
  onImageBorderWidthChange,
  onImageBorderColorChange,
  onImageResizeOpenChange
}: ImageSettingsAccordionProps) {
  // Dynamic sublabel showing resize mode and padding
  const resizeLabel = imageResize === "original" ? "Original" : imageResize === "fit_width" ? "Fit Width" : "Fit Height"
  const sublabel = `Mode: ${resizeLabel}, Padding: ${imagePadding}`

  return (
    <AccordionCard
      icon={<ImageIcon size={16} />}
      label="Image Settings"
      sublabel={sublabel}
      colorTheme="orange"
      defaultOpen={false}
    >
      <div className="space-y-3 pt-1">
        {/* Image Resize Card */}
        <ResizeCard
          resizeMode={imageResize === "original" ? "none" : imageResize}
          resizeValue={imageFitValue}
          resizeWidth={0}
          resizeHeight={0}
          resizeAspectMode="fixed"
          resizeAspectRatio={0}
          resizeFitMode="contain"
          resizeContainBackground="#000000"
          resizeSourceWidth={0}
          resizeSourceHeight={0}
          resizeSyncVersion={0}
          paperSize="A4"
          dpi={300}
          onResizeModeChange={(mode) => onImageResizeChange((mode === "none" ? "original" : mode) as SplicingImageResize)}
          onResizeValueChange={onImageFitValueChange}
          onResizeWidthChange={() => {}}
          onResizeHeightChange={() => {}}
          onResizeAspectModeChange={() => {}}
          onResizeAspectRatioChange={() => {}}
          onResizeFitModeChange={() => {}}
          onResizeContainBackgroundChange={() => {}}
          onPaperSizeChange={() => {}}
          onDpiChange={() => {}}
          availableModes={["none", "fit_width", "fit_height"]}
          alwaysOpen
          onOpenChange={onImageResizeOpenChange}
        />

        <div className="grid grid-cols-3 gap-2">
          <NumberInput label="Padding" value={imagePadding} onChangeValue={onImagePaddingChange} min={0} max={100} />
          <NumberInput label="Radius" value={imageBorderRadius} onChangeValue={onImageBorderRadiusChange} min={0} max={100} />
          <NumberInput label="Border" value={imageBorderWidth} onChangeValue={onImageBorderWidthChange} min={0} max={20} />
        </div>
        {imagePadding > 0 && (
          <ColorPickerPopover
            label="Padding Color"
            value={imagePaddingColor}
            onChange={onImagePaddingColorChange}
            enableAlpha={false}
            outputMode="hex"
          />
        )}
        {imageBorderWidth > 0 && (
          <ColorPickerPopover
            label="Border Color"
            value={imageBorderColor}
            onChange={onImageBorderColorChange}
            enableAlpha={false}
            outputMode="hex"
          />
        )}
      </div>
    </AccordionCard>
  )
}
