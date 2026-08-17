import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
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

export function usePageScrollButton(direction: "up" | "down") {
  const animFrameRef = useRef<number | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoldingRef = useRef(false);
  const lastTapTimeRef = useRef(0);

  const stopScrolling = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    isHoldingRef.current = false;
  }, []);

  const performContinuousScroll = useCallback(() => {
    const delta = direction === "up" ? -14 : 14;
    window.scrollBy(0, delta);
    const mainScrollable =
      document.querySelector("main") ||
      document.querySelector("section.flex-1");
    if (mainScrollable && mainScrollable !== document.documentElement) {
      mainScrollable.scrollTop += delta;
    }
    animFrameRef.current = requestAnimationFrame(performContinuousScroll);
  }, [direction]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      stopScrolling();
      isHoldingRef.current = false;

      holdTimerRef.current = setTimeout(() => {
        isHoldingRef.current = true;
        animFrameRef.current = requestAnimationFrame(performContinuousScroll);
      }, 220);
    },
    [performContinuousScroll, stopScrolling],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      const wasHolding = isHoldingRef.current;
      stopScrolling();

      if (wasHolding) {
        return;
      }

      const now = Date.now();
      const timeDiff = now - lastTapTimeRef.current;
      const mainScrollable =
        document.querySelector("main") ||
        document.querySelector("section.flex-1");

      if (timeDiff < 300) {
        // Double tap: scroll to top or bottom of page
        lastTapTimeRef.current = 0;
        if (direction === "up") {
          window.scrollTo({ top: 0, behavior: "smooth" });
          if (mainScrollable && mainScrollable !== document.documentElement) {
            mainScrollable.scrollTo({ top: 0, behavior: "smooth" });
          }
        } else {
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: "smooth",
          });
          if (mainScrollable && mainScrollable !== document.documentElement) {
            mainScrollable.scrollTo({
              top: mainScrollable.scrollHeight,
              behavior: "smooth",
            });
          }
        }
      } else {
        // Single tap: scroll step
        lastTapTimeRef.current = now;
        const delta = direction === "up" ? -220 : 220;
        window.scrollBy({ top: delta, behavior: "smooth" });
        if (mainScrollable && mainScrollable !== document.documentElement) {
          mainScrollable.scrollBy({ top: delta, behavior: "smooth" });
        }
      }
    },
    [direction, stopScrolling],
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      stopScrolling();
    },
    [stopScrolling],
  );

  useEffect(() => {
    return () => {
      stopScrolling();
    };
  }, [stopScrolling]);

  return {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
    onPointerLeave: handlePointerCancel,
  };
}

export interface BottomSheetTriggerBarProps {
  onClick: () => void;
  title?: string;
  className?: string;
}

export function BottomSheetTriggerBar({
  onClick,
  title,
  className = "",
}: BottomSheetTriggerBarProps) {
  const scrollUpHandlers = usePageScrollButton("up");
  const scrollDownHandlers = usePageScrollButton("down");

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex items-center justify-between bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 rounded-t-2xl px-3 py-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] select-none",
        className,
      )}
    >
      {/* Scroll Up Button (Left) */}
      <button
        type="button"
        {...scrollUpHandlers}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 active:bg-slate-200 dark:active:bg-slate-700 transition-colors shadow-2xs cursor-pointer touch-none shrink-0"
        title="Cuộn lên (Nhấn đúp: Lên đầu trang, Giữ: Cuộn liên tục)"
        aria-label="Scroll page up"
      >
        <ChevronUp size={15} />
      </button>

      {/* Center Trigger to Open Sheet */}
      <button
        type="button"
        onClick={onClick}
        className="flex-1 flex flex-col items-center justify-center px-2 py-0.5 transition-transform active:translate-y-0.5 cursor-pointer outline-none min-w-0"
      >
        <div className="w-8 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mb-1" />
        {title && (
          <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] truncate max-w-[220px]">
            {title}
          </h3>
        )}
      </button>

      {/* Scroll Down Button (Right) */}
      <button
        type="button"
        {...scrollDownHandlers}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 active:bg-slate-200 dark:active:bg-slate-700 transition-colors shadow-2xs cursor-pointer touch-none shrink-0"
        title="Cuộn xuống (Nhấn đúp: Xuống cuối trang, Giữ: Cuộn liên tục)"
        aria-label="Scroll page down"
      >
        <ChevronDown size={15} />
      </button>
    </div>
  );
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

        {/* Content Area */}
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
