import { Plus, Trash2, Palette } from "lucide-react"

import type { SplitterColorRule } from "@/features/splitter/types"
import { AccordionCard } from "@/options/components/ui/accordion-card"
import { Button } from "@/options/components/ui/button"
import { ColorPickerPopover } from "@/options/components/ui/color-picker-popover"
import { NumberInput } from "@/options/components/ui/number-input"
import { SelectInput } from "@/options/components/ui/select-input"

interface ColorMatchRulesAccordionProps {
  rules: SplitterColorRule[]
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onAddRule: () => void
  onUpdateRule: (ruleId: string, patch: Partial<SplitterColorRule>) => void
  onRemoveRule: (ruleId: string) => void
}

const RULE_MODE_OPTIONS = [
  { value: "exist", label: "Exist" },
  { value: "min", label: "% Min" },
  { value: "max", label: "% Max" },
  { value: "exact", label: "% Exact" },
  { value: "error", label: "Error Range" }
]

function shouldShowValueInput(mode: SplitterColorRule["mode"]): boolean {
  return mode !== "exist"
}

export function ColorMatchRulesAccordion({
  rules,
  isOpen,
  onOpenChange,
  onAddRule,
  onUpdateRule,
  onRemoveRule
}: ColorMatchRulesAccordionProps) {
  return (
    <AccordionCard
      icon={<Palette size={14} />}
      label="Color Match Rules"
      sublabel={`${rules.length} rule${rules.length === 1 ? "" : "s"}`}
      colorTheme="blue"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <div className="space-y-3">
        {rules.map((rule, index) => (
          <div key={rule.id} className="rounded-md border border-slate-200 p-2.5 dark:border-slate-700">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Rule #{index + 1}</div>
              <button
                type="button"
                onClick={() => onRemoveRule(rule.id)}
                disabled={rules.length <= 1}
                className="rounded p-1 text-red-500 transition-colors hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed dark:hover:bg-red-500/15"
                aria-label={`Remove color rule ${index + 1}`}
              >
                <Trash2 size={13} />
              </button>
            </div>

            <div className="space-y-2">
              <ColorPickerPopover
                label="Color"
                value={rule.color}
                onChange={(value) => onUpdateRule(rule.id, { color: value })}
                enableAlpha={false}
                enableGradient={false}
              />

              <SelectInput
                label="Mode"
                value={rule.mode}
                options={RULE_MODE_OPTIONS}
                onChange={(value) => onUpdateRule(rule.id, { mode: value as SplitterColorRule["mode"] })}
              />

              {shouldShowValueInput(rule.mode) ? (
                <NumberInput
                  label="Target (%)"
                  value={rule.value}
                  min={0}
                  max={100}
                  onChangeValue={(value) => onUpdateRule(rule.id, { value })}
                />
              ) : null}

              {rule.mode === "error" ? (
                <NumberInput
                  label="Error Margin (%)"
                  value={rule.errorMargin}
                  min={0}
                  max={100}
                  onChangeValue={(value) => onUpdateRule(rule.id, { errorMargin: value })}
                />
              ) : null}
            </div>
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={onAddRule} className="w-full gap-1.5">
          <Plus size={14} />
          Add Color Rule
        </Button>
      </div>
    </AccordionCard>
  )
}
