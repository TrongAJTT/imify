"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Download, Grid, Monitor, Trash2 } from "lucide-react";
import type {
  DiffAlignAnchor,
  DiffAlignMode,
  DiffComputeResult,
  DiffImageItem,
  DiffViewMode,
  MultiImageLayout2,
  MultiImageLayout3,
  MultiImageLayout4,
} from "./types";
import { computeFullDiff, exportMultiImageComposite } from "./diff-engine";
import { decodeFileToImageData } from "@imify/engine/image-pipeline/decode-image-data";
import { renderImageDataPreview } from "@imify/engine/image-pipeline/render-image-data";
import { useDiffcheckerStore } from "@imify/stores/stores/diffchecker-store";
import { Button, MutedText, SplitButton, Subheading } from "@imify/ui";
import { isCommonImageFile } from "../shared/image-file-utils";
import { useClipboardImageIntake } from "../shared/use-clipboard-image-intake";
import { useTranslation } from "@imify/i18n";

export interface SharedDiffcheckerRenderProps {
  imageA: DiffImageItem | null;
  imageB: DiffImageItem | null;
  imageC: DiffImageItem | null;
  imageD: DiffImageItem | null;
  imageDataA: ImageData | null;
  imageDataB: ImageData | null;
  imageDataC: ImageData | null;
  imageDataD: ImageData | null;
  diffResult: DiffComputeResult | null;
  viewMode: DiffViewMode;
  alignAnchor: DiffAlignAnchor;
  alignMode: DiffAlignMode;
  splitPosition: number;
  overlayOpacity: number;
  isComputing: boolean;
  isExporting: boolean;
  zoom: number;
  panX: number;
  panY: number;
  multiImageLayout2: MultiImageLayout2;
  multiImageLayout3: MultiImageLayout3;
  multiImageLayout4: MultiImageLayout4;
  onLoadA: (files: File[]) => void | Promise<void>;
  onLoadB: (files: File[]) => void | Promise<void>;
  onLoadC: (files: File[]) => void | Promise<void>;
  onLoadD: (files: File[]) => void | Promise<void>;
  onClearA: () => void;
  onClearB: () => void;
  onClearC: () => void;
  onClearD: () => void;
  onExport: (
    mode?: "real_canvas" | "side_by_side_template",
  ) => void | Promise<void>;
  onSplitChange: (position: number) => void;
  onZoomChange: (zoom: number) => void;
  onPanChange: (x: number, y: number) => void;
}

interface SharedDiffcheckerPageProps {
  renderWorkspace: (props: SharedDiffcheckerRenderProps) => ReactNode;
}

