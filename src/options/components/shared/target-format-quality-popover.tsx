import { IcoSizeSelector } from "@/options/components/ico-size-selector"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"
import { NumberInput } from "@/options/components/ui/number-input"
import { SelectInput } from "@/options/components/ui/select-input"
import SidebarCard from "@/options/components/ui/sidebar-card"
import * as Popover from "@radix-ui/react-popover"
import { FileJson } from "lucide-react"
import { useState } from "react"

export type TargetFormatQualityPopoverProps = {
  /** Selected target format value */
  targetFormat: string
  /** Quality value (1-100) */
  quality: number
  /** PNG Tiny Mode toggle state */
  pngTinyMode: boolean
  /** Available format options for dropdown */
  formatOptions: Array<{ value: string; label: string }>
  /** Whether quality is supported for current format */
  supportsQuality: boolean
  /** Whether tiny mode is supported (PNG only) */
  supportsTinyMode: boolean
  /** ICO sizes array (optional, for ICO format) */
  icoSizes?: number[]
  icoGenerateWebIconKit?: boolean
  onToggleWebIconKit?: (v: boolean) => void
  /** Callback when target format changes */
  onTargetFormatChange: (format: string) => void
  /** Callback when quality changes */
  onQualityChange: (quality: number) => void
  /** Callback when tiny mode toggle changes */
  onPngTinyModeChange: (enabled: boolean) => void
  /** Callback when ICO sizes change (optional for ICO handling) */
  onIcoSizesChange?: (sizes: number[]) => void
  /** Disable all inputs */
  disabled?: boolean
}

export function TargetFormatQualityPopover({
  targetFormat,
  quality,
  pngTinyMode,
  formatOptions,
  supportsQuality,
  supportsTinyMode,
  icoSizes,
  icoGenerateWebIconKit,
  onToggleWebIconKit,
  onTargetFormatChange,
  onQualityChange,
  onPngTinyModeChange,
  onIcoSizesChange,
  disabled
}: TargetFormatQualityPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)

  const isIcoTarget = targetFormat === "ico"

  const formatLabel = targetFormat.toUpperCase()
  const qualityLabel = isIcoTarget
    ? `${icoSizes?.length ?? 0} size${(icoSizes?.length ?? 0) !== 1 ? "s" : ""}`
    : supportsQuality
    ? `Quality ${quality}`
    : "Default"

  // Add small badges into sublabel for ICO web toolkit or PNG tiny mode
  const extraFlags: string[] = []
  if (isIcoTarget && icoGenerateWebIconKit) extraFlags.push("Web Toolkit")
  if (!isIcoTarget && targetFormat === "png" && pngTinyMode) extraFlags.push("Tiny")

  const sublabel = `${formatLabel} • ${qualityLabel}${extraFlags.length ? ` • ${extraFlags.join(", ")}` : ""}`

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <div>
          <SidebarCard
            icon={<FileJson size={14} />}
            label="Target Format & Quality"
            sublabel={sublabel}
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
          />
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="w-72 rounded-lg border border-slate-200 bg-white shadow-lg p-4 z-50 dark:border-slate-700 dark:bg-slate-900"
          sideOffset={12}
          align="start"
          side="bottom"
          style={{
            maxWidth: "calc(100% - 1rem)",
            maxHeight: "calc(100vh - 2rem)",
            overflow: "auto"
          }}>
          <div className="space-y-3">
            <div>
              <SelectInput
                label="Target format"
                disabled={disabled}
                options={formatOptions}
                onChange={(v) => onTargetFormatChange(v)}
                value={targetFormat}
              />
            </div>

            {supportsQuality && (
              <div>
                <NumberInput
                  label="Quality"
                  disabled={disabled || !supportsQuality}
                  min={1}
                  max={100}
                  step={1}
                  value={quality}
                  onChangeValue={onQualityChange}
                />
              </div>
            )}

            {isIcoTarget && (
              <div>
                <IcoSizeSelector
                  disabled={disabled}
                  generateWebIconKit={icoGenerateWebIconKit ?? false}
                  onToggleSize={(size) => {
                    if (!onIcoSizesChange) return
                    const exists = icoSizes?.includes(size)
                    const next = exists
                      ? (icoSizes || []).filter((entry) => entry !== size)
                      : [...(icoSizes || []), size].sort((a, b) => a - b)
                    onIcoSizesChange(next.length ? next : [16])
                  }}
                  onToggleWebKit={(v) => onToggleWebIconKit?.(v)}
                  sizes={icoSizes || [16]}
                />
              </div>
            )}

            {supportsTinyMode && (
              <CheckboxCard
                title="Tiny Mode"
                subtitle="Quantize to reduce PNG size"
                tooltip="Use 8-bit quantization to reduce PNG size by up to 70% (TinyPNG-like). Best for web graphics and UI assets, not recommended for portrait photos."
                checked={pngTinyMode}
                onChange={onPngTinyModeChange}
                disabled={disabled || !supportsTinyMode}
              />
            )}
          </div>

          <Popover.Arrow className="fill-white dark:fill-slate-900" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export default TargetFormatQualityPopover
