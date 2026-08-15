"use client"

import React from "react"
import { useTranslation } from "@imify/i18n"
import {
  AccordionCard,
  SelectInput,
  SliderInput,
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem
} from "@imify/ui"
import { ResizeCard } from "../processor/resize-card"
import type { ImagesToPdfConfig, PdfStudioMode, PdfToImagesConfig } from "./types"
import type { PaperSize, ResizeResamplingAlgorithm, SupportedDPI } from "@imify/core/types"

interface PdfStudioSidebarPanelProps {
  mode: PdfStudioMode
  imagesToPdfConfig: ImagesToPdfConfig
  onImagesToPdfConfigChange: (config: ImagesToPdfConfig) => void
  pdfToImagesConfig: PdfToImagesConfig
  onPdfToImagesConfigChange: (config: PdfToImagesConfig) => void
  enableWideSidebarGrid?: boolean
}

export function PdfStudioSidebarPanel({
  mode,
  imagesToPdfConfig,
  onImagesToPdfConfigChange,
  pdfToImagesConfig,
  onPdfToImagesConfigChange,
  enableWideSidebarGrid = false
}: PdfStudioSidebarPanelProps) {
  const { t } = useTranslation("pdfStudio")

  const dpiOptions = [
    { value: "72", label: "72 DPI (Web / Fast)" },
    { value: "150", label: "150 DPI (Standard)" },
    { value: "300", label: "300 DPI (High Quality / Print)" }
  ]

  const formatOptions = [
    { value: "png", label: "PNG (Lossless)" },
    { value: "jpg", label: "JPEG (Standard)" },
    { value: "webp", label: "WebP (Modern / Compact)" }
  ]

  const sidebarItems: WorkspaceConfigSidebarItem[] = []

  if (mode === "images-to-pdf") {
    sidebarItems.push({
      id: "paper-settings",
      label: t("settings.paperSizeTitle"),
      content: (
        <ResizeCard
          resizeMode={imagesToPdfConfig.resizeMode}
          availableModes={["inherit", "paper_size"]}
          paperSize={imagesToPdfConfig.paperSize}
          dpi={imagesToPdfConfig.dpi}
          resamplingAlgorithm={imagesToPdfConfig.resamplingAlgorithm}
          onResizeModeChange={(mode) =>
            onImagesToPdfConfigChange({
              ...imagesToPdfConfig,
              resizeMode: mode === "paper_size" ? "paper_size" : "inherit"
            })
          }
          onPaperSizeChange={(size) =>
            onImagesToPdfConfigChange({
              ...imagesToPdfConfig,
              paperSize: size as PaperSize
            })
          }
          onDpiChange={(dpi) =>
            onImagesToPdfConfigChange({
              ...imagesToPdfConfig,
              dpi: (dpi || 300) as SupportedDPI
            })
          }
          onResamplingAlgorithmChange={(resamplingAlgorithm: ResizeResamplingAlgorithm) =>
            onImagesToPdfConfigChange({
              ...imagesToPdfConfig,
              resamplingAlgorithm
            })
          }
          alwaysOpen
        />
      )
    })
  } else {
    sidebarItems.push({
      id: "export-image-settings",
      label: t("settings.exportSettingsTitle"),
      content: (
        <AccordionCard label={t("settings.exportSettingsTitle")} alwaysOpen>
          <div className="flex flex-col gap-3">
            <SelectInput
              label={t("settings.dpi")}
              value={String(pdfToImagesConfig.dpi)}
              options={dpiOptions}
              onChange={(v) =>
                onPdfToImagesConfigChange({
                  ...pdfToImagesConfig,
                  dpi: Number(v) || 150
                })
              }
            />

            <SelectInput
              label={t("settings.outputFormat")}
              value={pdfToImagesConfig.format}
              options={formatOptions}
              onChange={(v) =>
                onPdfToImagesConfigChange({
                  ...pdfToImagesConfig,
                  format: v as any
                })
              }
            />

            {pdfToImagesConfig.format !== "png" && (
              <SliderInput
                label={t("settings.quality")}
                value={pdfToImagesConfig.quality}
                min={10}
                max={100}
                step={1}
                suffix="%"
                onChange={(q) =>
                  onPdfToImagesConfigChange({
                    ...pdfToImagesConfig,
                    quality: q
                  })
                }
              />
            )}
          </div>
        </AccordionCard>
      )
    })
  }

  return (
    <WorkspaceConfigSidebarPanel
      items={sidebarItems}
      twoColumn={enableWideSidebarGrid}
    />
  )
}
