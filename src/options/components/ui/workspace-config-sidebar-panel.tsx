import {
  useEffect,
  useMemo,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
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

import { SidebarPanel } from "@/options/components/ui/sidebar-panel"

export interface WorkspaceConfigSidebarItem {
  id: string
  content: ReactNode
  columnSpan?: 1 | 2
}

interface WorkspaceConfigSidebarPanelProps {
  items: WorkspaceConfigSidebarItem[]
  twoColumn?: boolean
  title?: string
  className?: string
}

function mergeOrderedIds(previousOrder: string[], nextIds: string[]): string[] {
  const nextSet = new Set(nextIds)
  const kept = previousOrder.filter((id) => nextSet.has(id))
  const appended = nextIds.filter((id) => !kept.includes(id))
  return [...kept, ...appended]
}

function canStartWorkspaceCardDrag(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return true
  }

  const accordionContainer = target.closest<HTMLElement>("[data-accordion-card-container]")
  if (!accordionContainer) {
    return true
  }

  const isOpen = accordionContainer.dataset.accordionOpen === "true"
  if (!isOpen) {
    return true
  }

  return Boolean(target.closest("[data-accordion-card-header]"))
}

class WorkspaceCardPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: ({ nativeEvent }: ReactPointerEvent<Element>) =>
        canStartWorkspaceCardDrag(nativeEvent.target),
    },
  ]
}

function SortableWorkspaceConfigItem({
  itemId,
  children,
}: {
  itemId: string
  children: ReactNode
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
  title = "CONFIGURATION",
  className,
}: WorkspaceConfigSidebarPanelProps) {
  const itemIds = useMemo(() => items.map((item) => item.id), [items])
  const itemMap = useMemo(() => new Map(items.map((item) => [item.id, item])), [items])

  const [orderedIds, setOrderedIds] = useState<string[]>(itemIds)

  useEffect(() => {
    setOrderedIds((previousOrder) => mergeOrderedIds(previousOrder, itemIds))
  }, [itemIds])

  const orderedItems = useMemo(
    () =>
      orderedIds
        .map((id) => itemMap.get(id))
        .filter((item): item is WorkspaceConfigSidebarItem => Boolean(item)),
    [orderedIds, itemMap]
  )

  const splitIndex = useMemo(() => {
    if (!twoColumn) {
      return orderedItems.length
    }

    return Math.ceil(orderedItems.length / 2)
  }, [orderedItems.length, twoColumn])

  const leftColumnItems = useMemo(
    () => orderedItems.slice(0, splitIndex),
    [orderedItems, splitIndex]
  )

  const rightColumnItems = useMemo(
    () => orderedItems.slice(splitIndex),
    [orderedItems, splitIndex]
  )

  const sensors = useSensors(
    useSensor(WorkspaceCardPointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

  return (
    <SidebarPanel title={title} className={className} childrenClassName="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={orderedItems.map((item) => item.id)}
          strategy={twoColumn ? rectSortingStrategy : verticalListSortingStrategy}
        >
          {!twoColumn ? (
            <div className="flex flex-col gap-3">
              {orderedItems.map((item) => (
                <SortableWorkspaceConfigItem key={item.id} itemId={item.id}>
                  {item.content}
                </SortableWorkspaceConfigItem>
              ))}
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1 space-y-3">
                {leftColumnItems.map((item) => (
                  <SortableWorkspaceConfigItem key={item.id} itemId={item.id}>
                    {item.content}
                  </SortableWorkspaceConfigItem>
                ))}
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                {rightColumnItems.map((item) => (
                  <SortableWorkspaceConfigItem key={item.id} itemId={item.id}>
                    {item.content}
                  </SortableWorkspaceConfigItem>
                ))}
              </div>
            </div>
          )}
        </SortableContext>
      </DndContext>
    </SidebarPanel>
  )
}
