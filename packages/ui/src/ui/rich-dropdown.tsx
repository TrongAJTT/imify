import React, { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { ControlledPopover } from "./controlled-popover";

export interface RichDropdownOption<T extends string> {
  value: T;
  displayLabel?: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

interface RichDropdownProps<T extends string> {
  value: T;
  options: RichDropdownOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  align?: "start" | "center" | "end";
}

export function RichDropdown<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  className = "",
  align = "start",
}: RichDropdownProps<T>) {
  const currentOption =
    options.find((opt) => opt.value === value) || options[0];
  const [isOpen, setIsOpen] = useState(false);

  const triggerButton = (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setIsOpen(!isOpen)}
      className={`inline-flex items-center justify-between gap-2 h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold leading-5 text-slate-700 outline-none transition-all dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {currentOption?.icon}
        <span className="truncate">
          {currentOption?.displayLabel ?? currentOption?.label}
        </span>
      </div>
      <ChevronDown
        size={14}
        className="text-slate-400 dark:text-slate-500 shrink-0"
      />
    </button>
  );

  return (
    <ControlledPopover
      trigger={triggerButton}
      preset="dropdown"
      align={align}
      disabled={disabled}
      closeOnContentClick={true}
    >
      <div className="z-50 min-w-[220px] rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-1 shadow-lg outline-none animate-in fade-in-50 zoom-in-95 duration-100">
        <div className="flex flex-col gap-0.5">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={`flex items-start gap-2.5 w-full text-left rounded-md px-2.5 py-2 transition-colors ${
                  isSelected
                    ? "bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                {option.icon && (
                  <div
                    className={`mt-0.5 shrink-0 ${isSelected ? "text-sky-500" : "text-slate-400"}`}
                  >
                    {option.icon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold truncate">
                      {option.label}
                    </span>
                    {isSelected && (
                      <Check size={12} className="text-sky-500 shrink-0" />
                    )}
                  </div>
                  {option.sublabel && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                      {option.sublabel}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </ControlledPopover>
  );
}
