import React, { useEffect, useMemo } from "react";

import { FeatureBreadcrumb } from "../shared/feature-breadcrumb";
import { SplicingPresetSelectView } from "./splicing-preset-select-view";
import { useSplicingPresetStore } from "@imify/stores/stores/splicing-preset-store";
import {
  useSplicingStore,
  type SplicingStoreState,
} from "@imify/stores/stores/splicing-store";
import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store";
import type { SplicingPresetConfig } from "@imify/stores/stores/splicing-preset-store";

import { DEFAULT_SPLICING_CAPTION_CONFIG } from "@imify/core";

interface SplicingWorkspaceShellProps {
  workspace: React.ReactNode;
  onRootClick?: () => void;
}

const AUTO_SAVE_DELAY_MS = 420;

function extractSplicingPresetConfig(
  splicingState: SplicingStoreState,
): SplicingPresetConfig {
  const {
    layout,
    canvas,
    image,
    exportSettings,
    captionConfig,
    previewQualityPercent,
    previewShowImageNumber,
  } = splicingState;
  return {
    preset: layout?.preset ?? "stitch_vertical",
    primaryDirection: layout?.primaryDirection ?? "vertical",
    secondaryDirection: layout?.secondaryDirection ?? "vertical",
    gridCount: layout?.gridCount ?? 2,
    flowMaxSize: layout?.flowMaxSize ?? 2000,
    flowSplitOverflow: layout?.flowSplitOverflow ?? false,
    alignment: layout?.alignment ?? "start",
    imageAppearanceDirection:
      layout?.imageAppearanceDirection ?? "top_to_bottom",
    canvasPadding: canvas?.padding ?? 0,
    mainSpacing: canvas?.mainSpacing ?? 0,
    crossSpacing: canvas?.crossSpacing ?? 0,
    canvasBorderRadius: canvas?.borderRadius ?? 0,
    canvasBorderWidth: canvas?.borderWidth ?? 0,
    canvasBorderColor: canvas?.borderColor ?? "#000000",
    backgroundColor: canvas?.backgroundColor ?? "#ffffff",
    imageResize: image?.resizeMode ?? "inherit",
    imageFitValue: image?.fitValue ?? 800,
    imageApplyTo: image?.applyTo ?? "width",
    imagePadding: image?.padding ?? 0,
    imagePaddingColor: image?.paddingColor ?? "#ffffff",
    imageBorderRadius: image?.borderRadius ?? 0,
    imageBorderWidth: image?.borderWidth ?? 0,
    imageBorderColor: image?.borderColor ?? "#000000",
    exportFormat: exportSettings?.format ?? "png",
    exportMode: exportSettings.exportMode,
    exportTrimBackground: exportSettings.trimBackground,
    exportConcurrency: exportSettings.concurrency,
    exportFileNamePattern: exportSettings.fileNamePattern,
    previewQualityPercent,
    previewShowImageNumber,
    captionMode: captionConfig?.mode ?? DEFAULT_SPLICING_CAPTION_CONFIG.mode,
    captionFontFamily:
      captionConfig?.fontFamily ?? DEFAULT_SPLICING_CAPTION_CONFIG.fontFamily,
    captionFontSize:
      captionConfig?.fontSize ?? DEFAULT_SPLICING_CAPTION_CONFIG.fontSize,
    captionTextColor:
      captionConfig?.textColor ?? DEFAULT_SPLICING_CAPTION_CONFIG.textColor,
    captionPaddingV:
      captionConfig?.paddingV ?? DEFAULT_SPLICING_CAPTION_CONFIG.paddingV,
    captionPaddingH:
      captionConfig?.paddingH ?? DEFAULT_SPLICING_CAPTION_CONFIG.paddingH,
    captionPaddingLinked:
      captionConfig?.paddingLinked ??
      DEFAULT_SPLICING_CAPTION_CONFIG.paddingLinked,
    captionContainerColor:
      captionConfig?.containerColor ??
      DEFAULT_SPLICING_CAPTION_CONFIG.containerColor,
    captionBorderRadius:
      captionConfig?.borderRadius ??
      DEFAULT_SPLICING_CAPTION_CONFIG.borderRadius,
    captionPosition:
      captionConfig?.position ?? DEFAULT_SPLICING_CAPTION_CONFIG.position,
    captionAlignment:
      captionConfig?.alignment ?? DEFAULT_SPLICING_CAPTION_CONFIG.alignment,
    captionOffsetX:
      captionConfig?.offsetX ?? DEFAULT_SPLICING_CAPTION_CONFIG.offsetX,
    captionOffsetY:
      captionConfig?.offsetY ?? DEFAULT_SPLICING_CAPTION_CONFIG.offsetY,
    captionFlipHorizontal:
      captionConfig?.flipHorizontal ??
      DEFAULT_SPLICING_CAPTION_CONFIG.flipHorizontal,
    captionFlipVertical:
      captionConfig?.flipVertical ??
      DEFAULT_SPLICING_CAPTION_CONFIG.flipVertical,
  };
}

