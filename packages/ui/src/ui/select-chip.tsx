import React from "react";
import { cn } from "./utils";
import { getThemeClasses, type ColorTheme } from "./theme-config";

export interface SelectChipProps {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  colorTheme?: ColorTheme;
}

export function SelectChip({
  label,
  isActive = false,
  onClick,
  className = "",
  icon,
  colorTheme = "sky",
}: SelectChipProps) {
  const themeClasses = getThemeClasses(colorTheme);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-2 rounded-lg border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 min-w-0 transition-all active:scale-[0.98]",
        isActive
          ? themeClasses.chipActive
          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700",
        className,
      )}
    >
      {icon && <span className="shrink-0 opacity-80">{icon}</span>}
      <span className="truncate">{label}</span>
    </button>
  );
}
