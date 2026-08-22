"use client";

import React, {
  useCallback,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Tooltip } from "./tooltip";

export type BaseTriggerMode = "toggle" | "per_tap" | "double_tap";

export interface BaseTriggerState {
  active: boolean;
  locked: boolean;
  /** Activate or toggle the trigger depending on mode */
  trigger: () => void;
  /** Explicitly set active and locked state */
  setState: (active: boolean, locked?: boolean) => void;
  /**
   * Consume a single-use action.
   * If in `per_tap` mode or transient `double_tap` (unlocked), resets `active` to `false`.
   * If `locked` is true, calling `consume` is a NO-OP (stays active).
   */
  consume: () => void;
  /** Reset both active and locked to false */
  reset: () => void;
}

export interface UseBaseTriggerOptions {
  mode?: BaseTriggerMode;
  defaultActive?: boolean;
  defaultLocked?: boolean;
  onChange?: (active: boolean, locked: boolean) => void;
  doubleTapThresholdMs?: number;
}

/**
 * Hook providing trigger state logic for toggle, per_tap, and double_tap (persistent lock) modes.
 */
export function useBaseTriggerState(
  options: UseBaseTriggerOptions = {},
): BaseTriggerState {
  const {
    mode = "double_tap",
    defaultActive = false,
    defaultLocked = false,
    onChange,
    doubleTapThresholdMs = 300,
  } = options;

  const [active, setActiveState] = useState(defaultActive);
  const [locked, setLockedState] = useState(defaultLocked);

  const activeRef = useRef(active);
  activeRef.current = active;
  const lockedRef = useRef(locked);
  lockedRef.current = locked;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const lastClickTimeRef = useRef<number>(0);

  const updateState = useCallback((nextActive: boolean, nextLocked: boolean) => {
    setActiveState(nextActive);
    setLockedState(nextLocked);
    onChangeRef.current?.(nextActive, nextLocked);
  }, []);

  const trigger = useCallback(() => {
    const now = Date.now();
    const isDoubleTap = now - lastClickTimeRef.current < doubleTapThresholdMs;
    lastClickTimeRef.current = now;

    if (mode === "toggle") {
      const nextActive = !activeRef.current;
      updateState(nextActive, false);
      return;
    }

    if (mode === "per_tap") {
      // Toggle on/off manually if already active
      const nextActive = !activeRef.current;
      updateState(nextActive, false);
      return;
    }

    if (mode === "double_tap") {
      if (isDoubleTap) {
        // Double tap toggles persistent lock state
        if (activeRef.current && lockedRef.current) {
          // If already locked, double tap turns off
          updateState(false, false);
        } else {
          // Lock ON
          updateState(true, true);
        }
      } else {
        // Single tap: toggle transient on/off
        if (activeRef.current) {
          // Turn off if already active or locked
          updateState(false, false);
        } else {
          // Single tap transient mode (unlocked)
          updateState(true, false);
        }
      }
    }
  }, [doubleTapThresholdMs, mode, updateState]);

  const consume = useCallback(() => {
    // In locked mode, consume is disabled / ignored
    if (lockedRef.current) return;
    if (activeRef.current) {
      updateState(false, false);
    }
  }, [updateState]);

  const setState = useCallback(
    (nextActive: boolean, nextLocked = false) => {
      updateState(nextActive, nextLocked);
    },
    [updateState],
  );

  const reset = useCallback(() => {
    updateState(false, false);
  }, [updateState]);

  return {
    active,
    locked,
    trigger,
    setState,
    consume,
    reset,
  };
}

