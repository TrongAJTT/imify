import React from "react"
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { ReorderMenuPopover, type ReorderMenuPopoverItem } from "./reorder-menu-popover"
import { SidebarPanel } from "./sidebar-panel"

export interface WorkspaceConfigSidebarItem {
  id: string
  /** Optional display label used by reorder menu/popovers. */
  label?: string
  content: ReactNode
  columnSpan?: 1 | 2
}

interface WorkspaceConfigSidebarPanelProps {
  items: WorkspaceConfigSidebarItem[]
  twoColumn?: boolean
  autoTwoColumnMinWidthPx?: number | null
  title?: string
  className?: string
}

type ReorderMenuState = {
  itemId: string
  x: number
  y: number
}

function mergeOrderedIds(previousOrder: string[], nextIds: string[]): string[] {
  const nextSet = new Set(nextIds)
  const kept = previousOrder.filter((id) => nextSet.has(id))
  const appended = nextIds.filter((id) => !kept.includes(id))
  return [...kept, ...appended]
}

function resolveWorkspaceConfigItemLabel(item: WorkspaceConfigSidebarItem): string {
  if (typeof item.label === "string" && item.label.trim()) {
    return item.label.trim()
  }

  const node = item.content
  if (React.isValidElement(node)) {
    const props = node.props as any
    if (typeof props?.label === "string" && props.label.trim()) {
      return props.label
    }
    if (typeof props?.title === "string" && props.title.trim()) {
      return props.title
    }
  }
  return item.id
}

function canOpenReorderMenu(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return true
  }

  // Allow right-click on accordion header even though it's a button.
  if (target.closest("[data-accordion-card-header]")) {
    return true
  }

  const accordionContainer = target.closest("[data-accordion-card-container]") as HTMLElement | null
  if (!accordionContainer) {
    return true
  }

  // For open accordion cards, only header should show reorder menu.
  return accordionContainer.dataset.accordionOpen !== "true"
}

function canStartWorkspaceCardDrag(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return true
  }

  const accordionContainer = target.closest("[data-accordion-card-container]") as HTMLElement | null
  if (!accordionContainer) {
    return true
  }

  const isOpen = accordionContainer.dataset.accordionOpen === "true"
  if (!isOpen) {
    return true
  }

  return Boolean(target.closest("[data-accordion-card-header]"))
}

class WorkspaceCardTouchSensor extends TouchSensor {
  static activators = [
    {
      eventName: "onTouchStart" as const,
      handler: ({ nativeEvent }: React.TouchEvent<Element>) =>
        canStartWorkspaceCardDrag(nativeEvent.target),
    },
  ]
}

class WorkspaceCardMouseSensor extends MouseSensor {
  static activators = [
    {
      eventName: "onMouseDown" as const,
      handler: ({ nativeEvent }: React.MouseEvent<Element>) =>
        canStartWorkspaceCardDrag(nativeEvent.target),
    },
  ]
}

function SortableWorkspaceConfigItem({
  itemId,
  children,
  onOpenReorderMenu,
}: {
  itemId: string
  children: ReactNode
  onOpenReorderMenu: (itemId: string, event: ReactMouseEvent<HTMLDivElement>) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: itemId })

  const transformWithoutScale = transform
    ? CSS.Transform.toString({
        ...transform,
        scaleX: 1,
        scaleY: 1,
      })
    : undefined

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onContextMenu={(event) => onOpenReorderMenu(itemId, event)}
      style={{
        transform: transformWithoutScale,
        transition,
      }}
      className={isDragging ? "opacity-70" : ""}
    >
      {children}
    </div>
  )
}

