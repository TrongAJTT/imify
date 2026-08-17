import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { Tooltip } from "./tooltip";
import { useTranslation } from "@imify/i18n";
import {
  generateDefaultPresetName,
  formatPresetNameWithDateTime,
  type PresetNamingFeatureKey,
} from "@imify/core";

export interface PresetNameInputProps {
  value: string;
  onChange: (value: string) => void;
  featureKey?: PresetNamingFeatureKey | string;
  defaultPattern?: string;
  label?: string | null;
  placeholder?: string;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
  inputClassName?: string;
}

export interface PresetNameInputRef {
  focus: () => void;
  inputElement: HTMLInputElement | null;
}

export const PresetNameInput = forwardRef<
  PresetNameInputRef,
  PresetNameInputProps
>(function PresetNameInput(
  {
    value,
    onChange,
    featureKey,
    defaultPattern,
    label,
    placeholder = "e.g. Social Media Export",
    autoFocus = false,
    onKeyDown,
    className = "",
    inputClassName = "",
  },
  ref,
) {
  const { t } = useTranslation("common");
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    inputElement: inputRef.current,
  }));

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  const handleResetDefault = () => {
    let freshName = "";
    if (defaultPattern) {
      freshName = formatPresetNameWithDateTime(defaultPattern);
    } else if (featureKey) {
      freshName = generateDefaultPresetName(featureKey);
    } else {
      freshName = generateDefaultPresetName("processor");
    }
    onChange(freshName);
    inputRef.current?.focus();
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label !== null ? (
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          {label !== undefined ? label : t("name")}
        </label>
      ) : null}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onKeyDown={onKeyDown}
          className={`w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-3 pr-16 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 ${inputClassName}`}
        />
        <div className="absolute right-1.5 flex items-center gap-0.5">
          <Tooltip content={t("clearName")}>
            <button
              type="button"
              tabIndex={-1}
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label={t("clearName")}
            >
              <Trash2 size={13} />
            </button>
          </Tooltip>
          <Tooltip content={t("defaultName")}>
            <button
              type="button"
              tabIndex={-1}
              onClick={handleResetDefault}
              className="p-1 rounded-md text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label={t("defaultName")}
            >
              <RotateCcw size={13} />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
});
