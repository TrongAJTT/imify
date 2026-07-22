import React from "react";
import { ImagePlus, Upload, X } from "lucide-react";
import type { DiffImageItem } from "./types";
import { AccordionCard, MutedText, Tooltip } from "@imify/ui";
import {
  COMMON_IMAGE_ACCEPT,
  hasFileDragPayload,
  isCommonImageFile,
} from "../shared/image-file-utils";
import { useTranslation } from "@imify/i18n";
import { useBreakpoint } from "../shared/use-break-point";

interface ImageDropPairProps {
  imageA: DiffImageItem | null;
  imageB: DiffImageItem | null;
  imageC?: DiffImageItem | null;
  imageD?: DiffImageItem | null;
  onLoadA: (files: File[]) => void;
  onLoadB: (files: File[]) => void;
  onLoadC?: (files: File[]) => void;
  onLoadD?: (files: File[]) => void;
  onClearA: () => void;
  onClearB: () => void;
  onClearC?: () => void;
  onClearD?: () => void;
}

function openFilePicker(onFiles: (files: File[]) => void) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = COMMON_IMAGE_ACCEPT;
  input.onchange = () => {
    const file = input.files?.[0];
    if (file) onFiles([file]);
  };
  input.click();
}

function DropZone({
  labelKey,
  image,
  onLoad,
  onClear,
}: {
  labelKey: "imageA" | "imageB" | "imageC" | "imageD";
  image: DiffImageItem | null;
  onLoad: (files: File[]) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation("diffchecker");
  const displayLabel = t(labelKey);

  const handleDrop = (e: React.DragEvent) => {
    if (!hasFileDragPayload(e.dataTransfer)) {
      return;
    }
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(isCommonImageFile);
    if (files.length) onLoad(files);
  };

  if (image) {
    return (
      <div className="relative min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/30">
        <button
          type="button"
          onClick={onClear}
          className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/60 text-white hover:bg-slate-900"
          aria-label="Clear image"
        >
          <X size={12} />
        </button>
        <div className="absolute top-2 right-9 z-10">
          <Tooltip
            content={t("tooltips.replaceImage", { label: displayLabel })}
            variant="nowrap"
          >
            <button
              type="button"
              onClick={() => openFilePicker(onLoad)}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/60 text-white hover:bg-slate-900"
              aria-label="Replace image"
            >
              <Upload size={13} />
            </button>
          </Tooltip>
        </div>
        <div className="flex items-center gap-3">
          <img
            src={image.url}
            alt={displayLabel}
            className="h-16 w-16 shrink-0 rounded object-cover border border-slate-200 dark:border-slate-700"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500">
              {displayLabel}
            </span>
            <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">
              {image.name}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {image.width} x {image.height}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-5 md:py-8 transition-all hover:border-sky-400 dark:border-slate-600 dark:bg-slate-800/30"
      onClick={() => openFilePicker(onLoad)}
      onDragOver={(e) => {
        if (hasFileDragPayload(e.dataTransfer)) e.preventDefault();
      }}
      onDrop={handleDrop}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {displayLabel}
      </span>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-500 dark:bg-sky-900/30">
        <ImagePlus size={16} />
      </div>
      <MutedText className="text-[11px]">{t("dropOrClickBrowse")}</MutedText>
    </div>
  );
}

function AdditionalDropPair({
  imageC,
  imageD,
  onLoadC,
  onLoadD,
  onClearC,
  onClearD,
}: {
  imageC: DiffImageItem | null;
  imageD: DiffImageItem | null;
  onLoadC: (files: File[]) => void;
  onLoadD: (files: File[]) => void;
  onClearC: () => void;
  onClearD: () => void;
}) {
  const { t } = useTranslation("diffchecker");
  const isMd = useBreakpoint("md");
  const additionalDropPair = (
    <>
      <DropZone
        labelKey="imageC"
        image={imageC}
        onLoad={onLoadC}
        onClear={onClearC}
      />
      <DropZone
        labelKey="imageD"
        image={imageD}
        onLoad={onLoadD}
        onClear={onClearD}
      />
    </>
  );

  return isMd ? (
    additionalDropPair
  ) : (
    <div className="col-span-2">
      <AccordionCard
        icon={<ImagePlus size={16} />}
        defaultOpen={false}
        label={`${t("imageC")} & ${t("imageD")}`}
        childrenClassName="grid grid-cols-2 gap-2 p-2"
      >
        {additionalDropPair}
      </AccordionCard>
    </div>
  );
}

export function ImageDropPair({
  imageA,
  imageB,
  imageC = null,
  imageD = null,
  onLoadA,
  onLoadB,
  onLoadC,
  onLoadD,
  onClearA,
  onClearB,
  onClearC,
  onClearD,
}: ImageDropPairProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <DropZone
        labelKey="imageA"
        image={imageA}
        onLoad={onLoadA}
        onClear={onClearA}
      />
      <DropZone
        labelKey="imageB"
        image={imageB}
        onLoad={onLoadB}
        onClear={onClearB}
      />
      {onLoadC && onLoadD && onClearC && onClearD && (
        <AdditionalDropPair
          imageC={imageC}
          imageD={imageD}
          onLoadC={onLoadC}
          onLoadD={onLoadD}
          onClearC={onClearC}
          onClearD={onClearD}
        />
      )}
    </div>
  );
}