async function createImageItemWithDecodedData(
  file: File,
): Promise<{ item: DiffImageItem; imageData: ImageData }> {
  const decoded = await decodeFileToImageData(file);
  const objectUrl = URL.createObjectURL(file);

  return {
    item: {
      id: `diff_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      file,
      url: objectUrl,
      width: decoded.width,
      height: decoded.height,
      name: file.name,
    },
    imageData: decoded.imageData,
  };
}

export function SharedDiffcheckerPage({
  renderWorkspace,
}: SharedDiffcheckerPageProps) {
  const { t } = useTranslation("diffchecker");
  const [imageA, setImageA] = useState<DiffImageItem | null>(null);
  const [imageB, setImageB] = useState<DiffImageItem | null>(null);
  const [imageC, setImageC] = useState<DiffImageItem | null>(null);
  const [imageD, setImageD] = useState<DiffImageItem | null>(null);

  const [imageDataA, setImageDataA] = useState<ImageData | null>(null);
  const [imageDataB, setImageDataB] = useState<ImageData | null>(null);
  const [imageDataC, setImageDataC] = useState<ImageData | null>(null);
  const [imageDataD, setImageDataD] = useState<ImageData | null>(null);

  const [diffResult, setDiffResult] = useState<DiffComputeResult | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const prevUrlsRef = useRef<string[]>([]);
  const pasteSlotRef = useRef<"A" | "B" | "C" | "D">("A");

  const viewMode = useDiffcheckerStore((s) => s.viewMode);
  const algorithm = useDiffcheckerStore((s) => s.algorithm);
  const alignMode = useDiffcheckerStore((s) => s.alignMode);
  const alignAnchor = useDiffcheckerStore((s) => s.alignAnchor);
  const overlayOpacity = useDiffcheckerStore((s) => s.overlayOpacity);
  const splitPosition = useDiffcheckerStore((s) => s.splitPosition);
  const diffThreshold = useDiffcheckerStore((s) => s.diffThreshold);
  const multiImageLayout2 = useDiffcheckerStore((s) => s.multiImageLayout2);
  const multiImageLayout3 = useDiffcheckerStore((s) => s.multiImageLayout3);
  const multiImageLayout4 = useDiffcheckerStore((s) => s.multiImageLayout4);

  const setSplitPosition = useDiffcheckerStore((s) => s.setSplitPosition);
  const setImageCount = useDiffcheckerStore((s) => s.setImageCount);

  const activeImageCount = [imageA, imageB, imageC, imageD].filter(
    Boolean,
  ).length;

  useEffect(() => {
    setImageCount(activeImageCount);
  }, [activeImageCount, setImageCount]);

  const loadFilesToSlots = useCallback(
    async (startSlot: "A" | "B" | "C" | "D", files: File[]) => {
      const validFiles = files.filter(isCommonImageFile);
      if (validFiles.length === 0) return;
      setDiffResult(null);

      const slots: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"];
      const startIndex = slots.indexOf(startSlot);

      for (let i = 0; i < validFiles.length && i < 4; i++) {
        const targetSlot = slots[(startIndex + i) % 4];
        try {
          const created = await createImageItemWithDecodedData(validFiles[i]);
          if (targetSlot === "A") {
            if (imageA) URL.revokeObjectURL(imageA.url);
            setImageA(created.item);
            setImageDataA(created.imageData);
          } else if (targetSlot === "B") {
            if (imageB) URL.revokeObjectURL(imageB.url);
            setImageB(created.item);
            setImageDataB(created.imageData);
          } else if (targetSlot === "C") {
            if (imageC) URL.revokeObjectURL(imageC.url);
            setImageC(created.item);
            setImageDataC(created.imageData);
          } else if (targetSlot === "D") {
            if (imageD) URL.revokeObjectURL(imageD.url);
            setImageD(created.item);
            setImageDataD(created.imageData);
          }
        } catch {}
      }
    },
    [imageA, imageB, imageC, imageD],
  );

  const handleLoadA = useCallback(
    async (files: File[]) => {
      await loadFilesToSlots("A", files);
    },
    [loadFilesToSlots],
  );

  const handleLoadB = useCallback(
    async (files: File[]) => {
      await loadFilesToSlots("B", files);
    },
    [loadFilesToSlots],
  );

  const handleLoadC = useCallback(
    async (files: File[]) => {
      await loadFilesToSlots("C", files);
    },
    [loadFilesToSlots],
  );

  const handleLoadD = useCallback(
    async (files: File[]) => {
      await loadFilesToSlots("D", files);
    },
    [loadFilesToSlots],
  );

  const handleClearA = useCallback(() => {
    if (imageA) URL.revokeObjectURL(imageA.url);
    setImageA(null);
    setImageDataA(null);
    setDiffResult(null);
  }, [imageA]);

  const handleClearB = useCallback(() => {
    if (imageB) URL.revokeObjectURL(imageB.url);
    setImageB(null);
    setImageDataB(null);
    setDiffResult(null);
  }, [imageB]);

  const handleClearC = useCallback(() => {
    if (imageC) URL.revokeObjectURL(imageC.url);
    setImageC(null);
    setImageDataC(null);
  }, [imageC]);

  const handleClearD = useCallback(() => {
    if (imageD) URL.revokeObjectURL(imageD.url);
    setImageD(null);
    setImageDataD(null);
  }, [imageD]);

  const handleClearAll = useCallback(() => {
    handleClearA();
    handleClearB();
    handleClearC();
    handleClearD();
    setZoom(100);
    setPanX(0);
    setPanY(0);
  }, [handleClearA, handleClearB, handleClearC, handleClearD]);

  useEffect(() => {
    if (!imageDataA || !imageDataB || activeImageCount >= 3) {
      setDiffResult(null);
      return;
    }
    let cancelled = false;
    setIsComputing(true);
    const timer = setTimeout(async () => {
      try {
        const result = await computeFullDiff(
          imageDataA,
          imageDataB,
          algorithm,
          diffThreshold,
          alignMode,
          alignAnchor,
        );
        if (cancelled) {
          URL.revokeObjectURL(result.alignedUrlA);
          URL.revokeObjectURL(result.alignedUrlB);
          URL.revokeObjectURL(result.diffImageUrl);
          return;
        }
        for (const url of prevUrlsRef.current) URL.revokeObjectURL(url);
        prevUrlsRef.current = [
          result.alignedUrlA,
          result.alignedUrlB,
          result.diffImageUrl,
        ];
        setDiffResult(result);
      } catch {
        if (!cancelled) setDiffResult(null);
      } finally {
        if (!cancelled) setIsComputing(false);
      }
    }, 50);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    imageDataA,
    imageDataB,
    algorithm,
    diffThreshold,
    alignMode,
    alignAnchor,
    activeImageCount,
  ]);

  useEffect(
    () => () => {
      for (const url of prevUrlsRef.current) URL.revokeObjectURL(url);
    },
    [],
  );

  useClipboardImageIntake({
    mode: "single",
    onImages: (files) => {
      const file = files[0];
      if (!file) return;
      if (!imageA || pasteSlotRef.current === "A") {
        void handleLoadA([file]);
        pasteSlotRef.current = "B";
      } else if (!imageB || pasteSlotRef.current === "B") {
        void handleLoadB([file]);
        pasteSlotRef.current = "C";
      } else if (!imageC || pasteSlotRef.current === "C") {
        void handleLoadC([file]);
        pasteSlotRef.current = "D";
      } else {
        void handleLoadD([file]);
        pasteSlotRef.current = "A";
      }
    },
    enabled: activeImageCount < 4,
  });

  const handleExport = useCallback(
    async (
      exportMode: "real_canvas" | "side_by_side_template" = "real_canvas",
    ) => {
      if (isExporting) return;

      const activeList = [
        imageA
          ? {
              label: t("imageA"),
              url: imageA.url,
              width: imageA.width,
              height: imageA.height,
            }
          : null,
        imageB
          ? {
              label: t("imageB"),
              url: imageB.url,
              width: imageB.width,
              height: imageB.height,
            }
          : null,
        imageC
          ? {
              label: t("imageC"),
              url: imageC.url,
              width: imageC.width,
              height: imageC.height,
            }
          : null,
        imageD
          ? {
              label: t("imageD"),
              url: imageD.url,
              width: imageD.width,
              height: imageD.height,
            }
          : null,
      ].filter(
        (
          item,
        ): item is {
          label: string;
          url: string;
          width: number;
          height: number;
        } => item !== null,
      );

      if (activeList.length === 0) return;

      setIsExporting(true);
      try {
        const blob = await exportMultiImageComposite({
          images: activeList,
          mode: exportMode,
          viewMode,
          multiImageLayout2,
          multiImageLayout3,
          multiImageLayout4,
          splitPosition,
          overlayOpacity,
          diffResultUrl: diffResult?.diffImageUrl ?? null,
        });

        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `imify-diff-${exportMode}-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Export failed:", err);
      } finally {
        setIsExporting(false);
      }
    },
    [
      imageA,
      imageB,
      imageC,
      imageD,
      isExporting,
      viewMode,
      multiImageLayout2,
      multiImageLayout3,
      multiImageLayout4,
      splitPosition,
      overlayOpacity,
      diffResult,
      t,
    ],
  );

  const hasAny = activeImageCount > 0;
  const dimensionLabel =
    imageA && imageB
      ? `${imageA.width} x ${imageA.height} vs ${imageB.width} x ${imageB.height}`
      : null;

  return (
    <div className="p-0">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Subheading>{t("title")}</Subheading>
          <MutedText className="mt-0.5 text-xs">
            {dimensionLabel ? dimensionLabel : t("dragDropTip")}
          </MutedText>
        </div>
        {hasAny ? (
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClearAll}
              disabled={isExporting}
            >
              <Trash2 size={14} />
              {t("clear")}
            </Button>
            <SplitButton
              variant="primary"
              size="sm"
              disabled={isExporting}
              label={isExporting ? t("exporting") : t("export")}
              icon={<Download size={14} />}
              onClick={() => handleExport("real_canvas")}
              options={[
                {
                  id: "real_canvas",
                  label: t("exportRealCanvas"),
                  icon: <Monitor size={14} />,
                  onClick: () => handleExport("real_canvas"),
                },
                {
                  id: "side_by_side_template",
                  label: t("exportSideBySideTemplate"),
                  icon: <Grid size={14} />,
                  onClick: () => handleExport("side_by_side_template"),
                },
              ]}
            />
          </div>
        ) : null}
      </div>
      {renderWorkspace({
        imageA,
        imageB,
        imageC,
        imageD,
        imageDataA,
        imageDataB,
        imageDataC,
        imageDataD,
        diffResult,
        viewMode,
        alignAnchor,
        alignMode,
        splitPosition,
        overlayOpacity,
        isComputing,
        isExporting,
        zoom,
        panX,
        panY,
        multiImageLayout2,
        multiImageLayout3,
        multiImageLayout4,
        onLoadA: handleLoadA,
        onLoadB: handleLoadB,
        onLoadC: handleLoadC,
        onLoadD: handleLoadD,
        onClearA: handleClearA,
        onClearB: handleClearB,
        onClearC: handleClearC,
        onClearD: handleClearD,
        onExport: handleExport,
        onSplitChange: setSplitPosition,
        onZoomChange: setZoom,
        onPanChange: (x, y) => {
          setPanX(x);
          setPanY(y);
        },
      })}
    </div>
  );
}
