import { AvifAdvancedSettingsCard } from "@/options/components/shared/avif-advanced-settings-card"
import { JxlAdvancedSettingsCard } from "@/options/components/shared/jxl-advanced-settings-card"
import { MozJpegAdvancedSettingsCard } from "@/options/components/shared/mozjpeg-advanced-settings-card"
import { PngAdvancedSettingsCard } from "@/options/components/shared/png-advanced-settings-card"
import { WebpAdvancedSettingsCard } from "@/options/components/shared/webp-advanced-settings-card"

type AvifAdvancedProps = {
  qualityAlpha?: number
  lossless: boolean
  subsample: 1 | 2 | 3
  tune: "auto" | "ssim" | "psnr"
  highAlphaQuality: boolean
  onQualityAlphaChange: (value: number) => void
  onLosslessChange: (value: boolean) => void
  onSubsampleChange: (value: 1 | 2 | 3) => void
  onTuneChange: (value: "auto" | "ssim" | "psnr") => void
  onHighAlphaQualityChange: (value: boolean) => void
}

type PngAdvancedProps = {
  cleanTransparentPixels: boolean
  autoGrayscale: boolean
  oxipngCompression: boolean
  progressiveInterlaced: boolean
  onCleanTransparentPixelsChange: (value: boolean) => void
  onAutoGrayscaleChange: (value: boolean) => void
  onOxiPngCompressionChange: (value: boolean) => void
  onProgressiveInterlacedChange: (value: boolean) => void
}

type MozJpegAdvancedProps = {
  progressive: boolean
  chromaSubsampling: 0 | 1 | 2
  onProgressiveChange: (value: boolean) => void
  onChromaSubsamplingChange: (value: 0 | 1 | 2) => void
}

type WebpAdvancedProps = {
  sharpYuv: boolean
  preserveExactAlpha: boolean
  onSharpYuvChange: (value: boolean) => void
  onPreserveExactAlphaChange: (value: boolean) => void
}

type JxlAdvancedProps = {
  progressive: boolean
  epf: 0 | 1 | 2 | 3
  onProgressiveChange: (value: boolean) => void
  onEpfChange: (value: 0 | 1 | 2 | 3) => void
}

export interface FormatAdvancedSettingsCardProps {
  targetFormat: string
  disabled?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  alwaysOpen?: boolean
  groupId?: string
  avif?: AvifAdvancedProps
  jxl?: JxlAdvancedProps
  mozjpeg?: MozJpegAdvancedProps
  png?: PngAdvancedProps
  webp?: WebpAdvancedProps
}

export function FormatAdvancedSettingsCard({
  targetFormat,
  disabled,
  isOpen,
  onOpenChange,
  alwaysOpen,
  groupId,
  avif,
  jxl,
  mozjpeg,
  png,
  webp
}: FormatAdvancedSettingsCardProps) {
  if (targetFormat === "avif" && avif) {
    return (
      <AvifAdvancedSettingsCard
        qualityAlpha={avif.qualityAlpha}
        lossless={avif.lossless}
        subsample={avif.subsample}
        tune={avif.tune}
        highAlphaQuality={avif.highAlphaQuality}
        onQualityAlphaChange={avif.onQualityAlphaChange}
        onLosslessChange={avif.onLosslessChange}
        onSubsampleChange={avif.onSubsampleChange}
        onTuneChange={avif.onTuneChange}
        onHighAlphaQualityChange={avif.onHighAlphaQualityChange}
        disabled={disabled}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        alwaysOpen={alwaysOpen}
        groupId={groupId}
      />
    )
  }

  if (targetFormat === "jxl" && jxl) {
    return (
      <JxlAdvancedSettingsCard
        progressive={jxl.progressive}
        epf={jxl.epf}
        onProgressiveChange={jxl.onProgressiveChange}
        onEpfChange={jxl.onEpfChange}
        disabled={disabled}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        alwaysOpen={alwaysOpen}
        groupId={groupId}
      />
    )
  }

  if (targetFormat === "png" && png) {
    return (
      <PngAdvancedSettingsCard
        cleanTransparentPixels={png.cleanTransparentPixels}
        autoGrayscale={png.autoGrayscale}
        oxipngCompression={png.oxipngCompression}
        progressiveInterlaced={png.progressiveInterlaced}
        onCleanTransparentPixelsChange={png.onCleanTransparentPixelsChange}
        onAutoGrayscaleChange={png.onAutoGrayscaleChange}
        onOxiPngCompressionChange={png.onOxiPngCompressionChange}
        onProgressiveInterlacedChange={png.onProgressiveInterlacedChange}
        disabled={disabled}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        alwaysOpen={alwaysOpen}
        groupId={groupId}
      />
    )
  }

  if (targetFormat === "mozjpeg" && mozjpeg) {
    return (
      <MozJpegAdvancedSettingsCard
        progressive={mozjpeg.progressive}
        chromaSubsampling={mozjpeg.chromaSubsampling}
        onProgressiveChange={mozjpeg.onProgressiveChange}
        onChromaSubsamplingChange={mozjpeg.onChromaSubsamplingChange}
        disabled={disabled}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        alwaysOpen={alwaysOpen}
        groupId={groupId}
      />
    )
  }

  if (targetFormat === "webp" && webp) {
    return (
      <WebpAdvancedSettingsCard
        sharpYuv={webp.sharpYuv}
        preserveExactAlpha={webp.preserveExactAlpha}
        onSharpYuvChange={webp.onSharpYuvChange}
        onPreserveExactAlphaChange={webp.onPreserveExactAlphaChange}
        disabled={disabled}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        alwaysOpen={alwaysOpen}
        groupId={groupId}
      />
    )
  }

  return null
}
