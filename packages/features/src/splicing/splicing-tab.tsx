import { arrayMove } from "@dnd-kit/sortable";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Trash2 } from "lucide-react";

import { APP_CONFIG } from "@imify/core/config";
import { mapQuickExportToEngineConfig } from "@imify/core";
import { buildResizeQuickStatsFromDimensions } from "@imify/core/resize-quick-stats";
import type { ConversionProgressPayload } from "@imify/core/types";
import { useTranslation } from "@imify/i18n";
import { fetchRemoteImagesFromUrls } from "@imify/engine/converter/remote-image-import";
import { useSplicingExport } from "./use-splicing-export";

import {
  toast,
  confirmHeavyPreviewWarning,
  promptRenameInput,
  openImportProgress,
  updateImportProgress,
  closeImportProgress,
} from "@imify/stores";
import type {
  SplicingImageItem,
  LayoutResult,
  SplicingPreset,
  SplicingDirection,
} from "./types";
import {
  ExportSplitButton,
  type ExportSplitMode,
} from "../shared/export-split-button";
import { SplicingWorkspace } from "./splicing-workspace";
import { SplicingWorkspaceShell } from "./splicing-workspace-shell";
import { SplicingQuickActionsMenu } from "./splicing-quick-actions-menu";
import {
  Button,
  PreviewInteractionModeToggle,
  type PreviewInteractionMode,
  Subheading,
  MutedText,
} from "@imify/ui";
import {
  useSplicingStore,
  normalizePreviewQualityPercent,
  resolveLayoutConfig,
  resolveCanvasStyle,
  resolveImageStyle,
} from "@imify/stores/stores/splicing-store";
import { useBatchStore } from "@imify/stores/stores/batch-store";
import { useShortcutActions } from "../shared/use-shortcut-actions";
import { useShortcutPreferences } from "@imify/stores/use-shortcut-preferences";
import { useClipboardImageIntake } from "../shared/use-clipboard-image-intake";
import {
  hasFileDragPayload,
  isCommonImageFile,
  sanitizeFile,
  decodeFileToImageSource,
} from "../shared/image-file-utils";
import type { SplicingExportMode } from "./use-splicing-export";

const THUMB_MAX = 256;

async function generateThumbnail(
  file: File,
): Promise<{ url: string; width: number; height: number }> {
  const img = await decodeFileToImageSource(file);
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  const scale = Math.min(1, THUMB_MAX / Math.max(width, height));
  const tw = Math.max(1, Math.round(width * scale));
  const th = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Cannot create thumbnail canvas context");
  }

  ctx.drawImage(img, 0, 0, tw, th);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error("Canvas toBlob failed"));
    }, "image/png");
  });
  const url = URL.createObjectURL(blob);

  return { url, width, height };
}

function maxPlacementsPerGroup(layout: LayoutResult): number {
  if (layout.groups.length === 0) return 0;
  return Math.max(...layout.groups.map((g) => g.placements.length));
}

function buildGridStatsLabel(
  preset: SplicingPreset,
  primary: SplicingDirection,
  secondary: SplicingDirection,
  layout: LayoutResult | null,
  t: (key: string, options?: any) => string,
): string | null {
  if (!layout || layout.groups.length === 0) return null;

  const groupCount = layout.groups.length;
  const perGroupMax = maxPlacementsPerGroup(layout);

  if (preset === "bento") {
    const isVerticalFlow = primary === "vertical" && secondary === "vertical";
    const isFixedVertical =
      primary === "horizontal" && secondary === "vertical";
    if (isVerticalFlow || isFixedVertical) {
      return groupCount === 1
        ? `1 ${t("workspace.statsColumn")}`
        : `${groupCount} ${t("workspace.statsColumns")}`;
    }
    const rowText =
      groupCount === 1 ? t("workspace.statsRow") : t("workspace.statsRows");
    const colText =
      perGroupMax === 1
        ? t("workspace.statsColumn")
        : t("workspace.statsColumns");
    return `${groupCount} ${rowText} × ${perGroupMax} ${colText}`;
  }

  if (preset === "stitch_vertical") {
    return perGroupMax === 1
      ? `1 ${t("workspace.statsRow")}`
      : `${perGroupMax} ${t("workspace.statsRows")}`;
  }

  if (preset === "stitch_horizontal") {
    return perGroupMax === 1
      ? `1 ${t("workspace.statsColumn")}`
      : `${perGroupMax} ${t("workspace.statsColumns")}`;
  }

  if (preset === "grid") {
    const rowText =
      groupCount === 1 ? t("workspace.statsRow") : t("workspace.statsRows");
    const colText =
      perGroupMax === 1
        ? t("workspace.statsColumn")
        : t("workspace.statsColumns");
    return `${groupCount} ${rowText} × ${perGroupMax} ${colText}`;
  }

  return null;
}

