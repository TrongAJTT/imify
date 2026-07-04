import React from "react";
import type {
  SavedSetupPreset,
  SetupContext,
} from "@imify/stores/stores/batch-store";
import { Shield, Tooltip } from "@imify/ui";
import { FileCode, Gauge, Maximize, Type, Pointer } from "lucide-react";
import { useTranslation } from "@imify/i18n";

export function ProcessorPresetDetail({
  preset,
  alwaysVibrant = false,
  onClick,
}: {
  preset: SavedSetupPreset;
  context: SetupContext;
  alwaysVibrant?: boolean;
  onClick?: () => void;
}) {
  const { t } = useTranslation("processor");
  const config = preset.config;
  const rawFormat =
    config.targetFormat === "mozjpeg" ? "jpg" : config.targetFormat;
  const formatLabel = rawFormat ? rawFormat.toUpperCase() : "—";
  const qualityLabel =
    config.quality !== undefined ? `${config.quality}%` : "—";
  const namePattern = config.fileNamePattern || "[OriginalName]";

  let resizeLabel = "—";
  if (config.resizeMode === "none") resizeLabel = "Original";
  else if (config.resizeMode === "set_size")
    resizeLabel = `${config.resizeWidth}×${config.resizeHeight}px`;
  else if (config.resizeMode === "page_size") resizeLabel = config.paperSize;
  else if (config.resizeMode === "scale")
    resizeLabel = `${config.resizeValue}%`;
  else if (config.resizeMode === "change_width")
    resizeLabel = `W:${config.resizeValue}px`;
  else if (config.resizeMode === "change_height")
    resizeLabel = `H:${config.resizeValue}px`;
  else resizeLabel = config.resizeMode;

  const rightBgClassName = alwaysVibrant
    ? "bg-[var(--preset-color)] opacity-100"
    : "bg-[var(--preset-color)] opacity-50 group-hover:opacity-100 transition-opacity";

  const containerContent = (
    <div
      className={`flex flex-wrap gap-2 p-1 ${onClick ? "hover:scale-[1.02] active:scale-95 transition-all cursor-pointer" : ""}`}
    >
      {/* Format Shield */}
      <Shield
        right={formatLabel}
        icon={<FileCode size={13} />}
        rightBg={rightBgClassName}
      />

      {/* Quality Shield */}
      {config.quality !== undefined && (
        <Shield
          right={qualityLabel}
          icon={<Gauge size={13} />}
          rightBg={rightBgClassName}
        />
      )}

      {/* Resize Shield */}
      <Shield
        right={resizeLabel}
        icon={<Maximize size={13} />}
        rightBg={rightBgClassName}
        className="transition-all"
      />

      {/* Name Pattern Shield (Icon + Tooltip) */}
      <Tooltip variant="wide1" content={namePattern}>
        <Shield
          left={t("rename")}
          right={<Pointer size={13} className="my-0.5" />}
          icon={<Type size={13} />}
          rightBg={rightBgClassName}
        />
      </Tooltip>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left focus:outline-none group"
      >
        {containerContent}
      </button>
    );
  }

  return containerContent;
}
