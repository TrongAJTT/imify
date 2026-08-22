import React, { useState, useCallback, useRef } from "react";
import { Zap, ChevronRight, type LucideIcon } from "lucide-react";
import { ControlledPopover } from "@imify/ui/ui/controlled-popover";
import { usePopoverTriggerBehavior } from "./use-popover-trigger-behavior";
import { useTranslation } from "@imify/i18n";

export interface QuickActionSection {
  key: string;
  label: string;
  icon:
    | LucideIcon
    | React.ComponentType<{ size?: number; className?: string }>
    | React.ReactNode;
  iconColor?: string;
  widthClass?: string;
  content: React.ReactNode;
  headerTitle?: string;
}

export interface QuickActionsMenuFrameProps {
  /** List of quick action sections */
  sections: QuickActionSection[];
  /** Header content (e.g. Scope switcher, title with Sparkles, etc.) */
  headerNode?: React.ReactNode;
  /** Custom trigger node, or defaults to standard Zap Quick Actions button */
  triggerNode?: React.ReactNode;
  /** Label for default trigger button if not overridden */
  triggerLabel?: string;
  /** Whether the menu is disabled */
  disabled?: boolean;
  /** Flyout direction on Desktop: 'left' (right-full) or 'right' (left-full) */
  flyoutSide?: "left" | "right";
  /** Width class for the main popover menu */
  mainWidthClass?: string;
  /** Max height class for the scrollable container in mobile view */
  mobileMaxHeightClass?: string;
  /** Popover alignment relative to trigger */
  align?: "start" | "center" | "end";
  /** Side offset in pixels */
  sideOffset?: number;
  /** Optional custom className for outer popover box */
  className?: string;
}

function renderSectionIcon(
  icon: QuickActionSection["icon"],
  iconColor?: string,
  size = 14,
) {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;
  const IconComponent = icon as React.ComponentType<{
    size?: number;
    className?: string;
  }>;
  return <IconComponent size={size} className={iconColor} />;
}

export function QuickActionsMenuFrame({
  sections,
  headerNode,
  triggerNode,
  triggerLabel,
  disabled = false,
  flyoutSide = "left",
  mainWidthClass = "w-72 md:w-64",
  mobileMaxHeightClass = "max-h-[60vh]",
  align = "end",
  sideOffset = 6,
  className = "",
}: QuickActionsMenuFrameProps) {
  const { t } = useTranslation("common");
  const triggerBehavior = usePopoverTriggerBehavior();
  const isDesktop = triggerBehavior === "hover";

  const [activeDesktopSubmenu, setActiveDesktopSubmenu] = useState<
    string | null
  >(null);

  const closeSubmenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const clearCloseSubmenuTimer = useCallback(() => {
    if (closeSubmenuTimerRef.current) {
      clearTimeout(closeSubmenuTimerRef.current);
      closeSubmenuTimerRef.current = null;
    }
  }, []);

  const handleSubmenuMouseEnter = useCallback(
    (menuKey: string) => {
      clearCloseSubmenuTimer();
      setActiveDesktopSubmenu(menuKey);
    },
    [clearCloseSubmenuTimer],
  );

  const handleSubmenuMouseLeave = useCallback(() => {
    clearCloseSubmenuTimer();
    closeSubmenuTimerRef.current = setTimeout(() => {
      setActiveDesktopSubmenu(null);
      closeSubmenuTimerRef.current = null;
    }, 250); // 250ms buffer time to move mouse diagonally across gap
  }, [clearCloseSubmenuTimer]);

  const defaultTriggerButton = (
    <button
      type="button"
      disabled={disabled}
      className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-sky-300 dark:border-sky-800/60 bg-sky-50/70 dark:bg-sky-950/40 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Zap
        size={13}
        className="text-sky-600 dark:text-sky-400 fill-sky-500/20"
      />
      <span>{triggerLabel || t("quickActions.button", "Thao tác nhanh")}</span>
    </button>
  );

  const flyoutClass =
    flyoutSide === "left"
      ? "right-full top-0 mr-1.5 before:absolute before:-right-3 before:inset-y-0 before:w-3"
      : "left-full top-0 ml-1.5 before:absolute before:-left-3 before:inset-y-0 before:w-3";

  return (
    <ControlledPopover
      trigger={triggerNode || defaultTriggerButton}
      preset="dropdown"
      behavior={triggerBehavior}
      align={align}
      side="bottom"
      sideOffset={sideOffset}
      disabled={disabled}
    >
      <div
        className={`z-50 ${mainWidthClass} rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2 shadow-xl outline-none text-slate-800 dark:text-slate-200 text-xs ${className}`}
      >
        {headerNode && (
          <div className="mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            {headerNode}
          </div>
        )}

        {/* DESKTOP SUBMENU LAYOUT */}
        {isDesktop ? (
          <div className="space-y-1 relative">
            {sections.map((section) => {
              const isActive = activeDesktopSubmenu === section.key;
              const widthClass = section.widthClass || "w-60";

              return (
                <div
                  key={section.key}
                  className="relative"
                  onMouseEnter={() => handleSubmenuMouseEnter(section.key)}
                  onMouseLeave={handleSubmenuMouseLeave}
                >
                  <button
                    type="button"
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "bg-slate-100 dark:bg-slate-800/80 text-sky-600 dark:text-sky-400 font-semibold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {renderSectionIcon(section.icon, section.iconColor)}
                      <span className="truncate">{section.label}</span>
                    </div>
                    <ChevronRight size={13} className="text-slate-400 shrink-0" />
                  </button>

                  {/* SUBMENU CONTENT with hover bridge */}
                  {isActive && (
                    <div
                      onMouseEnter={() => handleSubmenuMouseEnter(section.key)}
                      onMouseLeave={handleSubmenuMouseLeave}
                      className={`absolute ${flyoutClass} ${widthClass} rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2 shadow-xl animate-in fade-in-50 duration-75`}
                    >
                      <div className="mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {renderSectionIcon(section.icon, section.iconColor)}
                        <span className="truncate">
                          {section.headerTitle || section.label}
                        </span>
                      </div>
                      {section.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* MOBILE EXPANDED DIRECT LAYOUT */
          <div
            className={`space-y-3 ${mobileMaxHeightClass} overflow-y-auto pr-1`}
          >
            {sections.map((section) => (
              <div key={section.key} className="space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-0.5 flex items-center gap-1.5">
                  {renderSectionIcon(section.icon, section.iconColor, 13)}
                  <span>{section.headerTitle || section.label}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ControlledPopover>
  );
}
