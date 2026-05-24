import React, { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { cn } from "./utils"

interface BaseDialogProps {
  isOpen: boolean
  onClose: () => void
  isDirty?: boolean
  /** Optional guard to block a close attempt for specific event types */
  shouldBlockCloseAttempt?: (eventType: string) => boolean
  children: React.ReactNode
  className?: string
  /** The container class for the inner content wrapper */
  contentClassName?: string
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
  contentClassName = ""
}: BaseDialogProps): React.ReactElement | null {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [mounted, setMounted] = React.useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync React's isOpen state with Native Dialog API
  useEffect(() => {
    const dialog = dialogRef.current
    console.log("[BaseDialog] useEffect sync - isOpen:", isOpen, "mounted:", mounted, "dialogRef exists:", !!dialog, "dialog.open:", dialog?.open);
    if (isOpen) {
      if (!dialog) {
        console.warn("[BaseDialog] dialogRef is null on isOpen = true!");
        return;
      }
      if (!dialog.open) {
        console.log("[BaseDialog] calling dialog.showModal()");
        dialog.showModal()
        // Prevent body scroll when dialog is open
        document.body.style.overflow = "hidden"
      }
    } else {
      // Always restore body scroll when closed, even if the dialog node
      // was unmounted/replaced before this effect runs.
      document.body.style.overflow = ""
      if (dialog?.open) {
        console.log("[BaseDialog] calling dialog.close()");
        dialog.close()
      }
    }
  }, [isOpen, mounted])

  // Cleanup overflow on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  const handleCloseAttempt = (e?: React.SyntheticEvent) => {
    const eventType = e?.type ?? "manual"

    if (shouldBlockCloseAttempt?.(eventType)) {
      if (eventType === "cancel") {
        e?.preventDefault()
      }
      return
    }

    // If it's a native cancel (Esc key), prevent the default behavior 
    // to let our React state handle the closing (so we can check isDirty)
    if (eventType === "cancel") {
      e?.preventDefault()
    }

    if (isDirty) {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Are you sure you want to close?"
      )
      if (!confirmLeave) return
    }

    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    // In native <dialog>, the dialog element itself is the backdrop
    // if the click target is the dialog, it means the user clicked the backdrop.
    if (e.target === e.currentTarget) {
      handleCloseAttempt()
    }
  }

  // Keep SSR output and first client render identical to avoid hydration mismatch.
  if (!mounted) return null

  return createPortal(
    <dialog
      ref={dialogRef}
      onCancel={handleCloseAttempt}
      onClick={handleBackdropClick}
      className={cn(
        // m-auto centers it; adding w/max-w for mobile safety
        "m-auto p-0 rounded-xl border-none bg-transparent backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm open:animate-in open:fade-in open:zoom-in-95 duration-200 outline-none overflow-hidden",
        "w-[calc(100%-2rem)] max-w-3xl",
        className
      )}
    >
      <div 
        className={cn(
          // inner container handles scrolling when content is tall
          // use dvh (dynamic viewport height) for better mobile browser support
          "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[calc(100dvh-4rem)]",
          contentClassName
        )}
      >
        {children}
      </div>
    </dialog>,
    document.body
  ) as unknown as React.ReactElement
}
