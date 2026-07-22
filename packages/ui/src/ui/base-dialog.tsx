import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "./utils";

interface BaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isDirty?: boolean;
  /** Optional guard to block a close attempt for specific event types */
  shouldBlockCloseAttempt?: (eventType: string) => boolean;
  children: React.ReactNode;
  className?: string;
  /** The container class for the inner content wrapper */
  contentClassName?: string;
  /** Optional header node */
  header?: React.ReactNode;
  /** Optional footer node */
  footer?: React.ReactNode;
  /** Whether the header should be sticky at the top when content scrolls */
  stickyHeader?: boolean;
  /** Whether the footer should be sticky at the bottom when content scrolls */
  stickyFooter?: boolean;
  /** Class name for header wrapper */
  headerClassName?: string;
  /** Class name for footer wrapper */
  footerClassName?: string;
  /** Class name for body content wrapper */
  bodyClassName?: string;
}

/**
 * BaseDialog component using HTML5 native <dialog> element.
 * Handles:
 * 1. Modal backdrop and focus trap via showModal()
 * 2. Escape key handling via onCancel
 * 3. Click outside to close (backdrop click)
 * 4. isDirty check before closing
 */
export function BaseDialog({
  isOpen,
  onClose,
  isDirty = false,
  shouldBlockCloseAttempt,
  children,
  className = "",
  contentClassName = "",
  header,
  footer,
  stickyHeader,
  stickyFooter,
  headerClassName = "",
  footerClassName = "",
  bodyClassName = "",
}: BaseDialogProps): React.ReactElement | null {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync React's isOpen state with Native Dialog API
  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen) {
      if (!dialog) return;
      if (!dialog.open) {
        dialog.showModal();
        // Prevent page scroll when dialog is open
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
      }
    } else {
      // Always restore page scroll when closed
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      if (dialog?.open) {
        dialog.close();
      }
    }
  }, [isOpen, mounted]);

  // Cleanup overflow on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  const handleCloseAttempt = (e?: React.SyntheticEvent) => {
    const eventType = e?.type ?? "manual";

    if (shouldBlockCloseAttempt?.(eventType)) {
      if (eventType === "cancel") {
        e?.preventDefault();
      }
      return;
    }

    // If it's a native cancel (Esc key), prevent the default behavior
    // to let our React state handle the closing (so we can check isDirty)
    if (eventType === "cancel") {
      e?.preventDefault();
    }

    if (isDirty) {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Are you sure you want to close?",
      );
      if (!confirmLeave) return;
    }

    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    // In native <dialog>, the dialog element itself is the backdrop
    // if the click target is the dialog, it means the user clicked the backdrop.
    if (e.target === e.currentTarget) {
      handleCloseAttempt();
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDialogElement>) => {
    // Prevent dragging/swiping on the backdrop overlay from scrolling the underlying page
    if (e.target === e.currentTarget) {
      e.preventDefault();
    }
  };

  // Keep SSR output and first client render identical to avoid hydration mismatch.
  if (!mounted) return null;

  const hasStructuredLayout = Boolean(
    header || footer || stickyHeader !== undefined || stickyFooter !== undefined,
  );

  return createPortal(
    <dialog
      ref={dialogRef}
      onCancel={handleCloseAttempt}
      onClick={handleBackdropClick}
      onTouchMove={handleTouchMove}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      className={cn(
        // m-auto centers it; adding w/max-w for mobile safety
        "m-auto p-0 rounded-xl border-none select-none bg-transparent backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm open:animate-in open:fade-in open:zoom-in-95 duration-200 outline-none overflow-hidden overscroll-contain",
        "w-[calc(100%-2rem)] max-w-3xl",
        className,
      )}
    >
      {hasStructuredLayout ? (
        <div
          className={cn(
            "flex flex-col max-h-[calc(100dvh-4rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden rounded-xl",
            contentClassName,
          )}
        >
          {header && (
            <div
              className={cn(
                "shrink-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800",
                stickyHeader !== false && "sticky top-0",
                headerClassName,
              )}
            >
              {header}
            </div>
          )}

          <div
            className={cn(
              "flex-1 overflow-y-auto overscroll-contain min-h-0",
              bodyClassName,
            )}
          >
            {children}
          </div>

          {footer && (
            <div
              className={cn(
                "shrink-0 z-10 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800",
                stickyFooter !== false && "sticky bottom-0",
                footerClassName,
              )}
            >
              {footer}
            </div>
          )}
        </div>
      ) : (
        <div
          className={cn(
            // inner container handles scrolling when content is tall
            // use dvh (dynamic viewport height) for better mobile browser support
            "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto overscroll-contain max-h-[calc(100dvh-4rem)]",
            contentClassName,
          )}
        >
          {children}
        </div>
      )}
    </dialog>,
    document.body,
  ) as unknown as React.ReactElement;
}
