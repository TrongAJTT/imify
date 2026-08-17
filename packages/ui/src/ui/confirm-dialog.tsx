import React, { useEffect, useRef } from "react";
import { BaseDialog } from "./base-dialog";
import { Button } from "./button";
import {
  type DialogVariant,
  getDialogVariantStyles,
} from "./dialog-variants";

export type { DialogVariant };

export interface ConfirmDialogProps {
  isOpen: boolean;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  confirmText?: React.ReactNode;
  cancelText?: React.ReactNode;
  variant?: DialogVariant;
  defaultFocus?: "confirm" | "cancel";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  subtitle,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  defaultFocus = "confirm",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Auto-focus on open
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (defaultFocus === "cancel") {
        cancelBtnRef.current?.focus();
      } else {
        confirmBtnRef.current?.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen, defaultFocus]);

  // Arrow key navigation between Cancel and Confirm
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      if (document.activeElement === confirmBtnRef.current) {
        cancelBtnRef.current?.focus();
      } else {
        confirmBtnRef.current?.focus();
      }
    }
  };

  const styles = getDialogVariantStyles(variant);

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onCancel}
      className="max-w-md"
      contentClassName="w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-150"
    >
      <div className="flex flex-col gap-4" onKeyDown={handleKeyDown}>
        <div className="flex items-start sm:items-center gap-3">
          {styles.icon}
          <div className="flex-1 min-w-0">
            {title ? (
              <>
                <h3 className="text-sm sm:text-[15px] font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                  {title}
                </h3>
                {subtitle ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {subtitle}
                  </p>
                ) : null}
              </>
            ) : (
              <div className="text-sm sm:text-[15px] font-medium text-slate-800 dark:text-slate-200 leading-snug">
                {description}
              </div>
            )}
          </div>
        </div>

        {title && description ? (
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-10">
            {description}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            ref={cancelBtnRef}
            type="button"
            variant="outline"
            className="rounded-xl text-xs font-semibold h-10 px-4 focus:ring-2 focus:ring-slate-400 focus:outline-none"
            onClick={onCancel}
          >
            {cancelText}
          </Button>
          <Button
            ref={confirmBtnRef}
            type="button"
            className={`rounded-xl text-xs font-semibold h-10 px-4 shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none ${styles.btnClassName}`}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </BaseDialog>
  );
}