function applySplicingPresetConfig(config: SplicingPresetConfig): void {
  useSplicingStore.setState({
    layout: {
      preset: config.preset ?? "stitch_vertical",
      primaryDirection: config.primaryDirection ?? "vertical",
      secondaryDirection: config.secondaryDirection ?? "vertical",
      gridCount: config.gridCount ?? 2,
      flowMaxSize: config.flowMaxSize ?? 2000,
      flowSplitOverflow: config.flowSplitOverflow ?? false,
      alignment: config.alignment ?? "start",
      imageAppearanceDirection:
        config.imageAppearanceDirection ?? "top_to_bottom",
    },
    canvas: {
      padding: config.canvasPadding ?? 0,
      mainSpacing: config.mainSpacing ?? 0,
      crossSpacing: config.crossSpacing ?? 0,
      borderRadius: config.canvasBorderRadius ?? 0,
      borderWidth: config.canvasBorderWidth ?? 0,
      borderColor: config.canvasBorderColor ?? "#000000",
      backgroundColor: config.backgroundColor ?? "#ffffff",
    },
    image: {
      resizeMode: config.imageResize ?? "inherit",
      fitValue: config.imageFitValue ?? 800,
      applyTo: config.imageApplyTo ?? "width",
      padding: config.imagePadding ?? 0,
      paddingColor: config.imagePaddingColor ?? "#ffffff",
      borderRadius: config.imageBorderRadius ?? 0,
      borderWidth: config.imageBorderWidth ?? 0,
      borderColor: config.imageBorderColor ?? "#000000",
    },
    captionConfig: {
      mode: config.captionMode ?? DEFAULT_SPLICING_CAPTION_CONFIG.mode,
      fontFamily:
        config.captionFontFamily ?? DEFAULT_SPLICING_CAPTION_CONFIG.fontFamily,
      fontSize:
        config.captionFontSize ?? DEFAULT_SPLICING_CAPTION_CONFIG.fontSize,
      textColor:
        config.captionTextColor ?? DEFAULT_SPLICING_CAPTION_CONFIG.textColor,
      paddingV:
        config.captionPaddingV ?? DEFAULT_SPLICING_CAPTION_CONFIG.paddingV,
      paddingH:
        config.captionPaddingH ?? DEFAULT_SPLICING_CAPTION_CONFIG.paddingH,
      paddingLinked:
        config.captionPaddingLinked ??
        DEFAULT_SPLICING_CAPTION_CONFIG.paddingLinked,
      containerColor:
        config.captionContainerColor ??
        DEFAULT_SPLICING_CAPTION_CONFIG.containerColor,
      borderRadius:
        config.captionBorderRadius ??
        DEFAULT_SPLICING_CAPTION_CONFIG.borderRadius,
      position:
        config.captionPosition ?? DEFAULT_SPLICING_CAPTION_CONFIG.position,
      alignment:
        config.captionAlignment ?? DEFAULT_SPLICING_CAPTION_CONFIG.alignment,
      offsetX: config.captionOffsetX ?? DEFAULT_SPLICING_CAPTION_CONFIG.offsetX,
      offsetY: config.captionOffsetY ?? DEFAULT_SPLICING_CAPTION_CONFIG.offsetY,
      flipHorizontal:
        config.captionFlipHorizontal ??
        DEFAULT_SPLICING_CAPTION_CONFIG.flipHorizontal,
      flipVertical:
        config.captionFlipVertical ??
        DEFAULT_SPLICING_CAPTION_CONFIG.flipVertical,
    },
    exportSettings: {
      format: (config.exportFormat as any) ?? "png",
      exportMode: config.exportMode ?? "single",
      trimBackground: config.exportTrimBackground ?? false,
      concurrency: config.exportConcurrency ?? 2,
      fileNamePattern: config.exportFileNamePattern ?? "spliced-[Index]",
    },
    previewQualityPercent: config.previewQualityPercent ?? 20,
    previewShowImageNumber: config.previewShowImageNumber ?? false,
  });
}

