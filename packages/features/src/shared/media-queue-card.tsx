import React from "react";
import { X } from "lucide-react";
import { BodyText, Button, MutedText } from "@imify/ui";
import { formatBytes } from "../processor/processor-utils";
import { useThumbnail } from "./hooks/use-thumbnail";

export interface MediaQueueCardProps {
  id: string;
  name: string;
  file?: File;
  sizeBytes?: number;
  previewUrl: string;
  indexBadge?: number | string;
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
  onRemove?: (id: string) => void;
  disabled?: boolean;
  className?: string;
}

export function MediaQueueCard({
  id,
  name,
  file,
  sizeBytes,
  previewUrl,
  indexBadge,
  subtitle,
  footer,
  onRemove,
  disabled = false,
  className = "",
}: MediaQueueCardProps) {
  const { thumbnail } = useThumbnail(file ?? null);
  const effectiveSrc = thumbnail || previewUrl;

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors select-none cursor-grab active:cursor-grabbing ${className}`}
    >
      <div className="aspect-square w-full relative overflow-hidden bg-slate-100 dark:bg-slate-900/60 flex items-center justify-center border-b border-slate-100 dark:border-slate-700/50">
        {indexBadge !== undefined && (
          <span className="absolute top-2 left-2 z-[4] rounded-md bg-black/60 dark:bg-black/70 backdrop-blur-xs px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs pointer-events-none">
            {indexBadge}
          </span>
        )}

        {onRemove && !disabled && (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label="Remove image"
            className="absolute right-2 top-2 z-[5] h-6 w-6 rounded-md bg-white/90 dark:bg-slate-900/90 p-1 text-slate-500 shadow-xs backdrop-blur-xs hover:text-red-500 hover:bg-white dark:hover:bg-slate-900 transition-colors border-0 cursor-pointer"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(id);
            }}
          >
            <X size={13} />
          </Button>
        )}

        <img
          alt={name}
          className="h-full w-full object-cover pointer-events-none"
          src={effectiveSrc}
          loading="lazy"
        />
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        <div className="min-w-0 flex-1">
          <BodyText
            className="truncate font-semibold text-xs text-slate-800 dark:text-slate-100"
            title={name}
          >
            {name}
          </BodyText>
          {subtitle && (
            <MutedText className="block truncate text-[10px] text-sky-600 dark:text-sky-400 font-mono mt-0.5">
              {subtitle}
            </MutedText>
          )}
        </div>

        {sizeBytes !== undefined && (
          <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span className="py-0.5 bg-slate-50 dark:bg-slate-900/40 rounded border border-slate-200/40 dark:border-slate-700/40">
              {formatBytes(sizeBytes)}
            </span>
          </div>
        )}

        {footer}
      </div>
    </article>
  );
}
