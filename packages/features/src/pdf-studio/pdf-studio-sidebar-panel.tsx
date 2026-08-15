"use client";

import React from "react";
import { useTranslation } from "@imify/i18n";
import {
  SelectInput,
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem,
} from "@imify/ui";
import { ResizeCard } from "../processor/resize-card";
import { QuickExportSelector } from "../shared/quick-export-selector";
import { PDF_STUDIO_NAMING_CONFIG, type QuickExportFormat } from "@imify/core";
import type {
  ImagesToPdfConfig,
  PdfStudioMode,
  PdfToImagesConfig,
} from "./types";
import type {
  PaperSize,
  ResizeApplyTo,
  ResizeAspectMode,
  ResizeFitMode,
  ResizeMode,
  ResizeResamplingAlgorithm,
  SupportedDPI,
} from "@imify/core/types";

interface PdfStudioSidebarPanelProps {
  mode: PdfStudioMode;
  imagesToPdfConfig: ImagesToPdfConfig;
  onImagesToPdfConfigChange: (config: ImagesToPdfConfig) => void;
  pdfToImagesConfig: PdfToImagesConfig;
  onPdfToImagesConfigChange: (config: PdfToImagesConfig) => void;
  pdfFileName?: string;
  enableWideSidebarGrid?: boolean;
}

export function PdfStudioSidebarPanel({
  mode,
  imagesToPdfConfig,
  onImagesToPdfConfigChange,
  pdfToImagesConfig,
  onPdfToImagesConfigChange,
  pdfFileName,
}: PdfStudioSidebarPanelProps) {
  const { t } = useTranslation("pdfStudio");

  const dpiOptions = [
    { value: "72", label: "72 DPI (Web / Fast)" },
    { value: "150", label: "150 DPI (Standard)" },
    { value: "300", label: "300 DPI (High Quality / Print)" },
  ];

  const sidebarItems: WorkspaceConfigSidebarItem[] = [];

  if (mode === "images-to-pdf") {
    sidebarItems.push({
      id: "resize-settings",
      label: t("settings.paperSizeTitle"),
      content: (
        <ResizeCard
          resizeMode={imagesToPdfConfig.resizeMode}
          resizeValue={imagesToPdfConfig.resizeValue}
          resizeApplyTo={imagesToPdfConfig.resizeApplyTo}
          resizeWidth={imagesToPdfConfig.resizeWidth}
          resizeHeight={imagesToPdfConfig.resizeHeight}
          resizeAspectMode={imagesToPdfConfig.resizeAspectMode}
          resizeAspectRatio={imagesToPdfConfig.resizeAspectRatio}
          resizeFitMode={imagesToPdfConfig.resizeFitMode}
          resizeContainBackground={imagesToPdfConfig.resizeContainBackground}
          resamplingAlgorithm={imagesToPdfConfig.resamplingAlgorithm}
          paperSize={imagesToPdfConfig.paperSize}
          dpi={imagesToPdfConfig.dpi}
          onResizeModeChange={(mode: string) =>
            onImagesToPdfConfigChange({
              ...imagesToPdfConfig,
              resizeMode: mode as ResizeMode,
            })
          }
          onResizeValueChange={(value: number) =>
            onImagesToPdfConfigChange({
              ...imagesToPdfConfig,
              resizeValue: value,
            })
          }
          onResizeApplyToChange={(applyTo: ResizeApplyTo) =>
            onImagesToPdfConfigChange({
              ...imagesToPdfConfig,
              resizeApplyTo: applyTo,
            })
          }
          onResizeWidthChange={(width: number) =>
            onImagesToPdfConfigChange({
              ...imagesToPdfConfig,
              resizeWidth: width,
            })
          }
          onResizeHeightChange={(height: number) =>
            onImagesToPdfConfigChange({
              ...imagesToPdfConfig,
              resizeHeight: height,
            })
          }
          onResizeAspectModeChange={(aspectMode: string) =>
            onImagesToPdfConfigChange({
              ...imagesToPdfConfig,
              resizeAspectMode: aspectMode as ResizeAspectMode,
            })
          }
          onResizeAspectRatioChange={(aspectRatio: string | number) =>
            onImagesToPdfConfigChange({
              ...imagesToPdfConfig,
              resizeAspectRatio: String(aspectRatio),
            })
          }
          onResizeFitModeChange={(fitMode: string) =>
            onImagesToPdfConfigChange({
              ...imagesToPdfConfig,
              resizeFitMode: fitMode as ResizeFitMode,
            })
          }
          onResizeContainBackgroundChange={(color: string) =>
            onImagesToPdfConfigChange({
              ...imagesToPdfConfig,
              resizeContainBackground: color,
            })
          }
          onPaperSizeChange={(size) =>
            onImagesToPdfConfigChange({
              ...imagesToPdfConfig,
              paperSize: size as PaperSize,
            })
          }
          onDpiChange={(dpi) =>
            onImagesToPdfConfigChange({
              ...imagesToPdfConfig,
              dpi: (dpi || 300) as SupportedDPI,
            })
          }
          onResamplingAlgorithmChange={(
            resamplingAlgorithm: ResizeResamplingAlgorithm,
          ) =>
            onImagesToPdfConfigChange({
              ...imagesToPdfConfig,
              resamplingAlgorithm,
            })
          }
          alwaysOpen
        />
      ),
    });
  } else {
    sidebarItems.push({
      id: "export-settings",
      label: t("settings.exportSettingsTitle"),
      content: (
        <QuickExportSelector
          format={pdfToImagesConfig.format}
          onFormatChange={(format: QuickExportFormat) =>
            onPdfToImagesConfigChange({
              ...pdfToImagesConfig,
              format,
            })
          }
          fileNamePattern={pdfToImagesConfig.fileNamePattern}
          onFileNamePatternChange={(pattern: string) =>
            onPdfToImagesConfigChange({
              ...pdfToImagesConfig,
              fileNamePattern: pattern,
            })
          }
          namingConfig={{
            ...PDF_STUDIO_NAMING_CONFIG,
            defaultOriginalName:
              pdfFileName?.replace(/\.[^.]+$/, "") ||
              PDF_STUDIO_NAMING_CONFIG.defaultOriginalName,
          }}
          previewSample={{
            originalFileName: pdfFileName || "document.pdf",
            index: 1,
            totalFiles: 10,
          }}
          theme="sky"
          defaultOpen
        >
          <div className="pt-2">
            <SelectInput
              label={t("settings.dpi")}
              value={String(pdfToImagesConfig.dpi)}
              options={dpiOptions}
              onChange={(v) =>
                onPdfToImagesConfigChange({
                  ...pdfToImagesConfig,
                  dpi: Number(v) || 150,
                })
              }
            />
          </div>
        </QuickExportSelector>
      ),
    });
  }

  return <WorkspaceConfigSidebarPanel items={sidebarItems} twoColumn={false} />;
}
