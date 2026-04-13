import { useFillingStore } from "@/options/stores/filling-store"
import { SelectInput } from "@/options/components/ui/select-input"
import type { TemplateSortMode } from "@/features/filling/types"

const SORT_OPTIONS: Array<{ value: TemplateSortMode; label: string }> = [
  { value: "usage_count", label: "Most used" },
  { value: "recently_created", label: "Recently created" },
  { value: "recently_used", label: "Recently used" },
  { value: "name_asc", label: "Name (A-Z)" },
  { value: "name_desc", label: "Name (Z-A)" },
]

export function TemplateSortBar() {
  const sortMode = useFillingStore((s) => s.sortMode)
  const setSortMode = useFillingStore((s) => s.setSortMode)

  return (
    <div className="flex items-center gap-3">
      <div className="w-48">
        <SelectInput
          label="Sort by"
          value={sortMode}
          options={SORT_OPTIONS}
          onChange={(v) => setSortMode(v as TemplateSortMode)}
        />
      </div>
    </div>
  )
}
