import { useMemo } from "react"

import type { SplitterExportFormat } from "@/features/splitter/types"
import { ColorMatchRulesAccordion } from "@/options/components/splitter/color-match-rules-accordion"
import { SplitOptionsAccordion } from "@/options/components/splitter/split-options-accordion"
import { FormatAdvancedSettingsCard } from "@/options/components/shared/format-advanced-settings-card"
import { TargetFormatQualityCard } from "@/options/components/shared/target-format-quality-card"
import {
  buildTargetFormatQualityCardConfig,
  supportsTargetFormatQuality,
  supportsTargetFormatTinyMode
} from "@/options/shared/target-format-state"
import { buildTargetFormatOptions } from "@/options/shared/target-format-options"
import { useSplitterStore } from "@/options/stores/splitter-store"
import {
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem
} from "@/options/components/ui/workspace-config-sidebar-panel"

interface SplitterSidebarPanelProps {
  enableWideSidebarGrid?: boolean
}

const SPLITTER_TARGET_FORMATS: SplitterExportFormat[] = [
  "jpg",
  "mozjpeg",
  "png",
  "webp",
  "avif",
  "jxl",
  "bmp",
  "tiff"
]

const SPLITTER_EXPORT_FORMAT_OPTIONS = buildTargetFormatOptions(SPLITTER_TARGET_FORMATS).map((entry) => ({
  value: entry.value,
  label: entry.label
}))

