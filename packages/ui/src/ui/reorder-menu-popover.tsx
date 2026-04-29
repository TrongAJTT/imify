import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  CornerDownLeft,
  CornerUpLeft,
} from "lucide-react"
import { useSafeAreaFloating } from "./use-safe-area-floating"

type ReorderMenuPosition = {
  x: number
  y: number
}

export type ReorderMenuPopoverItem = {
  id: string
  label: string
}

interface ReorderMenuPopoverProps {
  position: ReorderMenuPosition | null
  items: ReorderMenuPopoverItem[]
  currentItemId: string
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveTop: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onMoveBottom: () => void
  onMoveAbove: (targetItemId: string) => void
  onMoveBelow: (targetItemId: string) => void
  onClose: () => void
}

interface MenuActionProps {
  icon: React.ReactNode
  label: string
  disabled: boolean
  rightAdornment?: React.ReactNode
  onClick: () => void
}

function ReorderMenuAction({ icon, label, disabled, rightAdornment, onClick }: MenuActionProps) {
  return (
    <button
      type="button"
      role="menuitem"
      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
      disabled={disabled}
      onClick={onClick}
    >
      <span className="shrink-0 text-slate-400 dark:text-slate-500">{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
      {rightAdornment ? (
        <span className="ml-auto shrink-0 text-slate-300 dark:text-slate-600">{rightAdornment}</span>
      ) : null}
    </button>
  )
}

export function ReorderMenuPopover({
  position,
  items,
  currentItemId,
  canMoveUp,
  canMoveDown,
  onMoveTop,
  onMoveUp,
  onMoveDown,
  onMoveBottom,
  onMoveAbove,
  onMoveBelow,
  onClose,
}: ReorderMenuPopoverProps) {
  const isOpen = Boolean(position)
  const anchor = useMemo(
    () => (position ? ({ x: position.x, y: position.y } as const) : null),
    [position]
  )
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [openSubmenu, setOpenSubmenu] = useState<"above" | "below" | null>(null)
  const closeSubmenuTimeoutRef = useRef<number | null>(null)
  const aboveTriggerRef = useRef<HTMLDivElement | null>(null)
  const belowTriggerRef = useRef<HTMLDivElement | null>(null)
  const aboveSubmenuRef = useRef<HTMLDivElement | null>(null)
  const belowSubmenuRef = useRef<HTMLDivElement | null>(null)

  const cancelScheduledSubmenuClose = () => {
    if (closeSubmenuTimeoutRef.current !== null) {
      window.clearTimeout(closeSubmenuTimeoutRef.current)
      closeSubmenuTimeoutRef.current = null
    }
  }

  const scheduleSubmenuClose = (submenu: "above" | "below") => {
    cancelScheduledSubmenuClose()
    closeSubmenuTimeoutRef.current = window.setTimeout(() => {
      setOpenSubmenu((current) => (current === submenu ? null : current))
      closeSubmenuTimeoutRef.current = null
    }, 160)
  }

  useEffect(() => {
    if (!isOpen) {
      cancelScheduledSubmenuClose()
      setOpenSubmenu(null)
    }
  }, [isOpen])

  useEffect(() => {
    return () => {
      cancelScheduledSubmenuClose()
    }
  }, [])

  const safeMenu = useSafeAreaFloating({
    isOpen,
    anchor,
    floatingRef: menuRef,
    preferredPlacement: "right-start",
    offsetPx: 0,
    safePaddingPx: 8,
  })

  const moveTargetItems = useMemo(
    () => items.filter((entry) => entry.id !== currentItemId),
    [items, currentItemId]
  )

  const aboveAnchor = useMemo(() => {
    const el = aboveTriggerRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    return { x: rect.right, y: rect.top }
  }, [safeMenu.x, safeMenu.y, openSubmenu])
  const aboveAnchorAlt = useMemo(() => {
    const el = aboveTriggerRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    return { x: rect.left, y: rect.top }
  }, [safeMenu.x, safeMenu.y, openSubmenu])
  const belowAnchor = useMemo(() => {
    const el = belowTriggerRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    return { x: rect.right, y: rect.top }
  }, [safeMenu.x, safeMenu.y, openSubmenu])
  const belowAnchorAlt = useMemo(() => {
    const el = belowTriggerRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    return { x: rect.left, y: rect.top }
  }, [safeMenu.x, safeMenu.y, openSubmenu])

  const safeAbove = useSafeAreaFloating({
    isOpen: openSubmenu === "above",
    anchor: aboveAnchor,
    anchorAlt: aboveAnchorAlt,
    floatingRef: aboveSubmenuRef,
    preferredPlacement: "right-start",
    offsetPx: 6,
    safePaddingPx: 8,
  })
  const safeBelow = useSafeAreaFloating({
    isOpen: openSubmenu === "below",
    anchor: belowAnchor,
    anchorAlt: belowAnchorAlt,
    floatingRef: belowSubmenuRef,
    preferredPlacement: "right-start",
    offsetPx: 6,
    safePaddingPx: 8,
  })

  if (!isOpen || !position) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[1200]"
      onClick={onClose}
      onContextMenu={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <div
        role="menu"
        aria-label="Reorder card"
        className="absolute w-max rounded-md border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        style={{
          left: `${safeMenu.x}px`,
          top: `${safeMenu.y}px`,
        }}
        onClick={(event) => event.stopPropagation()}
        ref={menuRef}
      >
        <ReorderMenuAction
          icon={<ChevronsUp size={14} />}
          label="Move to top"
          disabled={!canMoveUp}
          onClick={onMoveTop}
        />
        <ReorderMenuAction
          icon={<ChevronUp size={14} />}
          label="Move up"
          disabled={!canMoveUp}
          onClick={onMoveUp}
        />
        <ReorderMenuAction
          icon={<ChevronDown size={14} />}
          label="Move down"
          disabled={!canMoveDown}
          onClick={onMoveDown}
        />
        <ReorderMenuAction
          icon={<ChevronsDown size={14} />}
          label="Move to bottom"
          disabled={!canMoveDown}
          onClick={onMoveBottom}
        />

        <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />

        <div
          ref={aboveTriggerRef}
          className="relative"
          onMouseEnter={() => {
            cancelScheduledSubmenuClose()
            setOpenSubmenu("above")
          }}
          onMouseLeave={() => scheduleSubmenuClose("above")}
        >
          <ReorderMenuAction
            icon={<CornerUpLeft size={14} />}
            label="Move above…"
            rightAdornment={<ChevronDown size={14} className="-rotate-90" />}
            disabled={moveTargetItems.length === 0}
            onClick={() => {
              // Intentionally no-op: hover submenu is the primary interaction.
            }}
          />
          <div
            ref={aboveSubmenuRef}
            className={openSubmenu === "above" ? "fixed" : "hidden"}
            style={{
              left: `${safeAbove.x}px`,
              top: `${safeAbove.y}px`,
            }}
            onMouseEnter={cancelScheduledSubmenuClose}
            onMouseLeave={() => scheduleSubmenuClose("above")}
          >
            <div className="w-max rounded-md border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="max-h-60 overflow-auto">
                {moveTargetItems.map((entry) => (
                  <ReorderMenuAction
                    key={`above_${entry.id}`}
                    icon={<span className="inline-block w-[14px]" />}
                    label={entry.label}
                    disabled={false}
                    onClick={() => onMoveAbove(entry.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          ref={belowTriggerRef}
          className="relative"
          onMouseEnter={() => {
            cancelScheduledSubmenuClose()
            setOpenSubmenu("below")
          }}
          onMouseLeave={() => scheduleSubmenuClose("below")}
        >
          <ReorderMenuAction
            icon={<CornerDownLeft size={14} />}
            label="Move below…"
            rightAdornment={<ChevronDown size={14} className="-rotate-90" />}
            disabled={moveTargetItems.length === 0}
            onClick={() => {
              // Intentionally no-op: hover submenu is the primary interaction.
            }}
          />
          <div
            ref={belowSubmenuRef}
            className={openSubmenu === "below" ? "fixed" : "hidden"}
            style={{
              left: `${safeBelow.x}px`,
              top: `${safeBelow.y}px`,
            }}
            onMouseEnter={cancelScheduledSubmenuClose}
            onMouseLeave={() => scheduleSubmenuClose("below")}
          >
            <div className="w-max rounded-md border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="max-h-60 overflow-auto">
                {moveTargetItems.map((entry) => (
                  <ReorderMenuAction
                    key={`below_${entry.id}`}
                    icon={<span className="inline-block w-[14px]" />}
                    label={entry.label}
                    disabled={false}
                    onClick={() => onMoveBelow(entry.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
