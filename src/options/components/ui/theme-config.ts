/**
 * Shared theme configuration for UI components
 * Implements semantic color coding for Accordion, Checkbox, and Sidebar cards
 * Based on SPECIFICATIONS.md design guidelines
 */

export type ColorTheme = "blue" | "purple" | "amber" | "sky" | "orange"

export type ThemeClasses = {
  icon: string
  hover: string
  activeBg?: string
  activeBorder?: string
  activeText?: string
}

/**
 * Get theme classes for a given color theme
 * Includes icon color, hover states, and active/checked states
 */
export function getThemeClasses(theme: ColorTheme): ThemeClasses {
  const themes: Record<ColorTheme, ThemeClasses> = {
    blue: {
      icon: "text-blue-500 dark:text-blue-400",
      hover: "hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-500/10 dark:hover:border-blue-500",
      activeBg: "bg-blue-50 dark:bg-blue-500/10",
      activeBorder: "border-l-blue-500 dark:border-l-blue-500 border-blue-300 dark:border-blue-800",
      activeText: "text-blue-800 dark:text-blue-200",
    },
    purple: {
      icon: "text-purple-500 dark:text-purple-400",
      hover: "hover:bg-purple-50 hover:border-purple-300 dark:hover:bg-purple-500/10 dark:hover:border-purple-500",
      activeBg: "bg-purple-50 dark:bg-purple-500/10",
      activeBorder: "border-l-purple-500 dark:border-l-purple-500 border-purple-300 dark:border-purple-800",
      activeText: "text-purple-800 dark:text-purple-200",
    },
    amber: {
      icon: "text-amber-500 dark:text-amber-400",
      hover: "hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-500/10 dark:hover:border-amber-500",
      activeBg: "bg-amber-50 dark:bg-amber-500/10",
      activeBorder: "border-l-amber-500 dark:border-l-amber-500 border-amber-300 dark:border-amber-800",
      activeText: "text-amber-800 dark:text-amber-200",
    },
    sky: {
      icon: "text-sky-500 dark:text-sky-400",
      hover: "hover:bg-sky-50 hover:border-sky-300 dark:hover:bg-sky-500/10 dark:hover:border-sky-500",
      activeBg: "bg-sky-50 dark:bg-sky-500/10",
      activeBorder: "border-l-sky-500 dark:border-l-sky-500 border-sky-300 dark:border-sky-800",
      activeText: "text-sky-800 dark:text-sky-200",
    },
    orange: {
      icon: "text-orange-500 dark:text-orange-400",
      hover: "hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-500/10 dark:hover:border-orange-500",
      activeBg: "bg-orange-50 dark:bg-orange-500/10",
      activeBorder: "border-l-orange-500 dark:border-l-orange-500 border-orange-300 dark:border-orange-800",
      activeText: "text-orange-800 dark:text-orange-200",
    },
  }
  return themes[theme]
}
