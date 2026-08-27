import React from "react";
import { cn } from "./utils";
import { getThemeClasses, type ColorTheme } from "./theme-config";
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
  const themeClasses = getThemeClasses(colorTheme);
  const getItemClasses = (isActive: boolean) => {
    if (!isActive) {
      return "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500";
    }

    return themeClasses.gridActive;
  };

  const columnClasses: Record<number, string> = {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
    6: "md:grid-cols-6",
    7: "md:grid-cols-7",
    8: "md:grid-cols-8",
  };

  return (
    <div
      className={cn(
        "grid gap-1.5 grid-cols-6",
        columnClasses[columns] || "md:grid-cols-4",
        className,
      )}
    >
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <Tooltip key={opt.value} content={opt.label}>
            <button
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex items-center justify-center p-1.5 rounded-lg border-2 transition-all aspect-square outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600",
                getItemClasses(isActive),
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
