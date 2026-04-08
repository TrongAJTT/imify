/**
 * Shared theme configuration for UI components
 * Implements semantic color coding for Accordion, Checkbox, and Sidebar cards
 * Based on SPECIFICATIONS.md design guidelines
 */

export type ColorTheme = "blue" | "purple" | "amber" | "sky" | "orange"

export type ThemeClasses = {
  icon: string
  activeBg?: string
  activeBorder?: string
  activeText?: string
  // Accordion-specific classes
  accordionLeftBorder?: string
  accordionOpenEdgeBorder?: string
  accordionContentBorder?: string
  // Sidebar-specific classes
  sidebarEdgeBorderHover?: string
  sidebarBgHover?: string
}

/**
 * Get theme classes for a given color theme
 * Includes icon color, hover states, and active/checked states
 */
export function getThemeClasses(theme: ColorTheme): ThemeClasses {
  const themes: Record<ColorTheme, ThemeClasses> = {
    blue: {
      icon: "text-blue-500 dark:text-blue-400",
      activeBg: "bg-blue-50 dark:bg-blue-500/10",
      activeBorder: "border-l-blue-500 dark:border-l-blue-500 border-blue-300 dark:border-blue-800",
      activeText: "text-blue-800 dark:text-blue-200",
      // Accordion layout
      accordionLeftBorder: "border-l-blue-600 dark:border-l-blue-400",
      accordionOpenEdgeBorder: "border-t-blue-300 border-r-blue-300 border-b-blue-300 dark:border-t-blue-800 dark:border-r-blue-800 dark:border-b-blue-800",
      accordionContentBorder: "border-t-blue-200 dark:border-t-blue-800",
      // Sidebar layout
      sidebarEdgeBorderHover: "hover:border-blue-300 dark:hover:border-blue-800",
      sidebarBgHover: "hover:bg-blue-50/60 dark:hover:bg-blue-500/10",
    },
    purple: {
      icon: "text-purple-500 dark:text-purple-400",
      activeBg: "bg-purple-50 dark:bg-purple-500/10",
      activeBorder: "border-l-purple-500 dark:border-l-purple-500 border-purple-300 dark:border-purple-800",
      activeText: "text-purple-800 dark:text-purple-200",
      // Accordion layout
      accordionLeftBorder: "border-l-purple-600 dark:border-l-purple-400",
      accordionOpenEdgeBorder: "border-t-purple-300 border-r-purple-300 border-b-purple-300 dark:border-t-purple-800 dark:border-r-purple-800 dark:border-b-purple-800",
      accordionContentBorder: "border-t-purple-200 dark:border-t-purple-800",
      // Sidebar layout
      sidebarEdgeBorderHover: "hover:border-purple-300 dark:hover:border-purple-800",
      sidebarBgHover: "hover:bg-purple-50/60 dark:hover:bg-purple-500/10",
    },
    amber: {
      icon: "text-amber-500 dark:text-amber-400",
      activeBg: "bg-amber-50 dark:bg-amber-500/10",
      activeBorder: "border-l-amber-500 dark:border-l-amber-500 border-amber-300 dark:border-amber-800",
      activeText: "text-amber-800 dark:text-amber-200",
      // Accordion layout
      accordionLeftBorder: "border-l-amber-600 dark:border-l-amber-400",
      accordionOpenEdgeBorder: "border-t-amber-300 border-r-amber-300 border-b-amber-300 dark:border-t-amber-800 dark:border-r-amber-800 dark:border-b-amber-800",
      accordionContentBorder: "border-t-amber-200 dark:border-t-amber-800",
      // Sidebar layout
      sidebarEdgeBorderHover: "hover:border-amber-300 dark:hover:border-amber-800",
      sidebarBgHover: "hover:bg-amber-50/60 dark:hover:bg-amber-500/10",
    },
    sky: {
      icon: "text-sky-500 dark:text-sky-400",
      activeBg: "bg-sky-50 dark:bg-sky-500/10",
      activeBorder: "border-l-sky-500 dark:border-l-sky-500 border-sky-300 dark:border-sky-800",
      activeText: "text-sky-800 dark:text-sky-200",
      // Accordion layout
      accordionLeftBorder: "border-l-sky-600 dark:border-l-sky-400",
      accordionOpenEdgeBorder: "border-t-sky-300 border-r-sky-300 border-b-sky-300 dark:border-t-sky-800 dark:border-r-sky-800 dark:border-b-sky-800",
      accordionContentBorder: "border-t-sky-200 dark:border-t-sky-800",
      // Sidebar layout
      sidebarEdgeBorderHover: "hover:border-sky-300 dark:hover:border-sky-800",
      sidebarBgHover: "hover:bg-sky-50/60 dark:hover:bg-sky-500/10",
    },
    orange: {
      icon: "text-orange-500 dark:text-orange-400",
      activeBg: "bg-orange-50 dark:bg-orange-500/10",
      activeBorder: "border-l-orange-500 dark:border-l-orange-500 border-orange-300 dark:border-orange-800",
      activeText: "text-orange-800 dark:text-orange-200",
      // Accordion layout
      accordionLeftBorder: "border-l-orange-600 dark:border-l-orange-400",
      accordionOpenEdgeBorder: "border-t-orange-300 border-r-orange-300 border-b-orange-300 dark:border-t-orange-800 dark:border-r-orange-800 dark:border-b-orange-800",
      accordionContentBorder: "border-t-orange-200 dark:border-t-orange-800",
      // Sidebar layout
      sidebarEdgeBorderHover: "hover:border-orange-300 dark:hover:border-orange-800",
      sidebarBgHover: "hover:bg-orange-50/60 dark:hover:bg-orange-500/10",
    },
  }
  return themes[theme]
}
