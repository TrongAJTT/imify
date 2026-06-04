import React from "react";
import { cn } from "./utils";
import { type ColorTheme } from "./theme-config";
import { Tooltip } from "./tooltip";

export interface GridIconSelectorOption<T extends string> {
  value: T;
  label: string;
  icon: React.ReactNode;
}

export interface GridIconSelectorProps<T extends string> {
  value: T;
  options: GridIconSelectorOption<T>[];
  onChange: (value: T) => void;
  colorTheme?: ColorTheme;
  columns?: number;
  className?: string;
  itemClassName?: string;
}

/**
 * A standardized grid-based selector that uses icons as the primary visual element.
 * Perfect for selecting styles, patterns, or templates.
 */
export function GridIconSelector<T extends string>({
  value,
  options,
  onChange,
  colorTheme = "purple",
  columns = 4,
  className,
  itemClassName,
}: GridIconSelectorProps<T>) {
  const getThemeClasses = (isActive: boolean) => {
    if (!isActive) {
      return "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500";
    }

    switch (colorTheme) {
      case "blue":
        return "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400";
      case "amber":
        return "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400";
      case "sky":
        return "border-sky-500 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400";
      case "orange":
        return "border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400";
      case "pink":
        return "border-pink-500 bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400";
      default:
        // purple
        return "border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400";
    }
  };

  return (
    <div className={cn(`grid gap-1.5 grid-cols-${columns}`, className)}>
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <Tooltip key={opt.value} content={opt.label}>
            <button
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex items-center justify-center p-1.5 rounded-lg border-2 transition-all aspect-square outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600",
                getThemeClasses(isActive),
                itemClassName,
              )}
            >
              <div className="w-full h-full flex items-center justify-center">
                {React.isValidElement(opt.icon)
                  ? React.cloneElement(opt.icon as React.ReactElement<any>, {
                      className: cn(
                        "w-full h-full",
                        (opt.icon as any).props?.className,
                      ),
                    })
                  : opt.icon}
              </div>
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
