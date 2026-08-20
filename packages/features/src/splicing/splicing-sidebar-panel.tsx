import React, { useEffect, useMemo } from "react";

import type { PerformancePreferences } from "../processor/performance-preferences";
import type { SplicingImageResize } from "./types";
import { useSplicingStore } from "@imify/stores/stores/splicing-store";
import {
  ALIGNMENT_OPTIONS,
  deriveBentoLayoutMode,
  getAvailableExportModes,
} from "./splicing-sidebar-fields";
import { SplicingExportPanel } from "./splicing-export-panel";
import { LayoutSettingsAccordion } from "./layout-settings-accordion";
import { CanvasSettingsAccordion } from "./canvas-settings-accordion";
import { ImageSettingsAccordion } from "./image-settings-accordion";
import { CaptionSettingsAccordion } from "./caption-settings-accordion";
import { PreviewSettingsAccordion } from "./preview-settings-accordion";
import {
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem,
} from "@imify/ui";
import { QuickExportSelector } from "../shared/quick-export-selector";
import { SPLICING_NAMING_CONFIG, type QuickExportFormat } from "@imify/core";

interface SplicingSidebarPanelProps {
  performancePreferences: PerformancePreferences;
  onPreviewQualityChange: (next: number) => void;
  onOpenSettings: () => void;
  enableWideSidebarGrid?: boolean;
}

