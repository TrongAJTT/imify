"use client";

import React, { useEffect, useState } from "react";
import {
  Download,
  Edit,
  Edit3,
  LayoutGrid,
  Pin,
  PinOff,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  BaseDialog,
  Button,
  EmptyDropCard,
  SelectInput,
  Subheading,
  TextInput,
  Tooltip,
} from "@imify/ui";
import { templateStorage } from "./template-storage";
import { exportToPsd } from "./psd-export";
import {
  createLayerFillState,
  DEFAULT_CANVAS_FILL_STATE,
  type FillingTemplate,
  type TemplateSortMode,
} from "./types";
import { resolveLayerShapePoints } from "./shape-generators";

import { useTranslation } from "@imify/i18n";

export function sortFillingTemplates(
  templates: FillingTemplate[],
  mode: TemplateSortMode,
): FillingTemplate[] {
  const pinned = templates.filter((template) => template.isPinned);
  const unpinned = templates.filter((template) => !template.isPinned);

  const sortFn = (list: FillingTemplate[]) => {
    switch (mode) {
      case "recently_created":
        return [...list].sort((a, b) => b.createdAt - a.createdAt);
      case "recently_used":
        return [...list].sort(
          (a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0),
        );
      case "name_asc":
        return [...list].sort((a, b) => a.name.localeCompare(b.name));
      case "name_desc":
        return [...list].sort((a, b) => b.name.localeCompare(a.name));
      case "usage_count":
      default:
        return [...list].sort((a, b) => b.usageCount - a.usageCount);
    }
  };

  return [...sortFn(pinned), ...sortFn(unpinned)];
}

interface FillingTemplateListPanelProps {
  templates: FillingTemplate[];
  sortMode: TemplateSortMode;
  onSortModeChange: (mode: TemplateSortMode) => void;
  onCreate: () => void;
  onOpenTemplate: (template: FillingTemplate) => void;
  onEditTemplate: (template: FillingTemplate) => void;
  onRefresh: () => Promise<void>;
}

export function FillingTemplateListPanel({
  templates,
  sortMode,
  onSortModeChange,
  onCreate,
  onOpenTemplate,
  onEditTemplate,
  onRefresh,
}: FillingTemplateListPanelProps) {
  const { t } = useTranslation(["filling", "collageMaker"]);

  const SORT_OPTIONS: Array<{ value: TemplateSortMode; label: string }> = [
    { value: "usage_count", label: t("templateList.sortUsageCount") },
    { value: "recently_created", label: t("templateList.sortRecentlyCreated") },
    { value: "recently_used", label: t("templateList.sortRecentlyUsed") },
    { value: "name_asc", label: t("templateList.sortNameAsc") },
    { value: "name_desc", label: t("templateList.sortNameDesc") },
  ];

  const sorted = sortFillingTemplates(templates, sortMode);

  const [renameTemplate, setRenameTemplate] = useState<FillingTemplate | null>(
    null,
  );
  const [renameName, setRenameName] = useState("");

  const handleRenameConfirm = async () => {
    if (!renameTemplate) return;
    const trimmed = renameName.trim();
    if (!trimmed) return;

    try {
      const updated = {
        ...renameTemplate,
        name: trimmed,
        updatedAt: Date.now(),
      };
      await templateStorage.save(updated);
      await onRefresh();
      setRenameTemplate(null);
    } catch (error) {
      console.error("Failed to rename template", error);
      window.alert("Failed to rename template.");
    }
  };

  if (templates.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EmptyDropCard
          icon={<Plus size={28} className="text-sky-500" />}
          iconWrapperClassName="bg-sky-100 dark:bg-sky-900/30 border-transparent shadow-none"
          title={t("templateList.noTemplatesTitle")}
          subtitle={t("templateList.noTemplatesDesc")}
          onClick={onCreate}
        />
        <EmptyDropCard
          icon={<LayoutGrid size={28} className="text-amber-500" />}
          iconWrapperClassName="bg-amber-100 dark:bg-amber-900/30 border-transparent shadow-none"
          title={t("collageMaker:title")}
          subtitle={t("collageMaker.subtitle", {
            defaultValue: "Tạo ảnh ghép tức thì từ 2 đến 10 bức ảnh",
          })}
          onClick={() => {
            window.location.href = "/collage-maker";
          }}
        />
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Subheading>{t("templateList.title")}</Subheading>
        <div className="flex items-center gap-2">
          <Tooltip content={t("collageMaker:title")}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = "/collage-maker";
              }}
            >
              <LayoutGrid size={14} className="text-amber-500" />
              {t("collageMaker:title")}
            </Button>
          </Tooltip>
          <Button type="button" variant="primary" size="sm" onClick={onCreate}>
            <Plus size={14} />
            {t("templateList.newTemplate")}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-48">
          <SelectInput
            label={t("global.sortBy", { defaultValue: "Sort by" })}
            value={sortMode}
            options={SORT_OPTIONS}
            onChange={(value) => onSortModeChange(value as TemplateSortMode)}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sorted.map((template) => (
          <FillingTemplateCard
            key={template.id}
            template={template}
            onOpenTemplate={onOpenTemplate}
            onEditTemplate={onEditTemplate}
            onRefresh={onRefresh}
            onRenameTemplate={(tmpl) => {
              setRenameTemplate(tmpl);
              setRenameName(tmpl.name);
            }}
          />
        ))}
      </div>

      <BaseDialog
        isOpen={renameTemplate !== null}
        onClose={() => setRenameTemplate(null)}
        contentClassName="rounded-2xl w-full max-w-md"
      >
        <div className="p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <Subheading>{t("templateList.renameTitle")}</Subheading>
            <button
              type="button"
              onClick={() => setRenameTemplate(null)}
              className="rounded p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={16} className="text-slate-400" />
            </button>
          </div>

          <div className="mb-5 space-y-4">
            <TextInput
              label={t("dialog.templateName")}
              value={renameName}
              onChange={setRenameName}
              placeholder="e.g. My Photo Grid"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRenameTemplate(null)}
            >
              {t("dialog.cancel")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRenameConfirm}
              disabled={!renameName.trim()}
            >
              {t("templateList.save")}
            </Button>
          </div>
        </div>
      </BaseDialog>
    </>
  );
}

