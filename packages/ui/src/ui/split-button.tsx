import React, { type ReactNode } from "react";
import { Button } from "./button";
import { ChevronDown } from "lucide-react";
import { ControlledPopover } from "./controlled-popover";

export interface SplitButtonOption {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  className?: string;
}

interface SplitButtonProps {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  options: SplitButtonOption[];
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  variant?: "primary" | "secondary" | "destructive" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function SplitButton({
  label,
  icon,
  onClick,
  options,
  disabled = false,
  className,
  buttonClassName,
  menuClassName,
  variant = "secondary",
  size,
}: SplitButtonProps) {
  // Find height override class (e.g. h-7, h-8, h-9) from buttonClassName to apply to both buttons
  const heightClass =
    buttonClassName?.split(" ").find((c) => c.startsWith("h-")) || "";

  return (
    <div
      className={`inline-flex shadow-sm rounded-lg items-stretch ${className || ""}`}
    >
      <Button
        variant={variant}
        size={size}
        disabled={disabled}
        onClick={onClick}
        className={`rounded-r-none border-r-0 flex items-center justify-center ${buttonClassName || ""}`}
      >
        {icon && (
          <span className="mr-0.5 flex items-center shrink-0">{icon}</span>
        )}
        <span>{label}</span>
      </Button>

      <ControlledPopover
        preset="dropdown"
        align="end"
        disabled={disabled || options.length === 0}
        closeOnContentClick={true}
        trigger={
          <Button
            variant={variant}
            size={size}
            disabled={disabled}
            className={`rounded-l-none px-1.5 flex items-center justify-center border-l border-slate-200 dark:border-slate-700 h-full ${heightClass}`}
          >
            <ChevronDown size={14} />
          </Button>
        }
      >
        <div
          className={`p-1 flex flex-col min-w-[160px] bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 text-xs select-none ${menuClassName || ""}`}
        >
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                opt.onClick();
              }}
              className={`w-full text-left px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors text-slate-700 dark:text-slate-200 flex items-center gap-1.5 ${opt.className || ""}`}
            >
              {opt.icon && (
                <span className="flex items-center shrink-0 text-slate-400 dark:text-slate-500">
                  {opt.icon}
                </span>
              )}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </ControlledPopover>
    </div>
  );
}