export interface BaseTriggerButtonProps {
  mode?: BaseTriggerMode;
  active?: boolean;
  locked?: boolean;
  defaultActive?: boolean;
  defaultLocked?: boolean;
  onChange?: (active: boolean, locked: boolean) => void;
  state?: BaseTriggerState;
  /** Optional icon to display */
  icon?: ReactNode;
  /** Optional label text to display */
  label?: ReactNode;
  /** Optional icon when active */
  activeIcon?: ReactNode;
  /** Optional label when active */
  activeLabel?: ReactNode;
  /** Optional icon when locked in double_tap mode */
  lockedIcon?: ReactNode;
  /** Optional label when locked in double_tap mode */
  lockedLabel?: ReactNode;
  /** Optional badge indicator */
  badge?: ReactNode;
  /** Tooltip highlighted label */
  tooltipLabel?: ReactNode;
  /** Tooltip description content */
  tooltipContent?: ReactNode;
  /** Fallback raw tooltip text */
  tooltip?: ReactNode;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  id?: string;
  "aria-label"?: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export function BaseTriggerButton({
  mode = "double_tap",
  active: controlledActive,
  locked: controlledLocked,
  defaultActive = false,
  defaultLocked = false,
  onChange,
  state: externalState,
  icon,
  label,
  activeIcon,
  activeLabel,
  lockedIcon,
  lockedLabel,
  badge,
  tooltipLabel,
  tooltipContent,
  tooltip,
  disabled = false,
  size = "sm",
  className = "",
  id,
  "aria-label": ariaLabel,
  onClick,
}: BaseTriggerButtonProps) {
  const internalState = useBaseTriggerState({
    mode,
    defaultActive,
    defaultLocked,
    onChange,
  });

  const triggerState = externalState || internalState;
  const isActive = controlledActive !== undefined ? controlledActive : triggerState.active;
  const isLocked = controlledLocked !== undefined ? controlledLocked : triggerState.locked;

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (!externalState && controlledActive === undefined) {
      triggerState.trigger();
    } else if (externalState) {
      externalState.trigger();
    }
  };

  // Determine current icon & label based on state and optional overrides
  const currentIcon = isLocked
    ? (lockedIcon ?? activeIcon ?? icon)
    : isActive
      ? (activeIcon ?? icon)
      : icon;

  const currentLabel = isLocked
    ? (lockedLabel ?? activeLabel ?? label)
    : isActive
      ? (activeLabel ?? label)
      : label;

  const sizeClasses =
    size === "sm"
      ? "h-8 px-2.5 text-xs gap-1.5"
      : size === "lg"
        ? "h-10 px-4 text-sm gap-2"
        : "h-9 px-3 text-xs gap-1.5";

  const stateClasses = isLocked
    ? "bg-sky-600 hover:bg-sky-700 text-white shadow-sm ring-1 ring-sky-500/50 dark:bg-sky-600 dark:hover:bg-sky-500"
    : isActive
      ? "bg-sky-100 hover:bg-sky-200 text-sky-700 border border-sky-300 dark:bg-sky-950/70 dark:hover:bg-sky-900/80 dark:text-sky-300 dark:border-sky-700"
      : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700";

  const buttonElement = (
    <button
      id={id}
      type="button"
      disabled={disabled}
      onClick={handleClick}
      aria-label={ariaLabel || (typeof currentLabel === "string" ? currentLabel : undefined)}
      aria-pressed={isActive}
      className={`relative inline-flex items-center justify-center font-medium rounded-md transition-all select-none disabled:opacity-50 disabled:pointer-events-none ${sizeClasses} ${stateClasses} ${className}`}
    >
      {currentIcon}
      {currentLabel ? <span>{currentLabel}</span> : null}

      {/* Visual lock icon indicator / 1x indicator */}
      {isLocked ? (
        <span
          className="inline-flex items-center justify-center text-white/90 ml-0.5"
          title="Locked"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3 h-3"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </span>
      ) : isActive && mode === "double_tap" ? (
        <span
          className="inline-flex items-center justify-center text-[10px] font-semibold px-1 py-0.2 bg-sky-200/60 dark:bg-sky-800/60 rounded ml-0.5"
          title="Single Use (Double-tap to lock)"
        >
          1x
        </span>
      ) : badge ? (
        badge
      ) : null}
    </button>
  );

  const finalTooltipContent = tooltipContent ?? tooltip;

  if (finalTooltipContent || tooltipLabel) {
    return (
      <Tooltip label={tooltipLabel} content={finalTooltipContent ?? tooltipLabel}>
        {buttonElement}
      </Tooltip>
    );
  }

  return buttonElement;
}
