"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  PdfStudioSidebarShell,
  SharedPdfStudioPage,
} from "@imify/features/pdf-studio";
import { useWorkspaceSidebar } from "@/components/layout/workspace-layout";
import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store";
import { FeatureBreadcrumb } from "@imify/features/shared/feature-breadcrumb";
import { useWideSidebarGridEnabled } from "@/hooks/use-wide-sidebar-grid";
import { useTranslation } from "@imify/i18n";
import type {
  ImagesToPdfConfig,
  PdfStudioMode,
  PdfToImagesConfig,
} from "@imify/features/pdf-studio/types";

export function PdfStudioPage() {
  const { t } = useTranslation("common");
  const enableWideSidebarGrid = useWideSidebarGridEnabled();

  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection);
  const setHeaderActions = useWorkspaceHeaderStore((state) => state.setActions);
  const setHeaderBreadcrumb = useWorkspaceHeaderStore(
    (state) => state.setBreadcrumb,
  );
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader);

  // Local state mirrored for sidebar shell
  const [sidebarState, setSidebarState] = useState<{
    hasContent: boolean;
    mode: PdfStudioMode;
    imagesToPdfConfig: ImagesToPdfConfig;
    pdfToImagesConfig: PdfToImagesConfig;
    pdfFileName?: string;
    onImagesToPdfConfigChange: (config: ImagesToPdfConfig) => void;
    onPdfToImagesConfigChange: (config: PdfToImagesConfig) => void;
  }>({
    hasContent: false,
    mode: "images-to-pdf",
    imagesToPdfConfig: {
      resizeMode: "inherit",
      resizeValue: 1280,
      resizeApplyTo: "width",
      resizeWidth: 1280,
      resizeHeight: 960,
      resizeAspectMode: "original",
      resizeAspectRatio: "16:9",
      resizeFitMode: "fill",
      resizeContainBackground: "#FFFFFF",
      resamplingAlgorithm: "lanczos3",
      paperSize: "A4",
      dpi: 300,
      margin: 0,
    },
    pdfToImagesConfig: {
      format: "png",
      dpi: 150,
      fileNamePattern: "[OriginalName]_page_[Index]",
      pageSelectionMode: "all",
      customPageRange: "",
    },
    pdfFileName: undefined,
    onImagesToPdfConfigChange: () => {},
    onPdfToImagesConfigChange: () => {},
  });

  const sidebar = useMemo(
    () => (
      <PdfStudioSidebarShell
        hasContent={sidebarState.hasContent}
        mode={sidebarState.mode}
        imagesToPdfConfig={sidebarState.imagesToPdfConfig}
        onImagesToPdfConfigChange={sidebarState.onImagesToPdfConfigChange}
        pdfToImagesConfig={sidebarState.pdfToImagesConfig}
        onPdfToImagesConfigChange={sidebarState.onPdfToImagesConfigChange}
        pdfFileName={sidebarState.pdfFileName}
        enableWideSidebarGrid={enableWideSidebarGrid}
      />
    ),
    [sidebarState, enableWideSidebarGrid],
  );

  useWorkspaceSidebar(sidebar, t("toolSettings"));

  useEffect(() => {
    return () => {
      resetHeader();
    };
  }, [resetHeader]);

  useEffect(() => {
    setHeaderSection("PDF Studio");
    setHeaderActions(null);
    setHeaderBreadcrumb(<FeatureBreadcrumb compact rootToolId="pdf-studio" />);
  }, [setHeaderActions, setHeaderBreadcrumb, setHeaderSection]);

  return (
    <SharedPdfStudioPage
      renderWorkspace={(props) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          setSidebarState({
            hasContent: props.hasContent,
            mode: props.mode,
            imagesToPdfConfig: props.imagesToPdfConfig,
            pdfToImagesConfig: props.pdfToImagesConfig,
            pdfFileName: props.pdfFile?.name,
            onImagesToPdfConfigChange: props.onImagesToPdfConfigChange,
            onPdfToImagesConfigChange: props.onPdfToImagesConfigChange,
          });
        }, [
          props.hasContent,
          props.mode,
          props.imagesToPdfConfig,
          props.pdfToImagesConfig,
          props.pdfFile?.name,
          props.onImagesToPdfConfigChange,
          props.onPdfToImagesConfigChange,
        ]);

        return null;
      }}
    />
  );
}