function FillingTemplateCard({
  template,
  onOpenTemplate,
  onEditTemplate,
  onRefresh,
  onRenameTemplate,
}: {
  template: FillingTemplate;
  onOpenTemplate: (template: FillingTemplate) => void;
  onEditTemplate: (template: FillingTemplate) => void;
  onRefresh: () => Promise<void>;
  onRenameTemplate: (template: FillingTemplate) => void;
}) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isExportingPsd, setIsExportingPsd] = useState(false);

  useEffect(() => {
    let disposed = false;
    let url: string | null = null;

    void templateStorage.getThumbnail(template.id).then((blob) => {
      if (!blob || disposed) {
        return;
      }
      url = URL.createObjectURL(blob);
      setThumbnailUrl(url);
    });

    return () => {
      disposed = true;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [template.id]);

  const { t } = useTranslation("filling");

  const usageText =
    template.usageCount === 1
      ? t("templateList.usedTimes", { count: 1 })
      : t("templateList.usedTimesPlural", { count: template.usageCount });
  const lastUsedText = template.lastUsedAt
    ? `${t("templateList.lastUsed")} ${formatRelativeTime(template.lastUsedAt, t)}`
    : t("templateList.neverUsed");
  const handleExportPsd = async () => {
    if (isExportingPsd) {
      return;
    }

    setIsExportingPsd(true);

    try {
      const layerFillStates = template.layers.map((layer) =>
        createLayerFillState(layer.id),
      );
      const blob = await exportToPsd(
        template,
        layerFillStates,
        DEFAULT_CANVAS_FILL_STATE,
        new Map(),
      );
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${toSafeFileName(template.name)}.psd`;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Failed to export template PSD", error);
      window.alert("Failed to export PSD for this template.");
    } finally {
      setIsExportingPsd(false);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => onOpenTemplate(template)}
        className="w-full text-left"
      >
        <div className="flex aspect-video items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-800">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={template.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <TemplatePreviewSvg template={template} />
          )}
        </div>
        <div className="p-3">
          <div className="flex items-center gap-1.5">
            {template.isPinned && (
              <Pin size={12} className="shrink-0 text-sky-500" />
            )}
            <h3 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
              {template.name}
            </h3>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            {template.canvasWidth} x {template.canvasHeight} ·{" "}
            {template.layers.length === 1
              ? t("templateList.layersCount", { count: 1 })
              : t("templateList.layersCountPlural", {
                  count: template.layers.length,
                })}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {usageText} · {lastUsedText}
          </p>
        </div>
      </button>

      <div className="absolute right-2 top-2 translate-y-1 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white/90 px-1 py-1 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/90">
          <ActionIconButton
            title={t("templateList.editTemplateTooltip")}
            icon={<Edit size={13} />}
            onClick={() => onEditTemplate(template)}
          />
          <ActionIconButton
            title={t("templateList.renameTemplateTooltip")}
            icon={<Edit3 size={13} />}
            onClick={() => onRenameTemplate(template)}
          />
          <ActionIconButton
            title={
              isExportingPsd
                ? t("templateList.exportingPsdTooltip")
                : t("templateList.exportPsdTooltip")
            }
            icon={<Download size={13} />}
            onClick={() => void handleExportPsd()}
            disabled={isExportingPsd}
          />
          <ActionIconButton
            title={
              template.isPinned
                ? t("templateList.unpinTooltip")
                : t("templateList.pinTooltip")
            }
            icon={template.isPinned ? <PinOff size={13} /> : <Pin size={13} />}
            onClick={() => {
              void templateStorage.togglePin(template.id).then(onRefresh);
            }}
          />
          <ActionIconButton
            title={t("templateList.deleteTooltip")}
            icon={<Trash2 size={13} />}
            destructive
            onClick={() => {
              if (
                !window.confirm(
                  t("templateList.deleteConfirm", { name: template.name }),
                )
              ) {
                return;
              }
              void templateStorage.remove(template.id).then(onRefresh);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ActionIconButton({
  icon,
  title,
  onClick,
  destructive = false,
  disabled = false,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <Tooltip content={title}>
      <button
        type="button"
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          if (disabled) {
            return;
          }
          onClick();
        }}
        className={`rounded p-1.5 transition-colors ${
          destructive
            ? "text-red-600 hover:bg-red-50/90 dark:text-red-400 dark:hover:bg-red-500/20"
            : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        {icon}
      </button>
    </Tooltip>
  );
}

function TemplatePreviewSvg({ template }: { template: FillingTemplate }) {
  const scaleX = 240 / template.canvasWidth;
  const scaleY = 135 / template.canvasHeight;
  const scale = Math.min(scaleX, scaleY) * 0.85;
  const originX = (240 - template.canvasWidth * scale) / 2;
  const originY = (135 - template.canvasHeight * scale) / 2;

  return (
    <svg
      width="240"
      height="135"
      viewBox="0 0 240 135"
      className="text-slate-300 dark:text-slate-600"
    >
      <rect
        x={originX}
        y={originY}
        width={template.canvasWidth * scale}
        height={template.canvasHeight * scale}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="4 2"
        rx="2"
      />
      {template.layers.slice(0, 12).map((layer) => (
        <polygon
          key={layer.id}
          points={resolveLayerShapePoints(layer)
            .map(
              (point) =>
                `${originX + (layer.x + point.x) * scale},${originY + (layer.y + point.y) * scale}`,
            )
            .join(" ")}
          fill="currentColor"
          opacity={0.3}
          transform={
            layer.rotation !== 0
              ? `rotate(${layer.rotation} ${originX + (layer.x + layer.width / 2) * scale} ${originY + (layer.y + layer.height / 2) * scale})`
              : undefined
          }
        />
      ))}
    </svg>
  );
}

function formatRelativeTime(timestamp: number, t: any): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return t("templateList.timeJustNow");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t("templateList.timeMinAgo", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("templateList.timeHourAgo", { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 30) return t("templateList.timeDayAgo", { count: days });
  const months = Math.floor(days / 30);
  return t("templateList.timeMonthAgo", { count: months });
}

function toSafeFileName(value: string): string {
  const safe = value.trim().replace(/[\\/:*?"<>|]+/g, "_");
  return safe.length > 0 ? safe : "filling-template";
}
