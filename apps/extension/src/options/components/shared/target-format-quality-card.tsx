import { IcoSizeSelector } from "@/options/components/ico-size-selector"
import { TARGET_FORMAT_TOOLTIPS } from "@/options/constants/target-format-tooltips"
import { CheckboxCard } from "@/options/components/ui/checkbox-card"
import { ColoredSliderCard } from "@/options/components/ui/colored-slider-card"
import { SliderInput } from "@/options/components/ui/slider-input"
import { SelectInput } from "@/options/components/ui/select-input"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { ALL_TARGET_FORMAT_OPTIONS } from "@/options/shared/target-format-options"
import { normalizeMozJpegChromaSubsampling } from "@/core/codec-options"
import type { BmpColorDepth } from "@/core/types"
import { FileJson, Zap } from "lucide-react"

export type TargetFormatQualityCardProps = {
  // Optional label for the card, defaults to "Export Format & Quality" if not provided
  cardLabel?: string
  /** Selected target format value */
  targetFormat: string
  /** Quality value (1-100) */
  quality: number
  /** Grouped format-specific codec config */
  formatConfig?: {
    bmp?: {
      colorDepth?: BmpColorDepth
      dithering?: boolean
      ditheringLevel?: number
    }
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
      lossless?: boolean
      progressive?: boolean
      epf?: 0 | 1 | 2 | 3
    }
    ico?: {
      sizes?: number[]
      generateWebIconKit?: boolean
      optimizeInternalPngLayers?: boolean
    }
  }
  /** Available format options for dropdown */
  formatOptions?: Array<{ value: string; label: string }>
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
  /** Callback when JXL lossless mode changes */
  onJxlLosslessChange?: (enabled: boolean) => void
  /** Callback when TIFF color mode changes */
  onTiffColorModeChange?: (mode: "color" | "grayscale") => void
  /** Callback when BMP color depth changes */
  onBmpColorDepthChange?: (depth: BmpColorDepth) => void
  /** Callback when BMP dithering level changes (0-100, for 1-bit mode) */
  onBmpDitheringLevelChange?: (level: number) => void
  /** Callback when WebP lossless mode changes */
  onWebpLosslessChange?: (enabled: boolean) => void
  /** Callback when WebP near-lossless level changes */
  onWebpNearLosslessChange?: (value: number) => void
  /** Callback when WebP effort level changes */
  onWebpEffortChange?: (effort: number) => void
  /** Callback when ICO sizes change (optional for ICO handling) */
  onIcoSizesChange?: (sizes: number[]) => void
  /** Callback when ICO internal PNG optimization toggle changes */
  onIcoOptimizeInternalPngLayersChange?: (enabled: boolean) => void
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
  cardLabel = "Export Format & Quality",
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
  onJxlLosslessChange,
  onTiffColorModeChange,
  onBmpColorDepthChange,
  onBmpDitheringLevelChange,
  onWebpLosslessChange,
  onWebpNearLosslessChange,
  onWebpEffortChange,
  onIcoSizesChange,
  onIcoOptimizeInternalPngLayersChange,
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
  const rawBmpColorDepth = formatConfig?.bmp?.colorDepth
  const bmpColorDepth: BmpColorDepth =
    rawBmpColorDepth === 1 || rawBmpColorDepth === 8 || rawBmpColorDepth === 32
      ? rawBmpColorDepth
      : 24
  const bmpDitheringLevel = bmpColorDepth === 1
    ? normalizeDitheringLevel(formatConfig?.bmp?.ditheringLevel, formatConfig?.bmp?.dithering)
    : 0
  const bmpDitheringEnabled = bmpDitheringLevel > 0
  const jxlEffortOption = formatConfig?.jxl?.effort
  const jxlLosslessEnabled = Boolean(formatConfig?.jxl?.lossless)
  const jxlProgressiveEnabled = Boolean(formatConfig?.jxl?.progressive)
  const jxlEpf =
    formatConfig?.jxl?.epf === 0 ||
    formatConfig?.jxl?.epf === 1 ||
    formatConfig?.jxl?.epf === 2 ||
    formatConfig?.jxl?.epf === 3
      ? formatConfig.jxl.epf
      : 1
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
  const icoOptimizeInternalPngLayers = formatConfig?.ico?.optimizeInternalPngLayers
  const tiffColorMode = formatConfig?.tiff?.colorMode === "grayscale" ? "grayscale" : "color"

  const formatLabel = targetFormat === "mozjpeg" ? "MozJPEG" : targetFormat.toUpperCase()
  const qualityLabel = isIcoTarget
    ? `${icoSizeOptions?.length ?? 0} size${(icoSizeOptions?.length ?? 0) !== 1 ? "s" : ""}`
    : targetFormat === "jxl" && jxlLosslessEnabled
    ? "Lossless"
    : targetFormat === "webp" && webpLosslessEnabled
    ? `Near-Lossless ${webpNearLossless}`
    : supportsQuality
    ? `Quality ${quality}`
    : "Default"
  const showQualityControl = supportsQuality && !(targetFormat === "jxl" && jxlLosslessEnabled)

  // Add small badges into sublabel for ICO web toolkit or PNG tiny mode
  const extraFlags: string[] = []
  if (isIcoTarget && icoWebToolkitEnabled) extraFlags.push("Web Toolkit")
  if (isIcoTarget && icoOptimizeInternalPngLayers) extraFlags.push("Optimized")
  if (!isIcoTarget && targetFormat === "png" && pngTinyModeEnabled) extraFlags.push("Tiny")
  if (!isIcoTarget && targetFormat === "png" && pngTinyModeEnabled && pngDithering) {
    extraFlags.push(`Dither ${pngDitheringLevel}%`)
  }
  if (targetFormat === "jxl") {
    if (jxlLosslessEnabled) extraFlags.push("Lossless")
    extraFlags.push(`Effort ${jxlEffortOption ?? 7}`)
    if (jxlProgressiveEnabled) extraFlags.push("Progressive")
    if (jxlEpf !== 1) extraFlags.push(`EPF ${jxlEpf}`)
  }
  if (targetFormat === "avif" && typeof avifSpeedOption === "number") extraFlags.push(`Speed ${avifSpeedOption}`)
  if (targetFormat === "webp") {
    if (webpLosslessEnabled) extraFlags.push("Lossless")
    extraFlags.push(`Effort ${webpEffort}`)
  }
  if (targetFormat === "mozjpeg") {
    extraFlags.push(mozJpegOptions?.progressive ?? true ? "Progressive" : "Baseline")
    const chroma = normalizeMozJpegChromaSubsampling(mozJpegOptions?.chromaSubsampling)
    extraFlags.push(`Chroma ${chroma === 1 ? "4:2:2" : "4:2:0"}`)
  }
  if (targetFormat === "tiff" && tiffColorMode === "grayscale") {
    extraFlags.push("Grayscale")
  }
  if (targetFormat === "bmp") {
    extraFlags.push(`${bmpColorDepth}-bit`)
    if (bmpColorDepth === 1 && bmpDitheringEnabled) {
      extraFlags.push(`Dither ${bmpDitheringLevel}%`)
    }
  }

  const sublabel = `${formatLabel} • ${qualityLabel}${extraFlags.length ? ` • ${extraFlags.join(", ")}` : ""}`
  const resolvedFormatOptions = formatOptions?.length ? formatOptions : ALL_TARGET_FORMAT_OPTIONS
  const shouldShowTargetFormatSelector = resolvedFormatOptions.length > 1

  return (
    <AccordionCard
      icon={<FileJson size={14} />}
      label={cardLabel || "Export Format & Quality"}
      sublabel={sublabel}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      disabled={disabled}
      alwaysOpen={alwaysOpen}
      groupId={groupId}
      colorTheme="blue"
    >
      <div className="space-y-3">
        {shouldShowTargetFormatSelector && (
          <div>
            <SelectInput
              label="Target format"
              disabled={disabled}
              options={resolvedFormatOptions}
              onChange={(v) => onTargetFormatChange(v)}
              value={targetFormat}
            />
          </div>
        )}

        {showQualityControl && (
          <>
            {targetFormat === "webp" && onWebpNearLosslessChange && webpLosslessEnabled ? (
              <SliderInput
                label="Near-Lossless"
                tooltip={TARGET_FORMAT_TOOLTIPS.nearLossless}
                disabled={disabled || !webpLosslessEnabled}
                min={0}
                max={100}
                step={1}
                value={webpNearLossless}
                onChange={onWebpNearLosslessChange}
              />
            ) : (
              <SliderInput
                label="Quality"
                disabled={disabled || !showQualityControl}
                min={1}
                max={100}
                step={1}
                value={quality}
                onChange={onQualityChange}
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
                tooltipContent={TARGET_FORMAT_TOOLTIPS.webpEffort}
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
          <div className="space-y-2">
            {onJxlLosslessChange && (
              <CheckboxCard
                icon={<Zap size={16} />}
                title="Lossless Mode"
                subtitle={
                  jxlLosslessEnabled
                    ? "Enabled: exact pixels, larger files, quality slider hidden"
                    : "Disabled: lossy mode with quality slider control"
                }
                tooltipContent={TARGET_FORMAT_TOOLTIPS.jxlLossless}
                checked={jxlLosslessEnabled}
                onChange={onJxlLosslessChange}
                disabled={disabled}
                theme="blue"
              />
            )}

            <SelectInput
              label="Effort Level"
              tooltipContent={TARGET_FORMAT_TOOLTIPS.jxlEffort}
              disabled={disabled}
              options={[
                { value: "1", label: "1 - Lightning (fastest)" },
                { value: "2", label: "2 - Very Fast" },
                { value: "3", label: "3 - Fast" },
                { value: "4", label: "4 - Fast-Balanced" },
                { value: "5", label: "5 - Balanced" },
                { value: "6", label: "6 - Balanced - Optimal" },
                { value: "7", label: "7 - Optimal (default)" },
                { value: "8", label: "8 - Very Optimal" },
                { value: "9", label: "9 - Maximum (slowest)" }
              ]}
              onChange={(v) => onJxlEffortChange?.(parseInt(v, 10))}
              value={String(jxlEffortOption ?? 7)}
            />
          </div>
        )}

        {targetFormat === "avif" && onAvifSpeedChange && (
          <div>
            <SelectInput
              label="Speed"
              tooltipContent={TARGET_FORMAT_TOOLTIPS.avifSpeed}
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

        {targetFormat === "bmp" && onBmpColorDepthChange && (
          <div className="space-y-2">
            <SelectInput
              label="Color Depth"
              tooltipContent={TARGET_FORMAT_TOOLTIPS.bmpColorDepth}
              disabled={disabled}
              options={[
                { value: "24", label: "24-bit RGB (Standard)" },
                { value: "32", label: "32-bit RGBA (With Transparency)" },
                { value: "8", label: "8-bit Grayscale" },
                { value: "1", label: "1-bit Monochrome (Printers/IoT)" }
              ]}
              onChange={(value) => onBmpColorDepthChange(parseInt(value, 10) as BmpColorDepth)}
              value={String(bmpColorDepth)}
            />

            {bmpColorDepth === 1 && onBmpDitheringLevelChange && (
              <SliderInput
                label="Dithering Level"
                tooltip={TARGET_FORMAT_TOOLTIPS.bmpDithering}
                value={bmpDitheringLevel}
                min={0}
                max={100}
                step={1}
                suffix="%"
                disabled={disabled}
                onChange={onBmpDitheringLevelChange}
              />
            )}
          </div>
        )}

        {targetFormat === "tiff" && onTiffColorModeChange && (
          <div>
            <SelectInput
              label="Color Mode"
              tooltipContent={TARGET_FORMAT_TOOLTIPS.tiffColorMode}
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
              optimizeInternalPngLayers={icoOptimizeInternalPngLayers ?? false}
              onToggleSize={(size) => {
                if (!onIcoSizesChange) return
                const exists = icoSizeOptions?.includes(size)
                const next = exists
                  ? (icoSizeOptions || []).filter((entry) => entry !== size)
                  : [...(icoSizeOptions || []), size].sort((a, b) => a - b)
                onIcoSizesChange(next.length ? next : [16])
              }}
              onToggleWebKit={(v) => onToggleWebIconKit?.(v)}
              onToggleOptimizeInternalPngLayers={(v) =>
                onIcoOptimizeInternalPngLayersChange?.(v)
              }
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
              tooltipContent={TARGET_FORMAT_TOOLTIPS.tinyMode}
              checked={pngTinyModeEnabled}
              onChange={onPngTinyModeChange}
              disabled={disabled || !supportsTinyMode}
              theme="blue"
            />

            {pngTinyModeEnabled && onPngDitheringLevelChange && (
              <SliderInput
                label="Dithering Level"
                tooltip={TARGET_FORMAT_TOOLTIPS.pngDithering}
                value={pngDitheringLevel}
                min={0}
                max={100}
                step={1}
                suffix="%"
                disabled={disabled}
                onChange={onPngDitheringLevelChange}
              />
            )}
          </div>
        )}
      </div>
    </AccordionCard>
  )
}
