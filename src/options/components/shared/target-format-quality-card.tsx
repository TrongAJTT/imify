import { IcoSizeSelector } from "@/options/components/ico-size-selector"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"
import { ColoredSliderCard } from "@/options/components/ui/colored-slider-card"
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
    webp?: {
      lossless?: boolean
      nearLossless?: number
      effort?: number
    }
    mozjpeg?: {
      progressive?: boolean
      chromaSubsampling?: 0 | 1 | 2
    }
    png?: {
      tinyMode?: boolean
      cleanTransparentPixels?: boolean
      autoGrayscale?: boolean
      dithering?: boolean
      ditheringLevel?: number
      progressiveInterlaced?: boolean
      oxipngCompression?: boolean
    }
    tiff?: {
      colorMode?: "color" | "grayscale"
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
  /** Callback when dithering level changes (0-100) */
  onPngDitheringLevelChange?: (level: number) => void
  /** Callback when JXL effort level changes */
  onJxlEffortChange?: (effort: number) => void
  /** Callback when TIFF color mode changes */
  onTiffColorModeChange?: (mode: "color" | "grayscale") => void
  /** Callback when WebP lossless mode changes */
  onWebpLosslessChange?: (enabled: boolean) => void
  /** Callback when WebP near-lossless level changes */
  onWebpNearLosslessChange?: (value: number) => void
  /** Callback when WebP effort level changes */
  onWebpEffortChange?: (effort: number) => void
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

function normalizeDitheringLevel(level: number | undefined, legacyDithering: boolean | undefined): number {
  if (typeof level === "number") {
    return Math.max(0, Math.min(100, Math.round(level)))
  }

  return legacyDithering ? 100 : 0
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
  onPngDitheringLevelChange,
  onJxlEffortChange,
  onTiffColorModeChange,
  onWebpLosslessChange,
  onWebpNearLosslessChange,
  onWebpEffortChange,
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
  const pngDitheringLevel = normalizeDitheringLevel(
    formatConfig?.png?.ditheringLevel,
    formatConfig?.png?.dithering
  )
  const pngDithering = pngDitheringLevel > 0
  const jxlEffortOption = formatConfig?.jxl?.effort
  const webpOptions = formatConfig?.webp
  const webpLosslessEnabled = Boolean(webpOptions?.lossless)
  const webpNearLossless =
    typeof webpOptions?.nearLossless === "number"
      ? Math.max(0, Math.min(100, Math.round(webpOptions.nearLossless)))
      : 100
  const webpEffort =
    typeof webpOptions?.effort === "number"
      ? Math.max(1, Math.min(9, Math.round(webpOptions.effort)))
      : 5
  const mozJpegOptions = formatConfig?.mozjpeg
  const icoSizeOptions = formatConfig?.ico?.sizes
  const icoWebToolkitEnabled = formatConfig?.ico?.generateWebIconKit
  const tiffColorMode = formatConfig?.tiff?.colorMode === "grayscale" ? "grayscale" : "color"

  const formatLabel = targetFormat === "mozjpeg" ? "MozJPEG" : targetFormat.toUpperCase()
  const qualityLabel = isIcoTarget
    ? `${icoSizeOptions?.length ?? 0} size${(icoSizeOptions?.length ?? 0) !== 1 ? "s" : ""}`
    : targetFormat === "webp" && webpLosslessEnabled
    ? `Near-Lossless ${webpNearLossless}`
    : supportsQuality
    ? `Quality ${quality}`
    : "Default"

  // Add small badges into sublabel for ICO web toolkit or PNG tiny mode
  const extraFlags: string[] = []
  if (isIcoTarget && icoWebToolkitEnabled) extraFlags.push("Web Toolkit")
  if (!isIcoTarget && targetFormat === "png" && pngTinyModeEnabled) extraFlags.push("Tiny")
  if (!isIcoTarget && targetFormat === "png" && pngTinyModeEnabled && pngDithering) {
    extraFlags.push(`Dither ${pngDitheringLevel}%`)
  }
  if (targetFormat === "jxl" && jxlEffortOption) extraFlags.push(`Effort ${jxlEffortOption}`)
  if (targetFormat === "avif" && typeof avifSpeedOption === "number") extraFlags.push(`Speed ${avifSpeedOption}`)
  if (targetFormat === "webp") {
    if (webpLosslessEnabled) extraFlags.push("Lossless")
    extraFlags.push(`Effort ${webpEffort}`)
  }
  if (targetFormat === "mozjpeg") {
    extraFlags.push(mozJpegOptions?.progressive ?? true ? "Progressive" : "Baseline")
    const chroma = mozJpegOptions?.chromaSubsampling ?? 2
    extraFlags.push(`Chroma ${chroma === 1 ? "4:2:2" : "4:2:0"}`)
  }
  if (targetFormat === "tiff" && tiffColorMode === "grayscale") {
    extraFlags.push("Grayscale")
  }

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
          <>
            {targetFormat === "webp" && onWebpNearLosslessChange && webpLosslessEnabled ? (
              <NumberInput
                label="Near-Lossless"
                disabled={disabled || !webpLosslessEnabled}
                min={0}
                max={100}
                step={1}
                value={webpNearLossless}
                onChangeValue={onWebpNearLosslessChange}
                tooltip="Subtly adjusts pixels to significantly reduce file size while maintaining near-perfect quality. Use 100 for true lossless."
              />
            ): (

              
              <NumberInput
              label="Quality"
              disabled={disabled || !supportsQuality}
              min={1}
              max={100}
              step={1}
              value={quality}
              onChangeValue={onQualityChange}
              />
            )}

          </>
        )}

        {targetFormat === "webp" && (
          <div className="space-y-2">
            {onWebpLosslessChange && (
              <CheckboxCard
                icon={<Zap size={16} />}
                title="Lossless Mode"
                subtitle={
                  webpLosslessEnabled
                    ? "Enabled: preserves exact pixels (larger file, supports near-lossless tuning)."
                    : "Disabled: lossy WebP mode (smaller files with quality-based compression)."
                }
                checked={webpLosslessEnabled}
                onChange={onWebpLosslessChange}
                disabled={disabled}
                theme="blue"
              />
            )}

            {onWebpEffortChange && (
              <SelectInput
                label="Effort Level"
                tooltip={`Higher effort uses slower but stronger compression search.\n- 1 is fastest\n- 5 is balanced\n- 9 is best compression (slowest)`}
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
                onChange={(v) => onWebpEffortChange(parseInt(v, 10))}
                value={String(webpEffort)}
              />
            )}
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

        {targetFormat === "tiff" && onTiffColorModeChange && (
          <div>
            <SelectInput
              label="Color Mode"
              tooltip={`TIFF output remains uncompressed in UTIF, but you can choose visual color rendering.
- RGB keeps full color.
- Grayscale converts the output image to black & white.`}
              disabled={disabled}
              options={[
                { value: "color", label: "RGB (Full Color)" },
                { value: "grayscale", label: "Grayscale (Black & White)" }
              ]}
              onChange={(value) => onTiffColorModeChange(value as "color" | "grayscale")}
              value={tiffColorMode}
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
          <div className="space-y-2">
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

            {pngTinyModeEnabled && onPngDitheringLevelChange && (
              <ColoredSliderCard
                label="Dithering Level"
                value={pngDitheringLevel}
                min={0}
                max={100}
                step={1}
                suffix="%"
                theme="sky"
                disabled={disabled}
                onChange={onPngDitheringLevelChange}
                subtitle="0% disables dithering. Higher values improve gradient smoothness with stronger diffusion."
              />
            )}
          </div>
        )}
      </div>
    </AccordionCard>
  )
}
