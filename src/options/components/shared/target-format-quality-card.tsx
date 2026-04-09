import { IcoSizeSelector } from "@/options/components/ico-size-selector"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"
import { NumberInput } from "@/options/components/ui/number-input"
import { SelectInput } from "@/options/components/ui/select-input"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { FileJson, Zap } from "lucide-react"

export type TargetFormatQualityCardProps = {
  /** Selected target format value */
  targetFormat: string
  /** Quality value (1-100) */
  quality: number
  /** Grouped format-specific codec config */
  formatConfig?: {
    avif?: {
      speed?: number
    }
    png?: {
      tinyMode?: boolean
      cleanTransparentPixels?: boolean
      autoGrayscale?: boolean
    }
    jxl?: {
      effort?: number
    }
    ico?: {
      sizes?: number[]
      generateWebIconKit?: boolean
    }
  }
  /** Available format options for dropdown */
  formatOptions: Array<{ value: string; label: string }>
  /** Whether quality is supported for current format */
  supportsQuality: boolean
  /** Whether tiny mode is supported (PNG only) */
  supportsTinyMode: boolean
  onToggleWebIconKit?: (v: boolean) => void
  /** Callback when target format changes */
  onTargetFormatChange: (format: string) => void
  /** Callback when quality changes */
  onQualityChange: (quality: number) => void
  /** Callback when AVIF speed changes */
  onAvifSpeedChange?: (speed: number) => void
  /** Callback when tiny mode toggle changes */
  onPngTinyModeChange: (enabled: boolean) => void
  /** Callback when JXL effort level changes */
  onJxlEffortChange?: (effort: number) => void
  /** Callback when ICO sizes change (optional for ICO handling) */
  onIcoSizesChange?: (sizes: number[]) => void
  /** Disable all inputs */
  disabled?: boolean
  /** Whether accordion is open */
  isOpen?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** If true, accordion is always open, chevron is hidden, and cannot be collapsed */
  alwaysOpen?: boolean
  /** Unique ID for mutually exclusive accordion group */
  groupId?: string
}