export function SplicingSidebarPanel({
  performancePreferences,
  onPreviewQualityChange,
  onOpenSettings,
  enableWideSidebarGrid = false,
}: SplicingSidebarPanelProps) {
  const layout = useSplicingStore((s) => s.layout);
  const canvas = useSplicingStore((s) => s.canvas);
  const image = useSplicingStore((s) => s.image);
  const captionConfig = useSplicingStore((s) => s.captionConfig);
  const resizeQuickStats = useSplicingStore((s) => s.resizeQuickStats);

  const exportSettings = useSplicingStore((s) => s.exportSettings);

  const previewQualityPercent = useSplicingStore(
    (s) => s.previewQualityPercent,
  );
  const previewShowImageNumber = useSplicingStore(
    (s) => s.previewShowImageNumber,
  );
  const previewBentoFlowGroupCount = useSplicingStore(
    (s) => s.previewBentoFlowGroupCount,
  );

  const setLayout = useSplicingStore((s) => s.setLayout);
  const setCanvas = useSplicingStore((s) => s.setCanvas);
  const setImage = useSplicingStore((s) => s.setImage);
  const setCaptionConfig = useSplicingStore((s) => s.setCaptionConfig);
  const setExportSettings = useSplicingStore((s) => s.setExportSettings);

  const setPreviewShowImageNumber = useSplicingStore(
    (s) => s.setPreviewShowImageNumber,
  );

  const bentoLayoutMode = deriveBentoLayoutMode(
    layout.primaryDirection,
    layout.secondaryDirection,
  );
  const bentoAlignmentLimited =
    layout.preset === "bento" &&
    (previewBentoFlowGroupCount === null || previewBentoFlowGroupCount <= 1);
  const bentoAlignmentOptions = useMemo(
    () =>
      bentoAlignmentLimited
        ? ALIGNMENT_OPTIONS.filter((o) => o.value === "start")
        : ALIGNMENT_OPTIONS,
    [bentoAlignmentLimited],
  );

  useEffect(() => {
    if (bentoAlignmentLimited && layout.alignment !== "start") {
      setLayout({ alignment: "start" });
    }
  }, [layout.alignment, bentoAlignmentLimited, setLayout]);

  const availableExportModes = getAvailableExportModes(
    layout.preset,
    layout.preset === "bento" ? bentoLayoutMode : undefined,
  );

  const sidebarItems: WorkspaceConfigSidebarItem[] = [
    {
      id: "layout-settings",
      label: "Layout",
      columnSpan: 2,
      content: (
        <LayoutSettingsAccordion
          preset={layout.preset}
          primaryDirection={layout.primaryDirection}
          secondaryDirection={layout.secondaryDirection}
          gridCount={layout.gridCount}
          flowMaxSize={layout.flowMaxSize}
          flowSplitOverflow={layout.flowSplitOverflow}
          alignment={layout.alignment}
          imageAppearanceDirection={layout.imageAppearanceDirection}
          previewBentoFlowGroupCount={previewBentoFlowGroupCount}
          bentoLayoutMode={bentoLayoutMode}
          bentoAlignmentOptions={bentoAlignmentOptions}
          onPresetChange={(v) => setLayout({ preset: v })}
          onPrimaryDirectionChange={(v) => setLayout({ primaryDirection: v })}
          onSecondaryDirectionChange={(v) =>
            setLayout({ secondaryDirection: v })
          }
          onGridCountChange={(v) => setLayout({ gridCount: v })}
          onFlowMaxSizeChange={(v) => setLayout({ flowMaxSize: v })}
          onFlowSplitOverflowChange={(v) => setLayout({ flowSplitOverflow: v })}
          onAlignmentChange={(v) => setLayout({ alignment: v })}
          onImageAppearanceDirectionChange={(v) =>
            setLayout({ imageAppearanceDirection: v })
          }
          onImageAppearanceDirectionChangeFromPreset={(v) =>
            setLayout({ imageAppearanceDirection: v })
          }
        />
      ),
    },
    {
      id: "canvas-settings",
      label: "Canvas",
      content: (
        <CanvasSettingsAccordion
          canvasPadding={canvas.padding}
          mainSpacing={canvas.mainSpacing}
          crossSpacing={canvas.crossSpacing}
          canvasBorderRadius={canvas.borderRadius}
          canvasBorderWidth={canvas.borderWidth}
          canvasBorderColor={canvas.borderColor}
          backgroundColor={canvas.backgroundColor}
          onCanvasPaddingChange={(v) => setCanvas({ padding: v })}
          onMainSpacingChange={(v) => setCanvas({ mainSpacing: v })}
          onCrossSpacingChange={(v) => setCanvas({ crossSpacing: v })}
          onCanvasBorderRadiusChange={(v) => setCanvas({ borderRadius: v })}
          onCanvasBorderWidthChange={(v) => setCanvas({ borderWidth: v })}
          onCanvasBorderColorChange={(v) => setCanvas({ borderColor: v })}
          onBackgroundColorChange={(v) => setCanvas({ backgroundColor: v })}
        />
      ),
    },
    {
      id: "image-settings",
      label: "Image Settings",
      content: (
        <ImageSettingsAccordion
          imageResize={image.resizeMode}
          imageFitValue={image.fitValue}
          imageApplyTo={image.applyTo}
          imagePadding={image.padding}
          imagePaddingColor={image.paddingColor}
          imageBorderRadius={image.borderRadius}
          imageBorderWidth={image.borderWidth}
          imageBorderColor={image.borderColor}
          resizeQuickStats={resizeQuickStats}
          onImageResizeChange={(mode) =>
            setImage({
              resizeMode: mode as SplicingImageResize,
            })
          }
          onImageFitValueChange={(v) => setImage({ fitValue: v })}
          onImageApplyToChange={(v) => setImage({ applyTo: v })}
          onImagePaddingChange={(v) => setImage({ padding: v })}
          onImagePaddingColorChange={(v) => setImage({ paddingColor: v })}
          onImageBorderRadiusChange={(v) => setImage({ borderRadius: v })}
          onImageBorderWidthChange={(v) => setImage({ borderWidth: v })}
          onImageBorderColorChange={(v) => setImage({ borderColor: v })}
          onImageResizeOpenChange={() => {}}
        />
      ),
    },
    {
      id: "caption-settings",
      label: "Image Caption",
      content: (
        <CaptionSettingsAccordion
          captionConfig={captionConfig}
          onCaptionConfigChange={setCaptionConfig}
          resizeQuickStats={resizeQuickStats}
          imageFitValue={image.fitValue}
          imageResize={image.resizeMode}
          imageApplyTo={image.applyTo}
        />


      ),
    },
    {
      id: "output-settings",
      label: "",
      columnSpan: 2,

      content: (
        <QuickExportSelector
          format={exportSettings.format}
          onFormatChange={(format: QuickExportFormat) =>
            setExportSettings({ format })
          }
          fileNamePattern={exportSettings.fileNamePattern}
          onFileNamePatternChange={(fileNamePattern: string) =>
            setExportSettings({ fileNamePattern })
          }
          namingConfig={SPLICING_NAMING_CONFIG}
          theme="amber"
        >
          <SplicingExportPanel
            targetFormat={exportSettings.format}
            exportMode={exportSettings.exportMode}
            exportTrimBackground={exportSettings.trimBackground}
            availableExportModes={availableExportModes}
            onExportModeChange={(v) => setExportSettings({ exportMode: v })}
            onExportTrimBackgroundChange={(v) =>
              setExportSettings({ trimBackground: v })
            }
            disabled={false}
          />
        </QuickExportSelector>
      ),
    },
    {
      id: "preview-settings",
      label: "Preview Settings",
      content: (
        <PreviewSettingsAccordion
          previewQualityPercent={previewQualityPercent}
          previewShowImageNumber={previewShowImageNumber}
          onPreviewQualityChange={onPreviewQualityChange}
          onPreviewShowImageNumberChange={setPreviewShowImageNumber}
        />
      ),
    },
  ];

  return (
    <>
      <WorkspaceConfigSidebarPanel
        items={sidebarItems}
        twoColumn={enableWideSidebarGrid}
      />
    </>
  );
}
