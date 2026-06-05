import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "./utils";
import { SidebarPanelProvider } from "./sidebar-panel";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
  /** Height of the sheet. Defaults to 85dvh */
  heightClassName?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  className = "",
  heightClassName = "h-[85dvh]",
}: BottomSheetProps): React.ReactElement | null {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  // Gesture state
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const triggerClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setCurrentY(0);
    }, 160);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen) {
      if (dialog && !dialog.open) {
        setIsOpening(true);
        dialog.showModal();
        document.body.style.overflow = "hidden";
        // Small delay to allow the dialog to be in DOM before triggering entry transform
        requestAnimationFrame(() => {
          setIsOpening(false);
        });
      }
    } else if (dialog?.open && !isClosing) {
      document.body.style.overflow = "";
      dialog.close();
    }
  }, [isOpen, isClosing]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Gesture Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY > 0) {
      setCurrentY(deltaY);
    }
  };

  const onTouchEnd = () => {
    setIsDragging(false);
    if (currentY > 120) {
      triggerClose();
    } else {
      setCurrentY(0);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) {
      triggerClose();
    }
  };

  if (!mounted) return null;

  // Calculate transform for opening, closing, and dragging
  let transformY = "0";
  if (isClosing) {
    transformY = "100%";
  } else if (isOpening) {
    transformY = "100%";
  } else if (currentY > 0) {
    transformY = `${currentY}px`;
  }

  const transition = isDragging
    ? "none"
    : "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)";

  return createPortal(
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        triggerClose();
      }}
      onClick={handleBackdropClick}
      className={cn(
        "m-0 mt-auto mb-0 mx-auto p-0 border-none bg-transparent outline-none overflow-visible",
        "w-full max-w-none md:max-w-xl h-fit max-h-none",
        "backdrop:bg-slate-900/60 backdrop:backdrop-blur-md",
        isOpen && !isClosing ? "animate-fade-in" : "animate-fade-out",
        className,
      )}
    >
      <div
        ref={contentRef}
        style={{
          transform: `translateY(${transformY})`,
          transition,
        }}
        className={cn(
          "flex flex-col bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl rounded-t-[32px] overflow-hidden",
          heightClassName,
        )}
      >
        {/* Grab Handle & Header */}
        <div
          className="flex flex-col shrink-0 cursor-grab active:cursor-grabbing"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>

          {title && (
            <div className="flex items-center justify-center px-6 pb-2 border-b border-slate-50 dark:border-slate-850">
              <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-center">
                {title}
              </h3>
            </div>
          )}
        </div>

        {/* Content Area - Independent scroll, no swipe-to-close here to prevent conflict */}
        <div className="flex-1 overflow-y-auto">
          <SidebarPanelProvider value={{ hideHeader: true }}>
            <div className="px-2 pt-1 pb-12">{children}</div>
          </SidebarPanelProvider>
        </div>
      </div>
    </dialog>,
    document.body,
  ) as unknown as React.ReactElement;
}
