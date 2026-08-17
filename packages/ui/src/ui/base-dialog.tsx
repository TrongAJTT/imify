import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "./utils";

interface BaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isDirty?: boolean;
  /** Optional callback when a close attempt is made while isDirty is true */
  onDirtyCloseAttempt?: () => void;
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
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
}

/**
 * BaseDialog
 * A reusable modal dialog component using the native HTML <dialog> element.
 * Features:
 * 1. Native backdrop support (::backdrop) with Tailwind CSS styling
 * 2. Proper ESC key handling and click-outside (backdrop click) detection
 * 3. Mobile safe-area / viewport boundary handling
 * 4. isDirty check before closing
 * 5. Scroll lock on underlying page content when open
 */
export function BaseDialog({
  isOpen,
  onClose,
  isDirty = false,
  onDirtyCloseAttempt,
  shouldBlockCloseAttempt,
  children,
  className = "",
  contentClassName = "",
  header,
  footer,
  stickyHeader,
  stickyFooter,
  headerClassName = "",
  bodyClassName = "",
  footerClassName = "",
}: BaseDialogProps): React.ReactElement | null {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync React's isOpen state with Native Dialog API
  useEffect(() => {
    const dialogNode = dialogRef.current;
    if (!dialogNode) return;

    if (isOpen) {
      if (!dialogNode.open) {
        dialogNode.showModal();
      }
    } else {
      if (dialogNode.open) {
        dialogNode.close();
      }
    }
  }, [isOpen]);

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Cleanup on unmount (ensure dialog is closed and not orphaned)
  useEffect(() => {
    return () => {
      const dialogNode = dialogRef.current;
      if (dialogNode?.open) {
        dialogNode.close();
      }
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

    if (isDirty && onDirtyCloseAttempt) {
      onDirtyCloseAttempt();
      return;
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