function shouldWarnHeavySplicingPreviewQuality(
  nextPercent: number,
  imageList: SplicingImageItem[],
  skipPreference: boolean,
): boolean {
  if (skipPreference || nextPercent < 50) return false;
  const cfg = APP_CONFIG.SPLICING;
  if (imageList.length >= cfg.HEAVY_PREVIEW_QUALITY_WARNING_IMAGE_COUNT)
    return true;
  const totalPixels = imageList.reduce(
    (s, img) => s + img.originalWidth * img.originalHeight,
    0,
  );
  return totalPixels >= cfg.HEAVY_PREVIEW_QUALITY_WARNING_TOTAL_PIXELS;
}

interface SplicingTabProps {
  onRegisterPreviewQualityChangeHandler?: (
    handler: ((next: number) => void) | null,
  ) => void;
  onRootClick?: () => void;
}

export function SplicingTab({
  onRegisterPreviewQualityChangeHandler,
  onRootClick,
}: SplicingTabProps) {
  const { t } = useTranslation("splicing");
  const [images, setImages] = useState<SplicingImageItem[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [layoutResult, setLayoutResult] = useState<LayoutResult | null>(null);
  const setPreviewBentoFlowGroupCount = useSplicingStore(
    (s) => s.setPreviewBentoFlowGroupCount,
  );

  const handleLayoutComputed = useCallback(
    (layout: LayoutResult | null) => {
      setLayoutResult(layout);
      setPreviewBentoFlowGroupCount(
        layout && layout.groups.length > 0 ? layout.groups.length : null,
      );
    },
    [setPreviewBentoFlowGroupCount],
  );

  useEffect(() => {
    if (images.length === 0) {
      setPreviewBentoFlowGroupCount(null);
    }
  }, [images.length, setPreviewBentoFlowGroupCount]);

  const [previewInteractionMode, setPreviewInteractionMode] =
    useState<PreviewInteractionMode>("zoom");
  const { getShortcutLabel } = useShortcutPreferences();

  const splicingPreviewShortcutsEnabled = images.length > 0;

  useShortcutActions([
    {
      actionId: "global.preview.pan_mode",
      enabled: splicingPreviewShortcutsEnabled,
      handler: () => setPreviewInteractionMode("pan"),
    },
    {
      actionId: "global.preview.zoom_mode",
      enabled: splicingPreviewShortcutsEnabled,
      handler: () => setPreviewInteractionMode("zoom"),
    },
    {
      actionId: "global.preview.idle_mode",
      enabled: splicingPreviewShortcutsEnabled,
      handler: () => setPreviewInteractionMode("idle"),
    },
  ]);

  useClipboardImageIntake({
    mode: "multiple",
    onImages: (files) => void addFiles(files),
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesCountRef = useRef(0);
  const previewQualityRenderRef = useRef<{
    toastId: string;
    expectedCount: number;
    requiresNumbering: boolean;
    previewDone: boolean;
    numberingDone: boolean;
    qualityPercent: number;
  } | null>(null);

  const {
    preset,
    primaryDirection,
    secondaryDirection,
    gridCount,
    flowMaxSize,
    flowSplitOverflow,
    alignment,
    imageAppearanceDirection,
  } = useSplicingStore((s) => s.layout);

  const {
    padding: canvasPadding,
    mainSpacing,
    crossSpacing,
    borderRadius: canvasBorderRadius,
    borderWidth: canvasBorderWidth,
    borderColor: canvasBorderColor,
    backgroundColor,
  } = useSplicingStore((s) => s.canvas);

  const {
    resizeMode: imageResize,
    fitValue: imageFitValue,
    applyTo: imageApplyTo,
    padding: imagePadding,
    paddingColor: imagePaddingColor,
    borderRadius: imageBorderRadius,
    borderWidth: imageBorderWidth,
    borderColor: imageBorderColor,
  } = useSplicingStore((s) => s.image);

  const exportSettings = useSplicingStore((s) => s.exportSettings);
  const captionConfig = useSplicingStore((s) => s.captionConfig);
  const captionTexts = useSplicingStore((s) => s.captionTexts);
  const setCaptionText = useSplicingStore((s) => s.setCaptionText);
  const clearCaptionTexts = useSplicingStore((s) => s.clearCaptionTexts);
  const previewQualityPercent = useSplicingStore(
    (s) => s.previewQualityPercent,
  );
  const previewShowImageNumber = useSplicingStore(
    (s) => s.previewShowImageNumber,
  );
  const setPreviewQualityPercent = useSplicingStore(
    (s) => s.setPreviewQualityPercent,
  );
  const setPreviewShowImageNumber = useSplicingStore(
    (s) => s.setPreviewShowImageNumber,
  );
  const setResizeQuickStats = useSplicingStore((s) => s.setResizeQuickStats);
  const skipDownloadConfirm = useBatchStore(
    (state) => state.skipDownloadConfirm,
  );
  const skipSplicingHeavyPreviewQualityWarning = useBatchStore(
    (state) => state.skipSplicingHeavyPreviewQualityWarning,
  );
  const canExportPdf = true;

  const storeState = useSplicingStore.getState();
  const layoutConfig = useMemo(
    () => resolveLayoutConfig(storeState),
    [storeState.layout],
  );
  const canvasStyle = useMemo(
    () => resolveCanvasStyle(storeState),
    [storeState.canvas],
  );
  const imageStyle = useMemo(
    () => resolveImageStyle(storeState),
    [storeState.image],
  );
  useEffect(() => {
    setResizeQuickStats(
      buildResizeQuickStatsFromDimensions(
        images.map((image) => ({
          width: image.originalWidth,
          height: image.originalHeight,
        })),
      ),
    );
  }, [images, setResizeQuickStats]);

  const previewImagesTotalPixels = useMemo(
    () =>
      images.reduce((s, img) => s + img.originalWidth * img.originalHeight, 0),
    [images],
  );

  const pushPreviewQualityToast = useCallback(
    (payload: ConversionProgressPayload) => {
      toast.progress(payload);
    },
    [],
  );

  const applyPreviewQualityChange = useCallback(
    (rawNext: number) => {
      const next = normalizePreviewQualityPercent(rawNext);
      const prev = useSplicingStore.getState().previewQualityPercent;
      if (next === prev) {
        return;
      }
      setPreviewQualityPercent(next);
      if (images.length === 0) {
        return;
      }
      const toastId = `splicing_preview_quality_${Date.now()}`;
      previewQualityRenderRef.current = {
        toastId,
        expectedCount: images.length,
        requiresNumbering: previewShowImageNumber,
        previewDone: false,
        numberingDone: !previewShowImageNumber,
        qualityPercent: next,
      };
      pushPreviewQualityToast({
        id: toastId,
        fileName: t("toasts.previewQualityToast", { percent: next }),
        targetFormat: mapQuickExportToEngineConfig(exportSettings.format)
          .targetFormat as any,
        status: "processing",
        percent: 5,
        message: t("toasts.previewQualityMsg"),
      });
    },
    [
      images.length,
      previewShowImageNumber,
      exportSettings.format,
      setPreviewQualityPercent,
      pushPreviewQualityToast,
    ],
  );

  const handlePreviewQualitySelectChange = useCallback(
    async (raw: number) => {
      const next = normalizePreviewQualityPercent(raw);
      if (
        shouldWarnHeavySplicingPreviewQuality(
          next,
          images,
          skipSplicingHeavyPreviewQualityWarning,
        )
      ) {
        const confirmed = await confirmHeavyPreviewWarning(
          images.length,
          previewImagesTotalPixels,
        );
        if (!confirmed) return;
      }
      applyPreviewQualityChange(next);
    },
    [
      images,
      skipSplicingHeavyPreviewQualityWarning,
      previewImagesTotalPixels,
      applyPreviewQualityChange,
    ],
  );

  useEffect(() => {
    onRegisterPreviewQualityChangeHandler?.(handlePreviewQualitySelectChange);
    return () => {
      onRegisterPreviewQualityChangeHandler?.(null);
    };
  }, [onRegisterPreviewQualityChangeHandler, handlePreviewQualitySelectChange]);

  useEffect(() => {
    if (images.length > 0) return;
    previewQualityRenderRef.current = null;
  }, [images.length]);

  useEffect(() => {
    imagesCountRef.current = images.length;
  }, [images.length]);

  const addFiles = useCallback(
    async (files: File[]) => {
      const imageFiles = files.filter((f) => isCommonImageFile(f));
      if (imageFiles.length === 0) return;

      openImportProgress({ totalCount: imageFiles.length });

      try {
        const newItems: SplicingImageItem[] = [];
        for (let i = 0; i < imageFiles.length; i++) {
          const rawFile = imageFiles[i];
          try {
            const file = await sanitizeFile(rawFile);
            const thumb = await generateThumbnail(file);
            newItems.push({
              id: `splice_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              file,
              thumbnailUrl: thumb.url,
              originalWidth: thumb.width,
              originalHeight: thumb.height,
            });
          } catch {
            // Skip invalid files
          }

          updateImportProgress(i + 1, imageFiles.length, rawFile.name);
        }

        if (newItems.length === 0) {
          toast.error(t("toasts.importFailed"));
          return;
        }

        setImages((prev) => [...prev, ...newItems]);
        toast.success(
          t("toasts.importCompleteDesc", { count: newItems.length }) ||
            `Imported ${newItems.length} images`,
        );

        // Automatically open the mobile configuration bottom sheet when images are loaded
        if (typeof window !== "undefined") {
          const { useWorkspaceHeaderStore } = require("@imify/stores");
          useWorkspaceHeaderStore.getState().setIsMobileSidebarOpen(true);
        }
      } finally {
        closeImportProgress();
      }
    },
    [t],
  );

  const finalizePreviewQualityToast = useCallback(
    (toastId: string, qualityPercent: number) => {
      previewQualityRenderRef.current = null;
      toast.progress({
        id: toastId,
        fileName: t("toasts.previewQualityToast", { percent: qualityPercent }),
        targetFormat: mapQuickExportToEngineConfig(exportSettings.format)
          .targetFormat as any,
        status: "success",
        percent: 100,
        message: t("toasts.previewUpdated"),
      });
    },
    [exportSettings.format, t],
  );

  const handlePreviewSourcesProgress = useCallback(
    (p: { completed: number; total: number }) => {
      const pending = previewQualityRenderRef.current;
      if (!pending) {
        return;
      }
      const ratio = p.total > 0 ? p.completed / p.total : 0;
      const percent = Math.min(88, 5 + Math.round(ratio * 83));
      toast.progress({
        id: pending.toastId,
        fileName: t("toasts.previewQualityToast", {
          percent: pending.qualityPercent,
        }),
        targetFormat: mapQuickExportToEngineConfig(exportSettings.format)
          .targetFormat as any,
        status: "processing",
        percent,
        message:
          p.total > 0
            ? t("toasts.previewScale", {
                completed: p.completed,
                total: p.total,
              })
            : t("toasts.previewQualityMsg"),
      });
    },
    [exportSettings.format, t],
  );

  const handlePreviewRendered = useCallback(
    (imageCount: number) => {
      const qualityPending = previewQualityRenderRef.current;
      if (qualityPending && imageCount >= qualityPending.expectedCount) {
        qualityPending.previewDone = true;
        if (!qualityPending.requiresNumbering || qualityPending.numberingDone) {
          finalizePreviewQualityToast(
            qualityPending.toastId,
            qualityPending.qualityPercent,
          );
        } else {
          pushPreviewQualityToast({
            id: qualityPending.toastId,
            fileName: t("toasts.previewQualityToast", {
              percent: qualityPending.qualityPercent,
            }),
            targetFormat: mapQuickExportToEngineConfig(exportSettings.format)
              .targetFormat as any,
            status: "processing",
            percent: 90,
            message: t("toasts.importNumbers"),
          });
        }
      }
    },
    [
      exportSettings.format,
      finalizePreviewQualityToast,
      pushPreviewQualityToast,
      t,
    ],
  );

  const handlePreviewNumberingProgress = useCallback(
    (payload: {
      status: "processing" | "done";
      completed: number;
      total: number;
    }) => {
      const qualityPending = previewQualityRenderRef.current;
      if (qualityPending?.requiresNumbering) {
        if (payload.status === "processing") {
          const ratio =
            payload.total > 0 ? payload.completed / payload.total : 0;
          const percent = Math.min(99, 90 + Math.round(ratio * 9));
          pushPreviewQualityToast({
            id: qualityPending.toastId,
            fileName: t("toasts.previewQualityToast", {
              percent: qualityPending.qualityPercent,
            }),
            targetFormat: mapQuickExportToEngineConfig(exportSettings.format)
              .targetFormat as any,
            status: "processing",
            percent,
            message: t("toasts.importNumbersProg", {
              completed: payload.completed,
              total: payload.total,
            }),
          });
        } else {
          qualityPending.numberingDone = true;
          if (qualityPending.previewDone) {
            finalizePreviewQualityToast(
              qualityPending.toastId,
              qualityPending.qualityPercent,
            );
          }
        }
      }
    },
    [
      exportSettings.format,
      finalizePreviewQualityToast,
      pushPreviewQualityToast,
      t,
    ],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (!hasFileDragPayload(e.dataTransfer)) {
        return;
      }
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      void addFiles(files);
    },
    [addFiles],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      void addFiles(files);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [addFiles],
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemove = useCallback((id: string) => {
    setImages((prev) => {
      const removed = prev.find((img) => img.id === id);
      if (removed) URL.revokeObjectURL(removed.thumbnailUrl);
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setImages((prev) => arrayMove(prev, fromIndex, toIndex));
  }, []);

  const handleAddMore = useCallback(() => {
    openFilePicker();
  }, [openFilePicker]);

  const handleClearAll = useCallback(() => {
    for (const img of images) {
      URL.revokeObjectURL(img.thumbnailUrl);
    }
    setImages([]);
    setLayoutResult(null);
    clearCaptionTexts();
  }, [images, clearCaptionTexts]);
  const exportTargetCount =
    exportSettings.exportMode === "single"
      ? 1
      : layoutResult?.groups.length ?? 0;
  const { performExport } = useSplicingExport({
    images,
    exportTargetCount,
    isExporting,
    setIsExporting,
  });

  const primaryExportMode: "zip" | "one_by_one" =
    exportSettings.exportMode === "single" ? "one_by_one" : "zip";
  const handleExportAction = useCallback(
    async (mode: ExportSplitMode) => {
      const customInput = await promptRenameInput(
        exportSettings.fileNamePattern,
      );
      if (customInput === null) return;
      void performExport(mode as SplicingExportMode, customInput);
    },
    [performExport, exportSettings.fileNamePattern],
  );

  const hasImages = images.length > 0;
  const gridStatsLabel = useMemo(
    () =>
      buildGridStatsLabel(
        preset,
        primaryDirection,
        secondaryDirection,
        layoutResult,
        t,
      ),
    [preset, primaryDirection, secondaryDirection, layoutResult, t],
  );
  const dimensionLabel = layoutResult
    ? `${layoutResult.canvasWidth} x ${layoutResult.canvasHeight} px${
        gridStatsLabel ? ` · ${gridStatsLabel}` : ""
      }`
    : null;
  const workspaceContent = (
    <div className="p-0">
      {hasImages ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="min-w-0">
            <Subheading className="truncate">{t("workspace.title")}</Subheading>
            {dimensionLabel && (
              <MutedText className="text-xs mt-0.5 truncate">
                {dimensionLabel}
              </MutedText>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PreviewInteractionModeToggle
              mode={previewInteractionMode}
              onChange={setPreviewInteractionMode}
              zoomKeyHint={getShortcutLabel("global.preview.zoom_mode")}
              panKeyHint={getShortcutLabel("global.preview.pan_mode")}
              idleKeyHint={getShortcutLabel("global.preview.idle_mode")}
            />
            <SplicingQuickActionsMenu disabled={isExporting} />
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearAll}
                disabled={isExporting}
              >
                <Trash2 size={14} />
                {t("workspace.clear")}
              </Button>
              <ExportSplitButton
                onExport={handleExportAction}
                isLoading={isExporting}
                primaryMode={primaryExportMode}
                oneByOneCount={exportTargetCount}
                showPdfOptions={canExportPdf}
              />
            </div>
          </div>
        </div>
      ) : null}

      <SplicingWorkspace
        hasImages={hasImages}
        fileInputRef={fileInputRef}
        images={images}
        layoutConfig={layoutConfig}
        canvasStyle={canvasStyle}
        imageStyle={imageStyle}
        imageResize={imageResize}
        imageFitValue={imageFitValue}
        imageApplyTo={imageApplyTo}
        previewInteractionMode={previewInteractionMode}
        previewQualityPercent={previewQualityPercent}
        previewShowImageNumber={previewShowImageNumber}
        captionMode={captionConfig.mode}
        captionTexts={captionTexts}
        onCaptionTextChange={setCaptionText}
        onLayoutComputed={handleLayoutComputed}
        onPreviewRendered={handlePreviewRendered}
        onPreviewSourcesProgress={handlePreviewSourcesProgress}
        onPreviewNumberingProgress={handlePreviewNumberingProgress}
        onOpenFilePicker={openFilePicker}
        onDropFiles={handleDrop}
        onFileInput={handleFileInput}
        onRemoveImage={handleRemove}
        onReorderImage={handleReorder}
        onAddMore={handleAddMore}
        onPreviewQualityChange={handlePreviewQualitySelectChange}
        onPreviewShowImageNumberChange={setPreviewShowImageNumber}
        onPasteFiles={addFiles}
        onProcessUrls={async (urls) => {
          const { files } = await fetchRemoteImagesFromUrls(urls);
          if (files.length) await addFiles(files);
        }}
      />
    </div>
  );

  return (
    <SplicingWorkspaceShell
      workspace={workspaceContent}
      onRootClick={onRootClick}
    />
  );
}
