import React, { useMemo } from "react"
import { Plus, Trash2, Palette } from "lucide-react"

import type { SplitterColorRule } from "./types"
import { AccordionCard } from "@imify/ui"
import { Button } from "@imify/ui"
import { ColorPickerPopover } from "@imify/ui"
import { NumberInput } from "@imify/ui"
import { SelectInput } from "@imify/ui"
import { useTranslation } from "@imify/i18n"

interface ColorMatchRulesAccordionProps {
  rules: SplitterColorRule[]
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onAddRule: () => void
  onUpdateRule: (ruleId: string, patch: Partial<SplitterColorRule>) => void
  onRemoveRule: (ruleId: string) => void
}

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
  const { t } = useTranslation("splitter")

  const ruleModeOptions = useMemo(() => [
    { value: "exist", label: t("ruleExist") },
    { value: "min", label: t("ruleMin") },
    { value: "max", label: t("ruleMax") },
    { value: "exact", label: t("ruleExact") },
    { value: "error", label: t("ruleError") }
  ], [t])

  const sublabel = rules.length === 1
    ? t("ruleCount_one")
    : t("ruleCount_other", { count: rules.length })

  return (
    <AccordionCard
      icon={<Palette size={14} />}
      label={t("colorMatchRules")}
      sublabel={sublabel}
      colorTheme="blue"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <div className="space-y-3">
        {rules.map((rule, index) => (
          <div key={rule.id} className="rounded-md border border-slate-200 p-2.5 dark:border-slate-700">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("ruleLabel")} #{index + 1}
              </div>
              <button
                type="button"
                onClick={() => onRemoveRule(rule.id)}
                disabled={rules.length <= 1}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed dark:hover:bg-slate-800"
                aria-label={`Remove color rule ${index + 1}`}
              >
                <Trash2 size={13} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <SelectInput
                  label={t("mode")}
                  value={rule.mode}
                  options={ruleModeOptions}
                  onChange={(value) => onUpdateRule(rule.id, { mode: value as SplitterColorRule["mode"] })}
                />
                <ColorPickerPopover
                  label={t("color")}
                  value={rule.color}
                  onChange={(value) => onUpdateRule(rule.id, { color: value })}
                  enableAlpha={false}
                  enableGradient={false}
                  appearance="stacked"
                />

                {shouldShowValueInput(rule.mode) && (
                  <NumberInput
                    label={t("targetPercent")}
                    value={rule.value}
                    min={0}
                    max={100}
                    onChangeValue={(value) => onUpdateRule(rule.id, { value })}
                  />
                )}

                {rule.mode === "error" && (
                  <NumberInput
                    label={t("errorMarginPercent")}
                    value={rule.errorMargin}
                    min={0}
                    max={100}
                    onChangeValue={(value) => onUpdateRule(rule.id, { errorMargin: value })}
                  />
                )}
              </div>
            </div>
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={onAddRule} className="w-full gap-1.5">
          <Plus size={14} />
          {t("addColorRule")}
        </Button>
      </div>
    </AccordionCard>
  )
}



