import React, { useEffect } from "react"
import {
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem,
  BodyText,
  MutedText,
  CheckboxCard,
  AccordionCard,
  SliderInput,
  SelectInput,
  RadioCard,
  ColorPickerPopover
} from "@imify/ui"
import { Brain, Sliders, Image, Cpu, Settings2 } from "lucide-react"
import { BACKGROUND_REMOVAL_MODELS } from "./models"
import { TargetFormatQualityCard } from "../processor/target-format-quality-card"
import { FormatAdvancedSettingsCard } from "../processor/format-advanced-settings-card"
import { useBackgroundRemoverStore } from "@imify/stores"

export const BACKGROUND_REMOVER_SIDEBAR_PANEL_ID = "bg-remover-settings"

interface BackgroundRemoverSidebarProps {
  enableWideSidebarGrid?: boolean
  autoWideSidebarGridMinWidthPx?: number | null
}

export function BackgroundRemoverSidebar({
  enableWideSidebarGrid,
  autoWideSidebarGridMinWidthPx
}: BackgroundRemoverSidebarProps) {
  const {
    modelId,
    setModelId,
    variantId,
    setVariantId,
    edgeSmoothing,
    setEdgeSmoothing,
    outputFormat,
    setOutputFormat,
    backgroundColor,
    setBackgroundColor,
    unloadModelAfterProcess,
    setUnloadModelAfterProcess,
    targetFormat,
    setTargetFormat,
    quality,
    setQuality,
    codecOptions,
    setCodecOptions
  } = useBackgroundRemoverStore()

  const selectedModel = BACKGROUND_REMOVAL_MODELS.find((m) => m.id === modelId) ?? BACKGROUND_REMOVAL_MODELS[0]
  const selectedVariant = selectedModel.variants.find(v => v.id === variantId) ?? selectedModel.variants[0]

  // Initialize smart default for unloadModelAfterProcess based on hardware
  useEffect(() => {
    // Check if we have a persisted value or if it's the first time
    const storageKey = "imify-background-remover-settings"
    const saved = localStorage.getItem(storageKey)
    if (!saved) {
      // Very simple detection: if navigator.deviceMemory is available and <= 4
      const ram = (navigator as any).deviceMemory
      if (ram && ram <= 4) {
        setUnloadModelAfterProcess(true)
      }
    }
  }, [setUnloadModelAfterProcess])

  const sidebarItems: WorkspaceConfigSidebarItem[] = [
    {
      id: "ai-engine-settings",
      label: "",
      content: (
        <AccordionCard
          label="AI Engine"
          icon={<Brain size={16} />}
          defaultOpen={true}
          colorTheme="pink"
          childrenClassName="p-3 space-y-3"
        >
          <div className="grid grid-cols-1 gap-2">
            {/* AI Model */}
            <SelectInput
              label="AI Model"
              value={selectedModel.id}
              options={BACKGROUND_REMOVAL_MODELS.map(m => ({ value: m.id, label: m.name }))}
              onChange={setModelId}
              tooltipContent="Choose the AI architecture for background removal. Each model has unique characteristics in quality and speed."
            />

            {/* Model Variant */}
            {selectedModel.variants.length > 0 && (
              <SelectInput
                label="Variant"
                value={selectedVariant.id}
                options={selectedModel.variants.map(v => ({ value: v.id, label: v.label }))}
                onChange={setVariantId}
                tooltipContent="Select model precision. Quantized variants are faster and lighter, while FP16 provides maximum accuracy."
              />
            )}
          </div>

          {/* Resource Efficiency */}
          <CheckboxCard
            checked={unloadModelAfterProcess}
            onChange={setUnloadModelAfterProcess}
            title="Auto-unload Model"
            subtitle="Free up RAM immediately after processing."
            tooltipContent="Automatically removes the AI model from browser memory after each process. Highly recommended for systems with low RAM."
            icon={<Cpu size={16} />}
          />

          {/* Selection Overview Card */}
          <div className="relative p-3.5 rounded-lg bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 border-2 border-slate-200/60 dark:border-slate-700/50 shadow-sm space-y-3 transition-all">
            <div className="flex items-center gap-2">
              <Settings2 className="text-pink-500" size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Current Selection</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0 shadow-[0_0_8px_rgba(244,114,182,0.4)]" />
                <MutedText className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-slate-200 font-bold">Model:</strong> {selectedModel.description}
                </MutedText>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0 shadow-[0_0_8px_rgba(244,114,182,0.4)]" />
                <MutedText className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-slate-200 font-bold">Variant:</strong> {selectedVariant.description}
                </MutedText>
              </div>
            </div>
          </div>
        </AccordionCard>
      )
    },
    {
      id: "export-format-settings",
      label: "",
      content: (
        <TargetFormatQualityCard
          targetFormat={targetFormat}
          quality={quality}
          formatConfig={codecOptions}
          formatOptions={[
            { value: "png", label: "PNG (.png)" },
            { value: "webp", label: "WebP (.webp)" },
            { value: "avif", label: "AVIF (.avif)" },
            { value: "jxl", label: "JXL (.jxl)" }
          ]}
          supportsQuality={targetFormat !== "png"}
          supportsTinyMode={targetFormat === "png"}
          onTargetFormatChange={(v) => setTargetFormat(v as any)}
          onQualityChange={setQuality}
          onPngTinyModeChange={(v) => setCodecOptions({ png: { tinyMode: v } })}
          onPngDitheringLevelChange={(v) => setCodecOptions({ png: { ditheringLevel: v, dithering: v > 0 } })}
          onWebpLosslessChange={(v) => setCodecOptions({ webp: { lossless: v } })}
          onWebpNearLosslessChange={(v) => setCodecOptions({ webp: { nearLossless: v } })}
          onWebpEffortChange={(v) => setCodecOptions({ webp: { effort: v } })}
          onAvifSpeedChange={(v) => setCodecOptions({ avif: { speed: v } })}
          onJxlEffortChange={(v) => setCodecOptions({ jxl: { effort: v } })}
          onJxlLosslessChange={(v) => setCodecOptions({ jxl: { lossless: v } })}
        />
      )
    },
    {
      id: "output-settings",
      label: "",
      content: (
        <AccordionCard
          label="Processing & Output"
          icon={<Sliders size={16} />}
          defaultOpen={true}
          colorTheme="pink"
          childrenClassName="p-3 space-y-4"
        >
          {/* Edge Refinement */}
          <SliderInput
            label="Edge Refinement"
            value={edgeSmoothing}
            min={-10}
            max={20}
            step={1}
            suffix=""
            onChange={setEdgeSmoothing}
          />

          {/* Background Type */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Image size={14} />
              <BodyText className="text-xs font-semibold">Background Type</BodyText>
            </div>

            <div className="space-y-2">
              <RadioCard
                title="Transparent"
                subtitle="Remove background and keep it clear"
                value="transparent"
                selectedValue={outputFormat}
                onChange={(v) => setOutputFormat(v as any)}
                colorTheme="pink"
                icon={<div className="w-4 h-4 rounded-sm border border-slate-200 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACtJREFUGFdjZEADJgY0QCSTmZkZpAAsAKYAFUAWQBVAFUAWQBVAFUAWQBVAFUAWQBVAFUAWQBUAFUAXQBUNAwAF+L7zAAAAAElFTkSuQmCC')] bg-repeat" />}
              />

              <RadioCard
                title="Solid Color"
                subtitle="Fill the background with a specific color"
                value="color"
                selectedValue={outputFormat}
                onChange={(v) => setOutputFormat(v as any)}
                colorTheme="pink"
                icon={<div className="w-4 h-4 rounded-sm border border-slate-200" style={{ backgroundColor }} />}
                rightSlot={
                  <ColorPickerPopover
                    label=""
                    value={backgroundColor}
                    onChange={setBackgroundColor}
                    enableAlpha={false}
                    enableGradient={false}
                  />
                }
              />
            </div>
          </div>
        </AccordionCard>
      )
    },
    {
      id: "format-advanced-settings",
      label: "",
      content: (
        <FormatAdvancedSettingsCard
          targetFormat={targetFormat}
          png={{
            cleanTransparentPixels: !!codecOptions.png?.cleanTransparentPixels,
            autoGrayscale: !!codecOptions.png?.autoGrayscale,
            oxipngCompression: !!codecOptions.png?.oxipngCompression,
            progressiveInterlaced: !!codecOptions.png?.progressiveInterlaced,
            onCleanTransparentPixelsChange: (v) => setCodecOptions({ png: { cleanTransparentPixels: v } }),
            onAutoGrayscaleChange: (v) => setCodecOptions({ png: { autoGrayscale: v } }),
            onOxiPngCompressionChange: (v) => setCodecOptions({ png: { oxipngCompression: v } }),
            onProgressiveInterlacedChange: (v) => setCodecOptions({ png: { progressiveInterlaced: v } })
          }}
          webp={{
            sharpYuv: !!codecOptions.webp?.sharpYuv,
            preserveExactAlpha: !!codecOptions.webp?.preserveExactAlpha,
            onSharpYuvChange: (v) => setCodecOptions({ webp: { sharpYuv: v } }),
            onPreserveExactAlphaChange: (v) => setCodecOptions({ webp: { preserveExactAlpha: v } })
          }}
          avif={{
            qualityAlpha: codecOptions.avif?.qualityAlpha,
            lossless: !!codecOptions.avif?.lossless,
            subsample: (codecOptions.avif?.subsample ?? 1) as 1 | 2 | 3,
            tune: (codecOptions.avif?.tune ?? "auto") as "auto" | "ssim" | "psnr",
            highAlphaQuality: !!codecOptions.avif?.highAlphaQuality,
            onQualityAlphaChange: (v) => setCodecOptions({ avif: { qualityAlpha: v } }),
            onLosslessChange: (v) => setCodecOptions({ avif: { lossless: v } }),
            onSubsampleChange: (v) => setCodecOptions({ avif: { subsample: v } }),
            onTuneChange: (v) => setCodecOptions({ avif: { tune: v } }),
            onHighAlphaQualityChange: (v) => setCodecOptions({ avif: { highAlphaQuality: v } })
          }}
          jxl={{
            progressive: !!codecOptions.jxl?.progressive,
            epf: (codecOptions.jxl?.epf ?? 1) as 0 | 1 | 2 | 3,
            onProgressiveChange: (v) => setCodecOptions({ jxl: { progressive: v } }),
            onEpfChange: (v) => setCodecOptions({ jxl: { epf: v } })
          }}
        />
      )
    }
  ]

  return (
    <WorkspaceConfigSidebarPanel
      title="CONFIGURATION"
      items={sidebarItems}
      twoColumn={enableWideSidebarGrid}
      autoTwoColumnMinWidthPx={autoWideSidebarGridMinWidthPx}
    />
  )
}