export function SplitterSidebarPanel({ enableWideSidebarGrid = false }: SplitterSidebarPanelProps) {
  const splitSettings = useSplitterStore((state) => state.splitSettings)
  const exportSettings = useSplitterStore((state) => state.exportSettings)
  const uiState = useSplitterStore((state) => state.uiState)

  const setSplitSettings = useSplitterStore((state) => state.setSplitSettings)
  const setExportSettings = useSplitterStore((state) => state.setExportSettings)
  const setCodecOptions = useSplitterStore((state) => state.setCodecOptions)
  const setUiState = useSplitterStore((state) => state.setUiState)
  const addColorRule = useSplitterStore((state) => state.addColorRule)
  const updateColorRule = useSplitterStore((state) => state.updateColorRule)
  const removeColorRule = useSplitterStore((state) => state.removeColorRule)

  const showColorRuleCard = splitSettings.mode === "advanced" && splitSettings.advancedMethod === "color_match"

  const showQuality = supportsTargetFormatQuality(exportSettings.targetFormat)
  const showTinyMode = supportsTargetFormatTinyMode(exportSettings.targetFormat)

  const codecOptions = exportSettings.codecOptions

  const sidebarItems: WorkspaceConfigSidebarItem[] = useMemo(() => {
    const items: WorkspaceConfigSidebarItem[] = [
      {
        id: "split-options",
        columnSpan: 2,
        content: (
          <SplitOptionsAccordion
            settings={splitSettings}
            downloadMode={exportSettings.downloadMode}
            fileNamePattern={exportSettings.fileNamePattern}
            isOpen={uiState.isSplitOptionsOpen}
            onOpenChange={(open) => setUiState({ isSplitOptionsOpen: open })}
            onChange={setSplitSettings}
            onDownloadModeChange={(mode) => setExportSettings({ downloadMode: mode })}
            onFileNamePatternChange={(value) => setExportSettings({ fileNamePattern: value })}
          />
        )
      }
    ]

    if (showColorRuleCard) {
      items.push({
        id: "color-match-rules",
        content: (
          <ColorMatchRulesAccordion
            rules={splitSettings.colorRules}
            isOpen={uiState.isColorMatchRulesOpen}
            onOpenChange={(open) => setUiState({ isColorMatchRulesOpen: open })}
            onAddRule={addColorRule}
            onUpdateRule={updateColorRule}
            onRemoveRule={removeColorRule}
          />
        )
      })
    }

    items.push(
      {
        id: "export-format-quality",
        columnSpan: 2,
        content: (
          <TargetFormatQualityCard
            targetFormat={exportSettings.targetFormat}
            quality={exportSettings.quality}
            formatConfig={buildTargetFormatQualityCardConfig(codecOptions)}
            formatOptions={SPLITTER_EXPORT_FORMAT_OPTIONS}
            supportsQuality={showQuality}
            supportsTinyMode={showTinyMode}
            onTargetFormatChange={(value) => setExportSettings({ targetFormat: value as SplitterExportFormat })}
            onQualityChange={(value) => setExportSettings({ quality: value })}
            onAvifSpeedChange={(value) => setCodecOptions({ avif: { speed: value } })}
            onJxlEffortChange={(value) => setCodecOptions({ jxl: { effort: value } })}
            onJxlLosslessChange={(value) => setCodecOptions({ jxl: { lossless: value } })}
            onWebpLosslessChange={(value) => setCodecOptions({ webp: { lossless: value } })}
            onWebpNearLosslessChange={(value) => setCodecOptions({ webp: { nearLossless: value } })}
            onWebpEffortChange={(value) => setCodecOptions({ webp: { effort: value } })}
            onPngTinyModeChange={(value) => setCodecOptions({ png: { tinyMode: value } })}
            onPngDitheringLevelChange={(value) => setCodecOptions({ png: { ditheringLevel: value } })}
            onBmpColorDepthChange={(value) => setCodecOptions({ bmp: { colorDepth: value } })}
            onBmpDitheringLevelChange={(value) => setCodecOptions({ bmp: { ditheringLevel: value } })}
            onTiffColorModeChange={(value) => setCodecOptions({ tiff: { colorMode: value } })}
            isOpen={uiState.isExportFormatQualityOpen}
            onOpenChange={(open) => setUiState({ isExportFormatQualityOpen: open })}
          />
        )
      },
      {
        id: "format-advanced-settings",
        columnSpan: 2,
        content: (
          <FormatAdvancedSettingsCard
            targetFormat={exportSettings.targetFormat}
            isOpen={uiState.isFormatAdvancedOpen}
            onOpenChange={(open) => setUiState({ isFormatAdvancedOpen: open })}
            avif={{
              qualityAlpha: codecOptions.avif?.qualityAlpha,
              lossless: Boolean(codecOptions.avif?.lossless),
              subsample: codecOptions.avif?.subsample === 2 || codecOptions.avif?.subsample === 3 ? codecOptions.avif.subsample : 1,
              tune:
                codecOptions.avif?.tune === "ssim" || codecOptions.avif?.tune === "psnr"
                  ? codecOptions.avif.tune
                  : "auto",
              highAlphaQuality: Boolean(codecOptions.avif?.highAlphaQuality),
              onQualityAlphaChange: (value) => setCodecOptions({ avif: { qualityAlpha: value } }),
              onLosslessChange: (value) => setCodecOptions({ avif: { lossless: value } }),
              onSubsampleChange: (value) => setCodecOptions({ avif: { subsample: value } }),
              onTuneChange: (value) => setCodecOptions({ avif: { tune: value } }),
              onHighAlphaQualityChange: (value) => setCodecOptions({ avif: { highAlphaQuality: value } })
            }}
            jxl={{
              progressive: Boolean(codecOptions.jxl?.progressive),
              epf:
                codecOptions.jxl?.epf === 0 ||
                codecOptions.jxl?.epf === 1 ||
                codecOptions.jxl?.epf === 2 ||
                codecOptions.jxl?.epf === 3
                  ? codecOptions.jxl.epf
                  : 1,
              onProgressiveChange: (value) => setCodecOptions({ jxl: { progressive: value } }),
              onEpfChange: (value) => setCodecOptions({ jxl: { epf: value } })
            }}
            mozjpeg={{
              progressive: codecOptions.mozjpeg?.progressive ?? true,
              chromaSubsampling:
                codecOptions.mozjpeg?.chromaSubsampling === 0 ||
                codecOptions.mozjpeg?.chromaSubsampling === 1 ||
                codecOptions.mozjpeg?.chromaSubsampling === 2
                  ? codecOptions.mozjpeg.chromaSubsampling
                  : 2,
              onProgressiveChange: (value) =>
                setCodecOptions({ mozjpeg: { progressive: value } }),
              onChromaSubsamplingChange: (value) =>
                setCodecOptions({ mozjpeg: { chromaSubsampling: value } })
            }}
            png={{
              cleanTransparentPixels: Boolean(codecOptions.png?.cleanTransparentPixels),
              autoGrayscale: Boolean(codecOptions.png?.autoGrayscale),
              oxipngCompression: Boolean(codecOptions.png?.oxipngCompression),
              progressiveInterlaced: Boolean(codecOptions.png?.progressiveInterlaced),
              onCleanTransparentPixelsChange: (value) =>
                setCodecOptions({ png: { cleanTransparentPixels: value } }),
              onAutoGrayscaleChange: (value) =>
                setCodecOptions({ png: { autoGrayscale: value } }),
              onOxiPngCompressionChange: (value) =>
                setCodecOptions({ png: { oxipngCompression: value } }),
              onProgressiveInterlacedChange: (value) =>
                setCodecOptions({ png: { progressiveInterlaced: value } })
            }}
            webp={{
              sharpYuv: Boolean(codecOptions.webp?.sharpYuv),
              preserveExactAlpha: Boolean(codecOptions.webp?.preserveExactAlpha),
              onSharpYuvChange: (value) => setCodecOptions({ webp: { sharpYuv: value } }),
              onPreserveExactAlphaChange: (value) =>
                setCodecOptions({ webp: { preserveExactAlpha: value } })
            }}
          />
        )
      }
    )

    return items
  }, [
    addColorRule,
    codecOptions,
    exportSettings,
    removeColorRule,
    setCodecOptions,
    setExportSettings,
    setSplitSettings,
    setUiState,
    showColorRuleCard,
    showQuality,
    showTinyMode,
    splitSettings,
    uiState,
    updateColorRule
  ])

  return (
    <WorkspaceConfigSidebarPanel
      items={sidebarItems}
      twoColumn={enableWideSidebarGrid}
    />
  )
}
