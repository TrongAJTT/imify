import React from "react";
import { Tooltip } from "./tooltip";
import { cn } from "./utils";

export interface CardActionButtonProps {
  icon: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  tooltip?: string;
  tooltipLabel?: string;
  ariaLabel?: string;
  destructive?: boolean;
  activePin?: boolean;
  disabled?: boolean;
  className?: string;
}

export function CardActionButton({
  icon,
  onClick,
  tooltip,
  tooltipLabel,
  ariaLabel,
  destructive = false,
  activePin = false,
  disabled = false,
  className = "",
}: CardActionButtonProps) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) {
      onClick?.(event);
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  const baseClasses = cn(
    "flex items-center justify-center rounded p-1 text-xs transition-colors outline-none",
    destructive
      ? "text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/20"
      : activePin
        ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/20"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100",
    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
    className,
  );

  const button = (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onMouseDown={handleMouseDown}
      disabled={disabled}
      aria-label={ariaLabel || tooltipLabel || tooltip || "Action"}
      className={baseClasses}
    >
      {icon}
    </button>
  );

  if (tooltip || tooltipLabel) {
    return (
      <Tooltip content={tooltip} label={tooltipLabel} variant="normal">
        {button}
      </Tooltip>
    );
  }

  return button;
}

export interface CardActionToolbarProps {
  children: React.ReactNode;
  /**
   * If true, toolbar is always visible regardless of hover state (e.g. when card is active or pinned).
   */
  alwaysVisible?: boolean;
  /**
   * Additional class names for the outer positioner.
   */
  className?: string;
  /**
   * Additional class names for the inner pill container.
   */
  containerClassName?: string;
}

export function CardActionToolbar({
  children,
  alwaysVisible = false,
  className = "",
  containerClassName = "",
}: CardActionToolbarProps) {
  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
      onKeyDown={(e) => e.stopPropagation()}
      className={cn(
        "absolute right-2 top-2 z-20 transition-all duration-150",
        alwaysVisible
          ? "opacity-100 translate-y-0"
          : "max-md:opacity-100 max-md:translate-y-0 md:opacity-0 md:translate-y-1 md:group-hover:opacity-100 md:group-hover:translate-y-0 md:group-focus-within:opacity-100 md:group-focus-within:translate-y-0",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-0.5 rounded-md border border-slate-200 bg-white/95 p-0.5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/95",
          containerClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
