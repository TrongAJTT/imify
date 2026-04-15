import * as Popover from "@radix-ui/react-popover"
import { useEffect, useRef, useState, type MouseEventHandler, type ReactNode } from "react"

type PopoverBehavior = "click" | "hover" | "hybrid"
type PopoverPreset = "tooltip" | "dropdown" | "inspector"

interface ControlledPopoverProps {
  trigger: ReactNode
  children: ReactNode
  preset?: PopoverPreset
  behavior?: PopoverBehavior
  modal?: boolean
  disabled?: boolean
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  sideOffset?: number
  collisionPadding?: number
  openDelayMs?: number
  closeDelayMs?: number
  triggerWrapperClassName?: string
  contentClassName?: string
  contentOnMouseDown?: MouseEventHandler<HTMLDivElement>
}

const PRESET_MAP: Record<
  PopoverPreset,
  {
    behavior: PopoverBehavior
    modal: boolean
    side: "top" | "right" | "bottom" | "left"
    align: "start" | "center" | "end"
    sideOffset: number
    collisionPadding: number
    openDelayMs: number
    closeDelayMs: number
  }
> = {
  tooltip: {
    behavior: "hover",
    modal: false,
    side: "top",
    align: "center",
    sideOffset: 8,
    collisionPadding: 8,
    openDelayMs: 300,
    closeDelayMs: 80
  },
  dropdown: {
    behavior: "click",
    modal: false,
    side: "bottom",
    align: "center",
    sideOffset: 8,
    collisionPadding: 12,
    openDelayMs: 0,
    closeDelayMs: 120
  },
  inspector: {
    behavior: "hybrid",
    modal: false,
    side: "bottom",
    align: "end",
    sideOffset: 4,
    collisionPadding: 10,
    openDelayMs: 0,
    closeDelayMs: 160
  }
}

export function ControlledPopover({
  trigger,
  children,
  preset = "dropdown",
  behavior,
  modal,
  disabled = false,
  side,
  align,
  sideOffset,
  collisionPadding,
  openDelayMs,
  closeDelayMs,
  triggerWrapperClassName,
  contentClassName,
  contentOnMouseDown
}: ControlledPopoverProps) {
  const presetValues = PRESET_MAP[preset]
  const resolvedBehavior = behavior ?? presetValues.behavior
  const resolvedModal = modal ?? presetValues.modal
  const resolvedSide = side ?? presetValues.side
  const resolvedAlign = align ?? presetValues.align
  const resolvedSideOffset = sideOffset ?? presetValues.sideOffset
  const resolvedCollisionPadding = collisionPadding ?? presetValues.collisionPadding
  const resolvedOpenDelayMs = openDelayMs ?? presetValues.openDelayMs
  const resolvedCloseDelayMs = closeDelayMs ?? presetValues.closeDelayMs

  const [open, setOpen] = useState(false)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)
  const triggerWrapperRef = useRef<HTMLSpanElement | null>(null)
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerHoveredRef = useRef(false)
  const contentHoveredRef = useRef(false)

  const clearOpenTimer = () => {
    if (!openTimerRef.current) return
    clearTimeout(openTimerRef.current)
    openTimerRef.current = null
  }

  const clearCloseTimer = () => {
    if (!closeTimerRef.current) return
    clearTimeout(closeTimerRef.current)
    closeTimerRef.current = null
  }

  const clearTimers = () => {
    clearOpenTimer()
    clearCloseTimer()
  }

  const openPopover = () => {
    clearCloseTimer()
    clearOpenTimer()
    if (resolvedOpenDelayMs <= 0) {
      setOpen(true)
      return
    }
    openTimerRef.current = setTimeout(() => {
      setOpen(true)
      openTimerRef.current = null
    }, resolvedOpenDelayMs)
  }

  const closePopover = (immediate = false) => {
    clearOpenTimer()
    clearCloseTimer()
    if (immediate || resolvedCloseDelayMs <= 0) {
      setOpen(false)
      return
    }
    closeTimerRef.current = setTimeout(() => {
      if (triggerHoveredRef.current || contentHoveredRef.current) {
        closeTimerRef.current = null
        return
      }
      setOpen(false)
      closeTimerRef.current = null
    }, resolvedCloseDelayMs)
  }

  useEffect(() => () => clearTimers(), [])

  useEffect(() => {
    const wrapper = triggerWrapperRef.current
    if (!wrapper || typeof document === "undefined") {
      setPortalContainer(null)
      return
    }

    // Native <dialog>.showModal() creates top-layer stacking context.
    // Portaling into the nearest dialog keeps popover above dialog content.
    const closestDialog = wrapper.closest("dialog")
    setPortalContainer((closestDialog as HTMLElement | null) ?? document.body)
  }, [])

  const supportsHover = resolvedBehavior === "hover" || resolvedBehavior === "hybrid"
  const supportsClick = resolvedBehavior === "click" || resolvedBehavior === "hybrid"

  return (
    <Popover.Root open={open} onOpenChange={setOpen} modal={resolvedModal}>
      <Popover.Trigger asChild>
        <span
          ref={triggerWrapperRef}
          className={triggerWrapperClassName}
          onMouseEnter={() => {
            if (!supportsHover || disabled) return
            triggerHoveredRef.current = true
            openPopover()
          }}
          onMouseLeave={() => {
            if (!supportsHover || disabled) return
            triggerHoveredRef.current = false
            closePopover()
          }}
          onFocus={() => {
            if (!supportsHover || disabled) return
            triggerHoveredRef.current = true
            openPopover()
          }}
          onBlur={() => {
            if (!supportsHover || disabled) return
            triggerHoveredRef.current = false
            closePopover()
          }}
          onClick={(event) => {
            if (disabled || supportsClick) return
            // In hover-only mode, prevent Radix click toggle behavior.
            event.preventDefault()
          }}
          onPointerDown={() => {
            if (!supportsClick || disabled) return
            clearTimers()
          }}
        >
          {trigger}
        </span>
      </Popover.Trigger>

      <Popover.Portal container={portalContainer ?? undefined}>
        <Popover.Content
          side={resolvedSide}
          align={resolvedAlign}
          sideOffset={resolvedSideOffset}
          collisionPadding={resolvedCollisionPadding}
          className={contentClassName}
          onMouseEnter={() => {
            if (!supportsHover || disabled) return
            contentHoveredRef.current = true
            openPopover()
          }}
          onMouseLeave={() => {
            if (!supportsHover || disabled) return
            contentHoveredRef.current = false
            closePopover()
          }}
          onInteractOutside={() => {
            triggerHoveredRef.current = false
            contentHoveredRef.current = false
            closePopover(true)
          }}
          onEscapeKeyDown={() => {
            triggerHoveredRef.current = false
            contentHoveredRef.current = false
            closePopover(true)
          }}
          onMouseDown={contentOnMouseDown}
        >
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
