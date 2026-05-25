import React, { useEffect, useMemo } from "react";

import { getCanonicalExtension } from "@imify/core/download-utils";
import type { PerformancePreferences } from "../processor/performance-preferences";
import type { SplicingImageResize } from "./types";
import {
  useSplicingStore,
  resolveLayoutConfig,
  resolveCanvasStyle,
  resolveImageStyle,
} from "@imify/stores/stores/splicing-store";
import {
  ALIGNMENT_OPTIONS,
  deriveBentoLayoutMode,
  getAvailableExportModes,
} from "./splicing-sidebar-fields";
import { SplicingExportPanel } from "./splicing-export-panel";
import { LayoutSettingsAccordion } from "./layout-settings-accordion";
import { CanvasSettingsAccordion } from "./canvas-settings-accordion";
import { ImageSettingsAccordion } from "./image-settings-accordion";
import { PreviewSettingsAccordion } from "./preview-settings-accordion";
import {
  AccordionCard,
  WorkspaceConfigSidebarPanel,
  type WorkspaceConfigSidebarItem,
} from "@imify/ui";
import { Stamp } from "lucide-react";
import { PresetSelector } from "../processor/preset-selector";
import { useIdentifiedPresetLoader } from "../shared/use-identified-preset-loader";
import { VIRTUAL_DEFAULT_PNG_PRESET } from "../processor/preset-utils";
import {
  type SavedSetupPreset,
  useBatchStore,
} from "@imify/stores/stores/batch-store";

interface SplicingSidebarPanelProps {
  performancePreferences: PerformancePreferences;
  onPreviewQualityChange: (next: number) => void;
  onOpenSettings: () => void;
  enableWideSidebarGrid?: boolean;
}

const SPLICING_TARGET_FORMATS: string[] = [
  "png",
  "webp",
  "avif",
  "jxl",
  "jpg",
  "mozjpeg",
  "bmp",
  "tiff",
];

export function SplicingSidebarPanel({
  performancePreferences,
  onPreviewQualityChange,
  onOpenSettings,
  enableWideSidebarGrid = false,
}: SplicingSidebarPanelProps) {
  const layout = useSplicingStore((s) => s.layout);
  const canvas = useSplicingStore((s) => s.canvas);
  const image = useSplicingStore((s) => s.image);
  const resizeQuickStats = useSplicingStore((s) => s.resizeQuickStats);
  const isImageResizeOpen = useSplicingStore((s) => s.isImageResizeOpen);

  const exportSettings = useSplicingStore((s) => s.exportSettings);
  const activePresetId = useSplicingStore((s) => s.activePresetId);

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
  const setExportSettings = useSplicingStore((s) => s.setExportSettings);
  const setIsImageResizeOpen = useSplicingStore((s) => s.setIsImageResizeOpen);
  const setPreviewShowImageNumber = useSplicingStore(
    (s) => s.setPreviewShowImageNumber,
  );
  const applyPreset = useSplicingStore((s) => s.applyPreset);
  const resetToDefault = useSplicingStore((s) => s.resetToDefault);

  const identifiedPresetId = `preset_splicing_${layout.preset}`;
  const identifiedPresetName = `Splicing #${layout.preset.split("_").pop()}`;
  const identifiedPresetColor = "#f97316";

  const splicingIdentifiedPreset: SavedSetupPreset = useMemo(
    () => ({
      ...VIRTUAL_DEFAULT_PNG_PRESET,
      id: identifiedPresetId,
      name: identifiedPresetName,
      highlightColor: identifiedPresetColor,
      config: {
        ...VIRTUAL_DEFAULT_PNG_PRESET.config,
        targetFormat: exportSettings.targetFormat as any,
        quality: exportSettings.quality,
        formatOptions: exportSettings.codecOptions as any,
        fileNamePattern: exportSettings.fileNamePattern,
      },
    }),
    [
      identifiedPresetId,
      identifiedPresetName,
      identifiedPresetColor,
      exportSettings,
    ],
  );

  useIdentifiedPresetLoader(
    splicingIdentifiedPreset,
    activePresetId,
    applyPreset,
  );

  const bentoLayoutMode = deriveBentoLayoutMode(
    layout.primaryDirection,
    layout.secondaryDirection,
  );
  /** For Bento, non-start alignments only apply when preview has at least 2 lines (columns/rows). */
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

  const batchTargetFormat = useBatchStore((s) => s.targetFormat);
  const batchQuality = useBatchStore((s) => s.quality);
  const batchFileNamePattern = useBatchStore((s) => s.fileNamePattern);
  const batchFormatOptions = useBatchStore((s) => s.formatOptions);

  // Sync global batch store changes to local store when in "Custom" mode (activePresetId is null)
  useEffect(() => {
    if (activePresetId === null) {
      applyPreset({
        id: identifiedPresetId,
        name: identifiedPresetName,
        highlightColor: identifiedPresetColor,
        config: {
          ...VIRTUAL_DEFAULT_PNG_PRESET.config,
          targetFormat: batchTargetFormat,
          quality: batchQuality,
          fileNamePattern: batchFileNamePattern,
          formatOptions: batchFormatOptions,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  }, [
    activePresetId,
    batchTargetFormat,
    batchQuality,
    batchFileNamePattern,
    batchFormatOptions,
    identifiedPresetId,
    identifiedPresetName,
    identifiedPresetColor,
    applyPreset,
  ]);

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
          imagePadding={image.padding}
          imagePaddingColor={image.paddingColor}
          imageBorderRadius={image.borderRadius}
          imageBorderWidth={image.borderWidth}
          imageBorderColor={image.borderColor}
          resizeQuickStats={resizeQuickStats}
          isImageResizeOpen={isImageResizeOpen}
          onImageResizeChange={(mode) =>
            setImage({
              resizeMode: (mode === "original"
                ? "original"
                : mode) as SplicingImageResize,
            })
          }
          onImageFitValueChange={(v) => setImage({ fitValue: v })}
          onImagePaddingChange={(v) => setImage({ padding: v })}
          onImagePaddingColorChange={(v) => setImage({ paddingColor: v })}
          onImageBorderRadiusChange={(v) => setImage({ borderRadius: v })}
          onImageBorderWidthChange={(v) => setImage({ borderWidth: v })}
          onImageBorderColorChange={(v) => setImage({ borderColor: v })}
          onImageResizeOpenChange={setIsImageResizeOpen}
        />
      ),
    },
    {
      id: "output-settings",
      label: "",
      columnSpan: 2,
      content: (
        <PresetSelector
          label="Output Settings"
          theme="amber"
          identifiedPreset={splicingIdentifiedPreset}
          formatFilter={SPLICING_TARGET_FORMATS}
          activePresetId={activePresetId}
          onSelect={applyPreset}
          onReset={resetToDefault}
          renderSidebarContent={() => (
             <div className="pt-2">
               <SplicingExportPanel
                targetFormat={exportSettings.targetFormat}
                concurrency={exportSettings.concurrency}
                exportMode={exportSettings.exportMode}
                exportTrimBackground={exportSettings.trimBackground}
                availableExportModes={availableExportModes}
                advisorFormatOptions={exportSettings.codecOptions}
                onConcurrencyChange={(v) => setExportSettings({ concurrency: v })}
                onExportModeChange={(v) => setExportSettings({ exportMode: v })}
                onExportTrimBackgroundChange={(v) => setExportSettings({ trimBackground: v })}
                performancePreferences={performancePreferences}
                onOpenSettings={onOpenSettings}
                disabled={false}
              />
             </div>
          )}
          tooltipContent="Select an export preset for Image Splicing."
        />
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
