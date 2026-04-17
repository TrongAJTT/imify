import { useEffect, useMemo } from "react"

import type { FillingExportFormat } from "@/features/filling/types"
import { FormatAdvancedSettingsCard } from "@/options/components/shared/format-advanced-settings-card"
import { TargetFormatQualityCard } from "@/options/components/shared/target-format-quality-card"
import { useFillingStore } from "@/options/stores/filling-store"
import { buildFillingFormatOptions } from "@/options/stores/filling-format-options"
import { buildTargetFormatOptions, type TargetFormatOptionValue } from "@/options/shared/target-format-options"
import {
  buildTargetFormatQualityCardConfig,
  supportsTargetFormatQuality,
  supportsTargetFormatTinyMode,
} from "@/options/shared/target-format-state"

const FILLING_TARGET_FORMAT_OPTIONS = buildTargetFormatOptions([
  "jpg",
  "mozjpeg",
  "png",
  "webp",
  "avif",
  "jxl",
  "bmp",
  "tiff",
])

function resolveActiveExportFormat(exportFormat: FillingExportFormat): TargetFormatOptionValue {
  if (exportFormat === "psd") {
    return "png"
  }

  return exportFormat
}

export function FillingExportAccordion() {
  const exportFormat = useFillingStore((s) => s.exportFormat)
  const exportQuality = useFillingStore((s) => s.exportQuality)
  const exportJxlEffort = useFillingStore((s) => s.exportJxlEffort)
  const exportAvifSpeed = useFillingStore((s) => s.exportAvifSpeed)
  const exportAvifQualityAlpha = useFillingStore((s) => s.exportAvifQualityAlpha)
  const exportAvifLossless = useFillingStore((s) => s.exportAvifLossless)
  const exportAvifSubsample = useFillingStore((s) => s.exportAvifSubsample)
  const exportAvifTune = useFillingStore((s) => s.exportAvifTune)
  const exportAvifHighAlphaQuality = useFillingStore((s) => s.exportAvifHighAlphaQuality)
  const exportMozJpegProgressive = useFillingStore((s) => s.exportMozJpegProgressive)
  const exportMozJpegChromaSubsampling = useFillingStore((s) => s.exportMozJpegChromaSubsampling)
  const exportPngTinyMode = useFillingStore((s) => s.exportPngTinyMode)
  const exportPngCleanTransparentPixels = useFillingStore((s) => s.exportPngCleanTransparentPixels)
  const exportPngAutoGrayscale = useFillingStore((s) => s.exportPngAutoGrayscale)
  const exportPngDithering = useFillingStore((s) => s.exportPngDithering)
  const exportPngDitheringLevel = useFillingStore((s) => s.exportPngDitheringLevel)
  const exportPngProgressiveInterlaced = useFillingStore((s) => s.exportPngProgressiveInterlaced)
  const exportPngOxiPngCompression = useFillingStore((s) => s.exportPngOxiPngCompression)
  const exportWebpLossless = useFillingStore((s) => s.exportWebpLossless)
  const exportWebpNearLossless = useFillingStore((s) => s.exportWebpNearLossless)
  const exportWebpEffort = useFillingStore((s) => s.exportWebpEffort)
  const exportWebpSharpYuv = useFillingStore((s) => s.exportWebpSharpYuv)
  const exportWebpPreserveExactAlpha = useFillingStore((s) => s.exportWebpPreserveExactAlpha)
  const exportBmpColorDepth = useFillingStore((s) => s.exportBmpColorDepth)
  const exportBmpDithering = useFillingStore((s) => s.exportBmpDithering)
  const exportBmpDitheringLevel = useFillingStore((s) => s.exportBmpDitheringLevel)
  const exportTiffColorMode = useFillingStore((s) => s.exportTiffColorMode)

  const setExportFormat = useFillingStore((s) => s.setExportFormat)
  const setExportQuality = useFillingStore((s) => s.setExportQuality)
  const setExportJxlEffort = useFillingStore((s) => s.setExportJxlEffort)
  const setExportAvifSpeed = useFillingStore((s) => s.setExportAvifSpeed)
  const setExportAvifQualityAlpha = useFillingStore((s) => s.setExportAvifQualityAlpha)
  const setExportAvifLossless = useFillingStore((s) => s.setExportAvifLossless)
  const setExportAvifSubsample = useFillingStore((s) => s.setExportAvifSubsample)
  const setExportAvifTune = useFillingStore((s) => s.setExportAvifTune)
  const setExportAvifHighAlphaQuality = useFillingStore((s) => s.setExportAvifHighAlphaQuality)
  const setExportMozJpegProgressive = useFillingStore((s) => s.setExportMozJpegProgressive)
  const setExportMozJpegChromaSubsampling = useFillingStore((s) => s.setExportMozJpegChromaSubsampling)
  const setExportPngTinyMode = useFillingStore((s) => s.setExportPngTinyMode)
  const setExportPngCleanTransparentPixels = useFillingStore((s) => s.setExportPngCleanTransparentPixels)
  const setExportPngAutoGrayscale = useFillingStore((s) => s.setExportPngAutoGrayscale)
  const setExportPngDitheringLevel = useFillingStore((s) => s.setExportPngDitheringLevel)
  const setExportPngProgressiveInterlaced = useFillingStore((s) => s.setExportPngProgressiveInterlaced)
  const setExportPngOxiPngCompression = useFillingStore((s) => s.setExportPngOxiPngCompression)
  const setExportWebpLossless = useFillingStore((s) => s.setExportWebpLossless)
  const setExportWebpNearLossless = useFillingStore((s) => s.setExportWebpNearLossless)
  const setExportWebpEffort = useFillingStore((s) => s.setExportWebpEffort)
  const setExportWebpSharpYuv = useFillingStore((s) => s.setExportWebpSharpYuv)
  const setExportWebpPreserveExactAlpha = useFillingStore((s) => s.setExportWebpPreserveExactAlpha)
  const setExportBmpColorDepth = useFillingStore((s) => s.setExportBmpColorDepth)
  const setExportBmpDitheringLevel = useFillingStore((s) => s.setExportBmpDitheringLevel)
  const setExportTiffColorMode = useFillingStore((s) => s.setExportTiffColorMode)

  const activeExportFormat = resolveActiveExportFormat(exportFormat)

  useEffect(() => {
    if (exportFormat === "psd") {
      setExportFormat("png")
    }
  }, [exportFormat, setExportFormat])

  const sourceFormatOptions = useMemo(
    () =>
      buildFillingFormatOptions({
        exportFormat,
        exportBmpColorDepth,
        exportBmpDithering,
        exportBmpDitheringLevel,
        exportJxlEffort,
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

  const supportsQuality = supportsTargetFormatQuality(activeExportFormat)
  const supportsTinyMode = supportsTargetFormatTinyMode(activeExportFormat)

  return (
    <div className="space-y-3">
      <TargetFormatQualityCard
        targetFormat={activeExportFormat}
        quality={exportQuality}
        formatConfig={buildTargetFormatQualityCardConfig(sourceFormatOptions)}
        formatOptions={FILLING_TARGET_FORMAT_OPTIONS}
        supportsQuality={supportsQuality}
        supportsTinyMode={supportsTinyMode}
        onTargetFormatChange={(value) => setExportFormat(value as FillingExportFormat)}
        onQualityChange={setExportQuality}
        onAvifSpeedChange={setExportAvifSpeed}
        onJxlEffortChange={setExportJxlEffort}
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
        targetFormat={activeExportFormat}
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
