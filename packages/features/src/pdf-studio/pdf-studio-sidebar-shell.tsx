"use client"

import React from "react"
import { SidebarPanel } from "@imify/ui"
import { PdfStudioPresetInfoPanel } from "./pdf-studio-preset-info-panel"
import { PdfStudioSidebarPanel } from "./pdf-studio-sidebar-panel"
import type { ImagesToPdfConfig, PdfStudioMode, PdfToImagesConfig } from "./types"

interface PdfStudioSidebarShellProps {
  hasContent: boolean
  mode: PdfStudioMode
  imagesToPdfConfig: ImagesToPdfConfig
  onImagesToPdfConfigChange: (config: ImagesToPdfConfig) => void
  pdfToImagesConfig: PdfToImagesConfig
  onPdfToImagesConfigChange: (config: PdfToImagesConfig) => void
  enableWideSidebarGrid?: boolean
}

export function PdfStudioSidebarShell({
  hasContent,
  mode,
  imagesToPdfConfig,
  onImagesToPdfConfigChange,
  pdfToImagesConfig,
  onPdfToImagesConfigChange,
  enableWideSidebarGrid = false
}: PdfStudioSidebarShellProps) {
  if (!hasContent) {
    return (
      <SidebarPanel>
        <PdfStudioPresetInfoPanel />
      </SidebarPanel>
    )
  }

  return (
    <PdfStudioSidebarPanel
      mode={mode}
      imagesToPdfConfig={imagesToPdfConfig}
      onImagesToPdfConfigChange={onImagesToPdfConfigChange}
      pdfToImagesConfig={pdfToImagesConfig}
      onPdfToImagesConfigChange={onPdfToImagesConfigChange}
      enableWideSidebarGrid={enableWideSidebarGrid}
    />
  )
}