export function WorkspaceConfigSidebarPanel({
  items,
  twoColumn = false,
  autoTwoColumnMinWidthPx = null,
  title = "CONFIGURATION",
  className,
}: WorkspaceConfigSidebarPanelProps) {
  const dndContextId = React.useId()
  const itemIds = useMemo(() => items.map((item) => item.id), [items])
  const itemMap = useMemo(() => new Map(items.map((item) => [item.id, item])), [items])

  const [orderedIds, setOrderedIds] = useState<string[]>(itemIds)
  const [containerWidth, setContainerWidth] = useState<number>(0)
  const [reorderMenu, setReorderMenu] = useState<ReorderMenuState | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setOrderedIds((previousOrder) => mergeOrderedIds(previousOrder, itemIds))
  }, [itemIds])

  useEffect(() => {
    if (!autoTwoColumnMinWidthPx || !contentRef.current || typeof ResizeObserver === "undefined") {
      return
    }
    const node = contentRef.current
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      setContainerWidth(entry.contentRect.width)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [autoTwoColumnMinWidthPx])

  const effectiveTwoColumn =
    twoColumn ||
    (typeof autoTwoColumnMinWidthPx === "number" &&
      autoTwoColumnMinWidthPx > 0 &&
      containerWidth >= autoTwoColumnMinWidthPx)

  const orderedItems = useMemo(
    () =>
      orderedIds
        .map((id) => itemMap.get(id))
        .filter((item): item is WorkspaceConfigSidebarItem => Boolean(item)),
    [orderedIds, itemMap]
  )

  const splitIndex = useMemo(() => {
    if (!effectiveTwoColumn) {
      return orderedItems.length
    }

    return Math.ceil(orderedItems.length / 2)
  }, [effectiveTwoColumn, orderedItems.length])

  const leftColumnItems = useMemo(
    () => orderedItems.slice(0, splitIndex),
    [orderedItems, splitIndex]
  )

  const rightColumnItems = useMemo(
    () => orderedItems.slice(splitIndex),
    [orderedItems, splitIndex]
  )

  const sensors = useSensors(
    useSensor(WorkspaceCardMouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(WorkspaceCardTouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const moveItem = (itemId: string, direction: "top" | "up" | "down" | "bottom") => {
    setOrderedIds((currentOrder) => {
      const index = currentOrder.indexOf(itemId)
      if (index < 0) {
        return currentOrder
      }

      if (direction === "top") {
        if (index === 0) return currentOrder
        return arrayMove(currentOrder, index, 0)
      }

      if (direction === "up") {
        if (index <= 0) return currentOrder
        return arrayMove(currentOrder, index, index - 1)
      }

      if (direction === "down") {
        if (index >= currentOrder.length - 1) return currentOrder
        return arrayMove(currentOrder, index, index + 1)
      }

      if (index === currentOrder.length - 1) return currentOrder
      return arrayMove(currentOrder, index, currentOrder.length - 1)
    })
  }

  const moveItemRelativeTo = (
    itemId: string,
    targetItemId: string,
    placement: "above" | "below"
  ) => {
    if (itemId === targetItemId) {
      return
    }

    setOrderedIds((currentOrder) => {
      const fromIndex = currentOrder.indexOf(itemId)
      if (fromIndex < 0) {
        return currentOrder
      }

      const nextOrder = currentOrder.filter((id) => id !== itemId)
      const targetIndex = nextOrder.indexOf(targetItemId)
      if (targetIndex < 0) {
        return currentOrder
      }

      const insertIndex = placement === "above" ? targetIndex : targetIndex + 1
      nextOrder.splice(insertIndex, 0, itemId)
      return nextOrder
    })
  }

  const handleOpenReorderMenu = (itemId: string, event: ReactMouseEvent<HTMLDivElement>) => {
    if (!canOpenReorderMenu(event.target)) {
      return
    }
    event.preventDefault()
    setReorderMenu({
      itemId,
      x: event.clientX,
      y: event.clientY,
    })
  }

  const activeMenuIndex = reorderMenu ? orderedIds.indexOf(reorderMenu.itemId) : -1
  const canMoveUp = activeMenuIndex > 0
  const canMoveDown = activeMenuIndex >= 0 && activeMenuIndex < orderedIds.length - 1

  const reorderMenuItems: ReorderMenuPopoverItem[] = useMemo(() => {
    return orderedItems.map((item) => ({
      id: item.id,
      label: resolveWorkspaceConfigItemLabel(item),
    }))
  }, [orderedItems])

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) {
      return
    }

    const activeId = String(active.id)
    const overId = String(over.id)

    if (activeId === overId) {
      return
    }

    setOrderedIds((currentOrder) => {
      const oldIndex = currentOrder.indexOf(activeId)
      const newIndex = currentOrder.indexOf(overId)

      if (oldIndex < 0 || newIndex < 0) {
        return currentOrder
      }

      return arrayMove(currentOrder, oldIndex, newIndex)
    })
  }

  useEffect(() => {
    if (!reorderMenu) {
      return
    }

    const closeMenu = () => setReorderMenu(null)
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu()
      }
    }

    window.addEventListener("resize", closeMenu)
    window.addEventListener("scroll", closeMenu, true)
    window.addEventListener("keydown", handleEscape)
    return () => {
      window.removeEventListener("resize", closeMenu)
      window.removeEventListener("scroll", closeMenu, true)
      window.removeEventListener("keydown", handleEscape)
    }
  }, [reorderMenu])

  return (
    <SidebarPanel title={title} className={className} childrenClassName="space-y-3">
      <DndContext id={dndContextId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={orderedItems.map((item) => item.id)}
          strategy={effectiveTwoColumn ? rectSortingStrategy : verticalListSortingStrategy}
        >
          {!effectiveTwoColumn ? (
            <div className="flex flex-col gap-3" ref={contentRef}>
              {orderedItems.map((item) => (
                <SortableWorkspaceConfigItem
                  key={item.id}
                  itemId={item.id}
                  onOpenReorderMenu={handleOpenReorderMenu}
                >
                  {item.content}
                </SortableWorkspaceConfigItem>
              ))}
            </div>
          ) : (
            <div className="flex items-start gap-3" ref={contentRef}>
              <div className="min-w-0 flex-1 space-y-3">
                {leftColumnItems.map((item) => (
                  <SortableWorkspaceConfigItem
                    key={item.id}
                    itemId={item.id}
                    onOpenReorderMenu={handleOpenReorderMenu}
                  >
                    {item.content}
                  </SortableWorkspaceConfigItem>
                ))}
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                {rightColumnItems.map((item) => (
                  <SortableWorkspaceConfigItem
                    key={item.id}
                    itemId={item.id}
                    onOpenReorderMenu={handleOpenReorderMenu}
                  >
                    {item.content}
                  </SortableWorkspaceConfigItem>
                ))}
              </div>
            </div>
          )}
        </SortableContext>
      </DndContext>
      <ReorderMenuPopover
        position={reorderMenu ? { x: reorderMenu.x, y: reorderMenu.y } : null}
        items={reorderMenuItems}
        currentItemId={reorderMenu?.itemId ?? ""}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        onMoveTop={() => {
          if (!reorderMenu) return
          moveItem(reorderMenu.itemId, "top")
          setReorderMenu(null)
        }}
        onMoveUp={() => {
          if (!reorderMenu) return
          moveItem(reorderMenu.itemId, "up")
          setReorderMenu(null)
        }}
        onMoveDown={() => {
          if (!reorderMenu) return
          moveItem(reorderMenu.itemId, "down")
          setReorderMenu(null)
        }}
        onMoveBottom={() => {
          if (!reorderMenu) return
          moveItem(reorderMenu.itemId, "bottom")
          setReorderMenu(null)
        }}
        onMoveAbove={(targetItemId) => {
          if (!reorderMenu) return
          moveItemRelativeTo(reorderMenu.itemId, targetItemId, "above")
          setReorderMenu(null)
        }}
        onMoveBelow={(targetItemId) => {
          if (!reorderMenu) return
          moveItemRelativeTo(reorderMenu.itemId, targetItemId, "below")
          setReorderMenu(null)
        }}
        onClose={() => setReorderMenu(null)}
      />
    </SidebarPanel>
  )
}