export function TargetFormatQualityCard({
  targetFormat,
  quality,
  formatConfig,
  formatOptions,
  supportsQuality,
  supportsTinyMode,
  onToggleWebIconKit,
  onTargetFormatChange,
  onQualityChange,
  onAvifSpeedChange,
  onPngTinyModeChange,
  onJxlEffortChange,
  onIcoSizesChange,
  disabled,
  isOpen,
  onOpenChange,
  alwaysOpen,
  groupId,
}: TargetFormatQualityCardProps) {
  const isIcoTarget = targetFormat === "ico"
  const avifSpeedOption = formatConfig?.avif?.speed
  const pngTinyModeEnabled = Boolean(formatConfig?.png?.tinyMode)
  const pngCleanTransparentPixels = Boolean(formatConfig?.png?.cleanTransparentPixels)
  const pngAutoGrayscale = Boolean(formatConfig?.png?.autoGrayscale)
  const jxlEffortOption = formatConfig?.jxl?.effort
  const icoSizeOptions = formatConfig?.ico?.sizes
  const icoWebToolkitEnabled = formatConfig?.ico?.generateWebIconKit

  const formatLabel = targetFormat.toUpperCase()
  const qualityLabel = isIcoTarget
    ? `${icoSizeOptions?.length ?? 0} size${(icoSizeOptions?.length ?? 0) !== 1 ? "s" : ""}`
    : supportsQuality
    ? `Quality ${quality}`
    : "Default"

  // Add small badges into sublabel for ICO web toolkit or PNG tiny mode
  const extraFlags: string[] = []
  if (isIcoTarget && icoWebToolkitEnabled) extraFlags.push("Web Toolkit")
  if (!isIcoTarget && targetFormat === "png" && pngTinyModeEnabled) extraFlags.push("Tiny")
  if (!isIcoTarget && targetFormat === "png" && pngCleanTransparentPixels) extraFlags.push("Clean Alpha")
  if (!isIcoTarget && targetFormat === "png" && pngAutoGrayscale) extraFlags.push("Auto Gray")
  if (targetFormat === "jxl" && jxlEffortOption) extraFlags.push(`Effort ${jxlEffortOption}`)
  if (targetFormat === "avif" && typeof avifSpeedOption === "number") extraFlags.push(`Speed ${avifSpeedOption}`)

  const sublabel = `${formatLabel} • ${qualityLabel}${extraFlags.length ? ` • ${extraFlags.join(", ")}` : ""}`

  return (
    <AccordionCard
      icon={<FileJson size={14} />}
      label="Target Format & Quality"
      sublabel={sublabel}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      disabled={disabled}
      alwaysOpen={alwaysOpen}
      groupId={groupId}
      colorTheme="blue"
    >
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

        {targetFormat === "jxl" && (
          <div>
            <SelectInput
              label="Effort Level"
              tooltip={`Effort controls compression algorithm complexity.\n- Higher values (7-9) produce smaller files but are slower.\n- Lower values (1-3) are faster but files are larger.\n- Default (5) is balanced.`}
              disabled={disabled}
              options={[
                { value: "1", label: "1 - Lightning (fastest)" },
                { value: "2", label: "2 - Very Fast" },
                { value: "3", label: "3 - Fast" },
                { value: "4", label: "4 - Fast-Balanced" },
                { value: "5", label: "5 - Balanced (default)" },
                { value: "6", label: "6 - Balanced - Optimal" },
                { value: "7", label: "7 - Optimal" },
                { value: "8", label: "8 - Very Optimal" },
                { value: "9", label: "9 - Maximum (slowest)" }
              ]}
              onChange={(v) => onJxlEffortChange?.(parseInt(v, 10))}
              value={String(jxlEffortOption ?? 5)}
            />
          </div>
        )}

        {targetFormat === "avif" && onAvifSpeedChange && (
          <div>
            <SelectInput
              label="Speed"
              tooltip={`AVIF speed is inverse effort:\n- 0 = smallest file, best quality, slowest\n- 10 = fastest encode, larger file\nDefault 6 is balanced.`}
              disabled={disabled}
              options={[
                { value: "0", label: "0 - Maximum quality (slowest)" },
                { value: "1", label: "1 - Very High quality" },
                { value: "2", label: "2 - High quality" },
                { value: "3", label: "3 - Balanced quality" },
                { value: "4", label: "4 - Medium" },
                { value: "5", label: "5 - Medium/Fast" },
                { value: "6", label: "6 - Balanced (default)" },
                { value: "7", label: "7 - Fast" },
                { value: "8", label: "8 - Very Fast" },
                { value: "9", label: "9 - Fastest practical" },
                { value: "10", label: "10 - Fastest encode" }
              ]}
              onChange={(v) => onAvifSpeedChange(parseInt(v, 10))}
              value={String(avifSpeedOption ?? 6)}
            />
          </div>
        )}

        {isIcoTarget && (
          <div>
            <IcoSizeSelector
              disabled={disabled}
              generateWebIconKit={icoWebToolkitEnabled ?? false}
              onToggleSize={(size) => {
                if (!onIcoSizesChange) return
                const exists = icoSizeOptions?.includes(size)
                const next = exists
                  ? (icoSizeOptions || []).filter((entry) => entry !== size)
                  : [...(icoSizeOptions || []), size].sort((a, b) => a - b)
                onIcoSizesChange(next.length ? next : [16])
              }}
              onToggleWebKit={(v) => onToggleWebIconKit?.(v)}
              sizes={icoSizeOptions || [16]}
            />
          </div>
        )}

        {supportsTinyMode && (
          <CheckboxCard
            icon={<Zap size={16} />}
            title="Tiny Mode"
            subtitle="Quantize to reduce PNG size"
            tooltipContent="Use 8-bit quantization to reduce PNG size by up to 70% (TinyPNG-like). Best for web graphics and UI assets, not recommended for portrait photos."
            checked={pngTinyModeEnabled}
            onChange={onPngTinyModeChange}
            disabled={disabled || !supportsTinyMode}
            theme="blue"
          />
        )}
      </div>
    </AccordionCard>
  )
}
