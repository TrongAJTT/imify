"use client"

import React, { useState } from "react"
import { Trash2 } from "lucide-react"
import { Button, BodyText, MutedText } from "@imify/ui"
import { useWatermarkStore } from "@imify/stores/stores/watermark-store"
import {
  WatermarkPreviewCard,
  EmptySavedWatermarkState,
  // buildWatermarkMetadata
} from "../../processor/watermark-open-saved-dialog"

export function AssetWatermarkTab() {
  const savedItems = useWatermarkStore((s) => s.savedWatermarks)
  const deleteSavedWatermark = useWatermarkStore((s) => s.deleteSavedWatermark)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedItem = savedItems.find((item) => item.id === selectedId)

  const handleDelete = () => {
    if (!selectedId || !selectedItem) return

    const shouldDelete = window.confirm(`Delete saved watermark "${selectedItem.name}"?`)
    if (!shouldDelete) return

    deleteSavedWatermark(selectedId)
    setSelectedId(null)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        {savedItems.length === 0 ? (
          <EmptySavedWatermarkState />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {savedItems.map((item) => (
              <WatermarkPreviewCard
                key={item.id}
                item={item}
                selected={item.id === selectedId}
                onSelect={setSelectedId}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="min-w-0">
          {selectedItem ? (
            <div className="flex flex-col">
              <BodyText className="text-xs font-semibold !text-slate-800 dark:!text-slate-100 truncate">
                {selectedItem.name}
              </BodyText>
              {/* <MutedText className="text-[10px] truncate">
                {buildWatermarkMetadata(selectedItem)}
              </MutedText> */}
            </div>
          ) : (
            <MutedText className="text-xs italic">
              Select a watermark to manage
            </MutedText>
          )}
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={!selectedId}
          className="gap-2 px-4 shrink-0"
        >
          <Trash2 size={14} />
          Delete
        </Button>
      </div>
    </div>
  )
}
