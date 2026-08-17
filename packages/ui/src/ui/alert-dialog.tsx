import React, { useEffect, useRef } from "react";
import { BaseDialog } from "./base-dialog";
import { Button } from "./button";
import {
  type DialogVariant,
  getDialogVariantStyles,
} from "./dialog-variants";

export type { DialogVariant };

export interface AlertDialogProps {
  isOpen: boolean;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  buttonText?: React.ReactNode;
  variant?: DialogVariant;
  onClose: () => void;
}

export function AlertDialog({
  isOpen,
  title,
  subtitle,
  description,
  buttonText = "Confirm",
  variant = "info",
  onClose,
}: AlertDialogProps) {
  const okBtnRef = useRef<HTMLButtonElement>(null);

  // Auto-focus OK button on open
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      okBtnRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const styles = getDialogVariantStyles(variant);

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-md"
      contentClassName="w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-150"
    >
      <div className="flex flex-col gap-4">
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

        <div className="flex items-center justify-end pt-2">
          <Button
            ref={okBtnRef}
            type="button"
            className={`rounded-xl text-xs font-semibold h-10 px-5 shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none ${styles.btnClassName}`}
            onClick={onClose}
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </BaseDialog>
  );
}
