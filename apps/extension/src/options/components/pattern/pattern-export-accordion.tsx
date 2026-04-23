import { useMemo } from "react"

import { FormatAdvancedSettingsCard } from "@/options/components/shared/format-advanced-settings-card"
import { TargetFormatQualityCard } from "@/options/components/shared/target-format-quality-card"
import { usePatternStore } from "@/options/stores/pattern-store"
import { buildPatternFormatOptions } from "@/options/stores/pattern-format-options"
import { buildTargetFormatOptions } from "@/options/shared/target-format-options"
import {
  buildTargetFormatQualityCardConfig,
  supportsTargetFormatQuality,
  supportsTargetFormatTinyMode,
} from "@/options/shared/target-format-state"

const PATTERN_TARGET_FORMAT_OPTIONS = buildTargetFormatOptions([
  "jpg",
  "mozjpeg",
  "png",
  "webp",
  "avif",
  "jxl",
  "bmp",
  "tiff",
])

export function PatternExportAccordion() {
  const exportFormat = usePatternStore((s) => s.exportFormat)
  const exportQuality = usePatternStore((s) => s.exportQuality)
  const exportJxlEffort = usePatternStore((s) => s.exportJxlEffort)
  const exportJxlLossless = usePatternStore((s) => s.exportJxlLossless)
  const exportJxlProgressive = usePatternStore((s) => s.exportJxlProgressive)
  const exportJxlEpf = usePatternStore((s) => s.exportJxlEpf)
  const exportAvifSpeed = usePatternStore((s) => s.exportAvifSpeed)
  const exportAvifQualityAlpha = usePatternStore((s) => s.exportAvifQualityAlpha)
  const exportAvifLossless = usePatternStore((s) => s.exportAvifLossless)
  const exportAvifSubsample = usePatternStore((s) => s.exportAvifSubsample)
  const exportAvifTune = usePatternStore((s) => s.exportAvifTune)
  const exportAvifHighAlphaQuality = usePatternStore((s) => s.exportAvifHighAlphaQuality)
  const exportMozJpegProgressive = usePatternStore((s) => s.exportMozJpegProgressive)
  const exportMozJpegChromaSubsampling = usePatternStore((s) => s.exportMozJpegChromaSubsampling)
  const exportPngTinyMode = usePatternStore((s) => s.exportPngTinyMode)
  const exportPngCleanTransparentPixels = usePatternStore((s) => s.exportPngCleanTransparentPixels)
  const exportPngAutoGrayscale = usePatternStore((s) => s.exportPngAutoGrayscale)
  const exportPngDithering = usePatternStore((s) => s.exportPngDithering)
  const exportPngDitheringLevel = usePatternStore((s) => s.exportPngDitheringLevel)
  const exportPngProgressiveInterlaced = usePatternStore((s) => s.exportPngProgressiveInterlaced)
  const exportPngOxiPngCompression = usePatternStore((s) => s.exportPngOxiPngCompression)
  const exportWebpLossless = usePatternStore((s) => s.exportWebpLossless)
  const exportWebpNearLossless = usePatternStore((s) => s.exportWebpNearLossless)
  const exportWebpEffort = usePatternStore((s) => s.exportWebpEffort)
  const exportWebpSharpYuv = usePatternStore((s) => s.exportWebpSharpYuv)
  const exportWebpPreserveExactAlpha = usePatternStore((s) => s.exportWebpPreserveExactAlpha)
  const exportBmpColorDepth = usePatternStore((s) => s.exportBmpColorDepth)
  const exportBmpDithering = usePatternStore((s) => s.exportBmpDithering)
  const exportBmpDitheringLevel = usePatternStore((s) => s.exportBmpDitheringLevel)
  const exportTiffColorMode = usePatternStore((s) => s.exportTiffColorMode)

  const setExportFormat = usePatternStore((s) => s.setExportFormat)
  const setExportQuality = usePatternStore((s) => s.setExportQuality)
  const setExportJxlEffort = usePatternStore((s) => s.setExportJxlEffort)
  const setExportJxlLossless = usePatternStore((s) => s.setExportJxlLossless)
  const setExportJxlProgressive = usePatternStore((s) => s.setExportJxlProgressive)
  const setExportJxlEpf = usePatternStore((s) => s.setExportJxlEpf)
  const setExportAvifSpeed = usePatternStore((s) => s.setExportAvifSpeed)
  const setExportAvifQualityAlpha = usePatternStore((s) => s.setExportAvifQualityAlpha)
  const setExportAvifLossless = usePatternStore((s) => s.setExportAvifLossless)
  const setExportAvifSubsample = usePatternStore((s) => s.setExportAvifSubsample)
  const setExportAvifTune = usePatternStore((s) => s.setExportAvifTune)
  const setExportAvifHighAlphaQuality = usePatternStore((s) => s.setExportAvifHighAlphaQuality)
  const setExportMozJpegProgressive = usePatternStore((s) => s.setExportMozJpegProgressive)
  const setExportMozJpegChromaSubsampling = usePatternStore((s) => s.setExportMozJpegChromaSubsampling)
  const setExportPngTinyMode = usePatternStore((s) => s.setExportPngTinyMode)
  const setExportPngCleanTransparentPixels = usePatternStore((s) => s.setExportPngCleanTransparentPixels)
  const setExportPngAutoGrayscale = usePatternStore((s) => s.setExportPngAutoGrayscale)
  const setExportPngDitheringLevel = usePatternStore((s) => s.setExportPngDitheringLevel)
  const setExportPngProgressiveInterlaced = usePatternStore((s) => s.setExportPngProgressiveInterlaced)
  const setExportPngOxiPngCompression = usePatternStore((s) => s.setExportPngOxiPngCompression)
  const setExportWebpLossless = usePatternStore((s) => s.setExportWebpLossless)
  const setExportWebpNearLossless = usePatternStore((s) => s.setExportWebpNearLossless)
  const setExportWebpEffort = usePatternStore((s) => s.setExportWebpEffort)
  const setExportWebpSharpYuv = usePatternStore((s) => s.setExportWebpSharpYuv)
  const setExportWebpPreserveExactAlpha = usePatternStore((s) => s.setExportWebpPreserveExactAlpha)
  const setExportBmpColorDepth = usePatternStore((s) => s.setExportBmpColorDepth)
  const setExportBmpDitheringLevel = usePatternStore((s) => s.setExportBmpDitheringLevel)
  const setExportTiffColorMode = usePatternStore((s) => s.setExportTiffColorMode)

  const sourceFormatOptions = useMemo(
    () =>
      buildPatternFormatOptions({
        exportFormat,
        exportBmpColorDepth,
        exportBmpDithering,
        exportBmpDitheringLevel,
        exportJxlEffort,
        exportJxlLossless,
        exportJxlProgressive,
        exportJxlEpf,
        exportWebpLossless,
        exportWebpNearLossless,
        exportWebpEffort,
        exportWebpSharpYuv,
        exportWebpPreserveExactAlpha,
        exportAvifSpeed,
        exportAvifQualityAlpha,
        exportAvifLossless,
        exportAvifSubsample,
        exportAvifTune,
        exportAvifHighAlphaQuality,
        exportMozJpegProgressive,
        exportMozJpegChromaSubsampling,
        exportPngTinyMode,
        exportPngCleanTransparentPixels,
        exportPngAutoGrayscale,
        exportPngDithering,
        exportPngDitheringLevel,
        exportPngProgressiveInterlaced,
        exportPngOxiPngCompression,
        exportTiffColorMode,
      }),
    [
      exportFormat,
      exportBmpColorDepth,
      exportBmpDithering,
      exportBmpDitheringLevel,
      exportJxlEffort,
      exportJxlLossless,
      exportJxlProgressive,
      exportJxlEpf,
      exportWebpLossless,
      exportWebpNearLossless,
      exportWebpEffort,
      exportWebpSharpYuv,
      exportWebpPreserveExactAlpha,
      exportAvifSpeed,
      exportAvifQualityAlpha,
      exportAvifLossless,
      exportAvifSubsample,
      exportAvifTune,
      exportAvifHighAlphaQuality,
      exportMozJpegProgressive,
      exportMozJpegChromaSubsampling,
      exportPngTinyMode,
      exportPngCleanTransparentPixels,
      exportPngAutoGrayscale,
      exportPngDithering,
      exportPngDitheringLevel,
      exportPngProgressiveInterlaced,
      exportPngOxiPngCompression,
      exportTiffColorMode,
    ]
  )

  const supportsQuality = supportsTargetFormatQuality(exportFormat)
  const supportsTinyMode = supportsTargetFormatTinyMode(exportFormat)

  return (
    <div className="space-y-3">
      <TargetFormatQualityCard
        targetFormat={exportFormat}
        quality={exportQuality}
        formatConfig={buildTargetFormatQualityCardConfig(sourceFormatOptions)}
        formatOptions={PATTERN_TARGET_FORMAT_OPTIONS}
        supportsQuality={supportsQuality}
        supportsTinyMode={supportsTinyMode}
        onTargetFormatChange={(value) => setExportFormat(value as typeof exportFormat)}
        onQualityChange={setExportQuality}
        onAvifSpeedChange={setExportAvifSpeed}
        onJxlEffortChange={setExportJxlEffort}
        onJxlLosslessChange={setExportJxlLossless}
        onWebpLosslessChange={setExportWebpLossless}
        onWebpNearLosslessChange={setExportWebpNearLossless}
        onWebpEffortChange={setExportWebpEffort}
        onPngTinyModeChange={setExportPngTinyMode}
        onPngDitheringLevelChange={setExportPngDitheringLevel}
        onBmpColorDepthChange={setExportBmpColorDepth}
        onBmpDitheringLevelChange={setExportBmpDitheringLevel}
        onTiffColorModeChange={setExportTiffColorMode}
      />

      <FormatAdvancedSettingsCard
        targetFormat={exportFormat}
        avif={{
          qualityAlpha: sourceFormatOptions.avif.qualityAlpha,
          lossless: sourceFormatOptions.avif.lossless,
          subsample: sourceFormatOptions.avif.subsample,
          tune: sourceFormatOptions.avif.tune,
          highAlphaQuality: sourceFormatOptions.avif.highAlphaQuality,
          onQualityAlphaChange: setExportAvifQualityAlpha,
          onLosslessChange: setExportAvifLossless,
          onSubsampleChange: (value) => setExportAvifSubsample(String(value)),
          onTuneChange: setExportAvifTune,
          onHighAlphaQualityChange: setExportAvifHighAlphaQuality,
        }}
        jxl={{
          progressive: sourceFormatOptions.jxl.progressive,
          epf: sourceFormatOptions.jxl.epf,
          onProgressiveChange: setExportJxlProgressive,
          onEpfChange: setExportJxlEpf,
        }}
        mozjpeg={{
          progressive: sourceFormatOptions.mozjpeg.progressive,
          chromaSubsampling: sourceFormatOptions.mozjpeg.chromaSubsampling,
          onProgressiveChange: setExportMozJpegProgressive,
          onChromaSubsamplingChange: (value) => setExportMozJpegChromaSubsampling(String(value)),
        }}
        png={{
          cleanTransparentPixels: sourceFormatOptions.png.cleanTransparentPixels,
          autoGrayscale: sourceFormatOptions.png.autoGrayscale,
          oxipngCompression: sourceFormatOptions.png.oxipngCompression,
          progressiveInterlaced: sourceFormatOptions.png.progressiveInterlaced,
          onCleanTransparentPixelsChange: setExportPngCleanTransparentPixels,
          onAutoGrayscaleChange: setExportPngAutoGrayscale,
          onOxiPngCompressionChange: setExportPngOxiPngCompression,
          onProgressiveInterlacedChange: setExportPngProgressiveInterlaced,
        }}
        webp={{
          sharpYuv: sourceFormatOptions.webp.sharpYuv,
          preserveExactAlpha: sourceFormatOptions.webp.preserveExactAlpha,
          onSharpYuvChange: setExportWebpSharpYuv,
          onPreserveExactAlphaChange: setExportWebpPreserveExactAlpha,
        }}
      />
    </div>
  )
}