export function SplicingWorkspaceShell({
  workspace,
  onRootClick,
}: SplicingWorkspaceShellProps) {
  const presets = useSplicingPresetStore((state) => state.presets);
  const presetViewMode = useSplicingPresetStore(
    (state) => state.presetViewMode,
  );
  const activePresetId = useSplicingPresetStore(
    (state) => state.activePresetId,
  );
  const defaultPresetBootstrapped = useSplicingPresetStore(
    (state) => state.defaultPresetBootstrapped,
  );

  const setPresetViewMode = useSplicingPresetStore(
    (state) => state.setPresetViewMode,
  );
  const applyPreset = useSplicingPresetStore((state) => state.applyPreset);
  const ensureDefaultPreset = useSplicingPresetStore(
    (state) => state.ensureDefaultPreset,
  );
  const saveCurrentPreset = useSplicingPresetStore(
    (state) => state.saveCurrentPreset,
  );
  const updatePresetMeta = useSplicingPresetStore(
    (state) => state.updatePresetMeta,
  );
  const deletePreset = useSplicingPresetStore((state) => state.deletePreset);
  const syncActivePresetConfig = useSplicingPresetStore(
    (state) => state.syncActivePresetConfig,
  );

  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection);
  const setHeaderBreadcrumb = useWorkspaceHeaderStore(
    (state) => state.setBreadcrumb,
  );
  const setHeaderOnBack = useWorkspaceHeaderStore((state) => state.setOnBack);
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader);

  const splicingState = useSplicingStore();

  const activePreset = useMemo(
    () => presets.find((p) => p.id === activePresetId) ?? null,
    [presets, activePresetId],
  );

  useEffect(() => {
    if (presets.length === 0 && !defaultPresetBootstrapped) {
      ensureDefaultPreset();
    }
  }, [presets.length, defaultPresetBootstrapped, ensureDefaultPreset]);

  useEffect(() => {
    return () => {
      resetHeader();
    };
  }, [resetHeader]);

  useEffect(() => {
    setHeaderSection("Image Splicing");
    setHeaderBreadcrumb(
      <FeatureBreadcrumb
        compact
        rootToolId="splicing"
        activeLabel={
          presetViewMode === "workspace" ? activePreset?.name ?? null : null
        }
        onRootClick={
          presetViewMode === "workspace"
            ? () => {
                setPresetViewMode("select");
                onRootClick?.();
              }
            : undefined
        }
      />,
    );
    setHeaderOnBack(
      presetViewMode === "workspace" ? () => setPresetViewMode("select") : null,
    );
  }, [
    activePreset?.name,
    presetViewMode,
    setHeaderBreadcrumb,
    setHeaderSection,
    setHeaderOnBack,
    setPresetViewMode,
    onRootClick,
  ]);

  useEffect(() => {
    if (presetViewMode !== "workspace" || !activePreset) {
      return;
    }
    applySplicingPresetConfig(activePreset.config);
  }, [activePreset, presetViewMode]);

  const layoutJson = JSON.stringify(splicingState.layout);
  const canvasJson = JSON.stringify(splicingState.canvas);
  const imageJson = JSON.stringify(splicingState.image);
  const exportSettingsJson = JSON.stringify(splicingState.exportSettings);
  const previewQualityPercent = splicingState.previewQualityPercent;
  const previewShowImageNumber = splicingState.previewShowImageNumber;

  useEffect(() => {
    if (presetViewMode !== "workspace" || !activePresetId) {
      return;
    }
    const timeout = window.setTimeout(() => {
      syncActivePresetConfig(
        extractSplicingPresetConfig(useSplicingStore.getState()),
      );
    }, AUTO_SAVE_DELAY_MS);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    activePresetId,
    presetViewMode,
    layoutJson,
    canvasJson,
    imageJson,
    exportSettingsJson,
    previewQualityPercent,
    previewShowImageNumber,
    syncActivePresetConfig,
  ]);

  if (presetViewMode === "select") {
    return (
      <SplicingPresetSelectView
        presets={presets}
        activePresetId={activePresetId}
        onOpenPreset={applyPreset}
        onCreatePreset={(name, color) => {
          const config = extractSplicingPresetConfig(splicingState);
          saveCurrentPreset({ name, highlightColor: color, config });
        }}
        onUpdatePresetMeta={updatePresetMeta}
        onDeletePreset={deletePreset}
      />
    );
  }

  return <>{workspace}</>;
}
