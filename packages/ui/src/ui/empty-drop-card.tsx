import React, { type ReactNode, useRef, useState, useEffect } from "react";
import { Heading, MutedText } from "./typography";
import { Button } from "./button";
import { SecondaryButton } from "./secondary-button";
import { Clipboard, Link2, Loader2, Plus } from "lucide-react";
import { useTranslation } from "@imify/i18n";

interface EmptyDropCardProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  topRightSlot?: ReactNode;
  onDropFiles?: (files: FileList | null) => void;
  onClick?: () => void;
  fileInput?: {
    accept?: string;
    multiple?: boolean;
    onInputFiles: (files: FileList | null) => void;
  };
  className?: string;
  iconWrapperClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  onPasteFiles?: (files: File[]) => void;
  onProcessUrls?: (urls: string[]) => Promise<void>;
  allowMultipleUrls?: boolean;
}

export function EmptyDropCard({
  icon,
  title,
  subtitle,
  topRightSlot,
  onDropFiles,
  onClick,
  fileInput,
  className = "",
  iconWrapperClassName = "",
  titleClassName = "",
  subtitleClassName = "",
  onPasteFiles,
  onProcessUrls,
  allowMultipleUrls = false,
}: EmptyDropCardProps) {
  const { t } = useTranslation(["common", "processor"]);
  const inputRef = useRef<HTMLInputElement>(null);

  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState("");
  const [isUrlSubmitting, setIsUrlSubmitting] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!menuPosition) return;
    const handleClose = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuPosition(null);
      }
    };
    // Dùng capture phase hoặc mousedown để tránh bị stopPropagation chặn đóng menu
    window.addEventListener("mousedown", handleClose);
    return () => window.removeEventListener("mousedown", handleClose);
  }, [menuPosition]);

  const startLongPress = (clientX: number, clientY: number) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setMenuPosition({ x: clientX, y: clientY });
    }, 600);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    touchStartPos.current = { x: e.clientX, y: e.clientY };
    startLongPress(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    cancelLongPress();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (touchStartPos.current) {
      const dx = Math.abs(e.clientX - touchStartPos.current.x);
      const dy = Math.abs(e.clientY - touchStartPos.current.y);
      if (dx > 10 || dy > 10) {
        cancelLongPress();
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const handleClick = () => {
    if (fileInput) {
      inputRef.current?.click();
      return;
    }
    onClick?.();
  };

  const handlePasteFromClipboard = async () => {
    setMenuPosition(null);
    if (!onPasteFiles) return;
    try {
      const items = await navigator.clipboard.read();
      const files: File[] = [];
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            const ext = type.split("/")[1] || "png";
            const file = new File([blob], `pasted_image_${Date.now()}.${ext}`, {
              type,
            });
            files.push(file);
          }
        }
      }
      if (files.length > 0) {
        onPasteFiles(files);
      } else {
        alert(t("common:noImageInClipboard"));
      }
    } catch (e) {
      console.error(e);
      alert(t("common:clipboardPermissionError"));
    }
  };

  const handleUrlModalSubmit = async () => {
    if (!onProcessUrls) return;
    const urls = urlInputValue
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(line));

    if (urls.length === 0) {
      setUrlError(t("processor:enterValidUrlError"));
      return;
    }

    const urlsToImport = allowMultipleUrls ? urls : urls.slice(0, 1);
    setIsUrlSubmitting(true);
    setUrlError(null);
    try {
      await onProcessUrls(urlsToImport);
      setUrlInputValue("");
      setIsUrlModalOpen(false);
    } catch (err) {
      setUrlError(
        err instanceof Error ? err.message : t("processor:importError"),
      );
    } finally {
      setIsUrlSubmitting(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {fileInput ? (
        <input
          ref={inputRef}
          className="hidden"
          accept={fileInput.accept}
          multiple={fileInput.multiple}
          onChange={(event) => fileInput.onInputFiles(event.target.files)}
          type="file"
        />
      ) : null}

      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleClick();
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          onDropFiles?.(event.dataTransfer.files);
        }}
        onContextMenu={handleContextMenu}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerMove={handlePointerMove}
        className="group flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-6 py-12 text-center transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 bg-slate-50 select-none"
      >
        <div
          className={`mb-4 rounded-full border border-slate-100 bg-white p-4 shadow-sm transition-transform group-hover:-translate-y-1 dark:border-slate-700/50 dark:bg-slate-800 ${iconWrapperClassName}`}
        >
          {icon}
        </div>
        <Heading className={`text-base font-semibold ${titleClassName}`}>
          {title}
        </Heading>
        {subtitle ? (
          <MutedText className={`mt-1.5 ${subtitleClassName}`}>
            {subtitle}
          </MutedText>
        ) : null}
      </div>

      {topRightSlot ? (
        <div
          className="absolute top-3 right-3"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {topRightSlot}
        </div>
      ) : null}

      {/* Context Menu */}
      {menuPosition ? (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
            transform: "translate(-20px, -20px)",
          }}
          className="z-50 min-w-[160px] rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {onPasteFiles ? (
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Clipboard size={14} />
              {t("common:pasteFromClipboard")}
            </button>
          ) : null}
          {onProcessUrls ? (
            <button
              type="button"
              onClick={() => {
                setMenuPosition(null);
                setIsUrlModalOpen(true);
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Link2 size={14} />
              {t("common:importFromUrl")}
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Import URL Modal */}
      {isUrlModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => {
            if (!isUrlSubmitting) setIsUrlModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t("processor:importImageUrlTitle")}
                </h3>
                <MutedText className="mt-1 text-xs">
                  {allowMultipleUrls
                    ? t("processor:importImageUrlSubtitleMultiple")
                    : t("processor:importImageUrlSubtitleSingle")}
                </MutedText>
              </div>
              <button
                type="button"
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                onClick={() => {
                  if (!isUrlSubmitting) setIsUrlModalOpen(false);
                }}
              >
                ✕
              </button>
            </div>
            <textarea
              autoFocus
              className="min-h-[180px] w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
              placeholder={
                "https://example.com/a.jpg\nhttps://example.com/b.png"
              }
              value={urlInputValue}
              onChange={(event) => setUrlInputValue(event.target.value)}
            />
            {urlError ? (
              <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-700/60 dark:bg-rose-900/20 dark:text-rose-300">
                {urlError}
              </div>
            ) : null}
            <div className="mt-4 flex items-center justify-end gap-2">
              <SecondaryButton
                disabled={isUrlSubmitting}
                onClick={() => setIsUrlModalOpen(false)}
              >
                {t("common:cancel")}
              </SecondaryButton>
              <Button
                type="button"
                disabled={isUrlSubmitting}
                onClick={handleUrlModalSubmit}
              >
                {isUrlSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                {allowMultipleUrls
                  ? t("processor:importUrls")
                  : t("processor:importFirstUrl")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
