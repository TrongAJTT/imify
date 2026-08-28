import React, { useEffect, useState } from "react";
import { Check, Save } from "lucide-react";
import { BaseDialog, Button, PresetNameInput } from "@imify/ui";
import { useTranslation } from "@imify/i18n";
import type { PresetNamingFeatureKey } from "@imify/core";

interface SavePresetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
  defaultName: string;
  highlightColors: readonly string[];
  title?: string;
  featureKey?: PresetNamingFeatureKey | string;
  defaultPattern?: string;
}

export function SavePresetDialog({
  isOpen,
  onClose,
  onSave,
  defaultName,
  highlightColors,
  title = "Save Configuration Preset",
  featureKey = "processor",
  defaultPattern,
}: SavePresetDialogProps): React.ReactElement | null {
  const { t } = useTranslation("common");
  const [presetName, setPresetName] = useState(defaultName);
  const [presetColor, setPresetColor] = useState(
    highlightColors[0] ?? "#0ea5e9",
  );

  useEffect(() => {
    if (isOpen) setPresetName(defaultName);
  }, [isOpen, defaultName]);

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      contentClassName="p-4"
    >
      <div className="mb-4 flex items-center justify-between pr-8">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
      </div>
        <div className="space-y-4">
          <PresetNameInput
            value={presetName}
            onChange={setPresetName}
            featureKey={featureKey}
            defaultPattern={defaultPattern}
            autoFocus
            placeholder="e.g. Social Media Export"
            onKeyDown={(e) => {
              if (e.key === "Enter" && presetName.trim())
                onSave(presetName, presetColor);
            }}
          />
          <div>
            <span className="block text-xs font-medium text-slate-600 dark:text-slate-300">
              {t("highlightColor")}
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {highlightColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setPresetColor(color)}
                  className={`h-7 w-7 rounded-full border-2 transition-all hover:scale-110 ${presetColor === color ? "border-slate-900 ring-2 ring-slate-900/20 dark:border-slate-100" : "border-transparent"}`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select highlight color ${color}`}
                >
                  {presetColor === color ? (
                    <Check
                      size={12}
                      className="mx-auto text-white drop-shadow-sm"
                    />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="px-4"
            >
              {t("cancel")}
            </Button>
            <Button
              size="sm"
              onClick={() => onSave(presetName, presetColor)}
              disabled={!presetName.trim()}
              className="gap-1.5 px-4"
            >
              <Save size={14} />
              {t("save")}
            </Button>
          </div>
        </div>
    </BaseDialog>
  );
}
