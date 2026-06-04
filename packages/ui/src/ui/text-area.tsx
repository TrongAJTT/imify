import React, { useRef, useState, useEffect, useCallback } from "react";
import { LabelText } from "./typography";

export interface TextAreaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  errorMessage?: string;
  heightExpandMode?: "none" | "text" | "slider";
}

export function TextArea({
  label,
  value,
  onChange,
  disabled,
  errorMessage,
  className = "",
  rows = 4,
  heightExpandMode = "none",
  ...props
}: TextAreaProps) {
  const hasError = Boolean(errorMessage);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [customHeight, setCustomHeight] = useState<number>(100);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (heightExpandMode === "text" && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value, heightExpandMode]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
    },
    [],
  );

  useEffect(() => {
    if (!isResizing || heightExpandMode !== "slider") return;

    const handleMouseMove = (e: MouseEvent) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const rect = textarea.getBoundingClientRect();
      const nextHeight = Math.max(
        60,
        Math.min(600, Math.round(e.clientY - rect.top)),
      );
      setCustomHeight(nextHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, heightExpandMode]);

  const style =
    heightExpandMode === "slider" ? { height: `${customHeight}px` } : undefined;

  return (
    <div className={`space-y-1 ${className}`}>
      <LabelText className="text-xs">{label}</LabelText>
      <div className="relative flex flex-col">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          onKeyDown={(e) => {
            e.stopPropagation()
            props.onKeyDown?.(e)
          }}
          rows={heightExpandMode === "slider" ? undefined : rows}
          style={style}
          className={`
            w-full rounded-md border bg-white dark:bg-slate-800/80
            px-3 py-2 text-slate-700 dark:text-slate-200 outline-none transition-all shadow-sm
            ${
              hasError
                ? "border-rose-300 bg-rose-50 text-rose-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-100"
                : "border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            }
            disabled:opacity-50 disabled:cursor-not-allowed resize-none text-xs
            ${heightExpandMode === "slider" ? "rounded-b-none border-b-0" : ""}
          `}
          {...props}
        />
        {heightExpandMode === "slider" && (
          <div
            onMouseDown={handleResizeStart}
            className={`h-1 w-full bg-slate-200 dark:bg-slate-700 hover:bg-sky-400 dark:hover:bg-sky-500 rounded-b border border-t-0 border-slate-200 dark:border-slate-700 transition-colors cursor-ns-resize ${
              isResizing ? "bg-sky-400 dark:bg-sky-500" : ""
            }`}
            role="separator"
            aria-label="Resize height"
          />
        )}
      </div>
      {hasError && (
        <div className="text-[11px] leading-snug text-rose-600 dark:text-rose-300">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
