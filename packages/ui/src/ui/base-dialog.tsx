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
    if (isOpen) {
      if (!dialog) return
      if (!dialog.open) {
        dialog.showModal()
        // Prevent body scroll when dialog is open
        document.body.style.overflow = "hidden"
      }
    } else {
      // Always restore body scroll when closed, even if the dialog node
      // was unmounted/replaced before this effect runs.
      document.body.style.overflow = ""
      if (dialog?.open) {
        dialog.close()
      }
    }
  }, [isOpen])

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
        // prevent the native dialog from showing its own scrollbars
        "m-auto p-0 rounded-2xl border-none bg-transparent backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm open:animate-in open:fade-in open:zoom-in-95 duration-200 outline-none overflow-hidden",
        className
      )}
    >
      <div 
        className={cn(
          // inner container handles scrolling when content is tall
          "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-auto max-h-[calc(100vh-4rem)]",
          contentClassName
        )}
      >
        {children}
      </div>
    </dialog>,
    document.body
  ) as unknown as React.ReactElement
}
