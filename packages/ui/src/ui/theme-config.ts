/**
 * Shared theme configuration for UI components
 * Implements semantic color coding for Accordion, Checkbox, Radio, Slider, Segmented, and Sidebar cards
 * Based on SPECIFICATIONS.md design guidelines
 */

export type ColorTheme = "blue" | "purple" | "amber" | "sky" | "orange" | "pink"

export type ThemeClasses = {
  icon: string
  hover?: string
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
  // Radio & Card components
  radioActiveFull: string
  focusRing: string
  // Segmented control
  segmentActive: string
  // Grid icon selector
  gridActive: string
  // Colored slider card
  sliderBorder: string
  sliderBg: string
  sliderText: string
  // Select chip
  chipActive: string
}

/**
 * Get theme classes for a given color theme
 * Includes icon color, hover states, active states, borders, and input rings
 */
export function getThemeClasses(theme: ColorTheme): ThemeClasses {
  const themes: Record<ColorTheme, ThemeClasses> = {
    blue: {
      icon: "text-blue-500 dark:text-blue-400",
      hover: "hover:bg-blue-50/60 dark:hover:bg-blue-500/10",
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
      // Radio & Card components
      radioActiveFull: "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-500/10 dark:text-blue-200",
      focusRing: "focus-within:ring-blue-500/30",
      // Segmented control
      segmentActive: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
      // Grid icon selector
      gridActive: "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
      // Colored slider card
      sliderBorder: "border-blue-200 dark:border-blue-800",
      sliderBg: "bg-blue-50/60 dark:bg-blue-900/20",
      sliderText: "text-blue-700 dark:text-blue-300",
      // Select chip
      chipActive: "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500/50 dark:bg-blue-500/10 dark:text-blue-400 shadow-sm",
    },
    purple: {
      icon: "text-purple-500 dark:text-purple-400",
      hover: "hover:bg-purple-50/60 dark:hover:bg-purple-500/10",
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
      // Radio & Card components
      radioActiveFull: "border-purple-300 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-500/10 dark:text-purple-200",
      focusRing: "focus-within:ring-purple-500/30",
      // Segmented control
      segmentActive: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
      // Grid icon selector
      gridActive: "border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400",
      // Colored slider card
      sliderBorder: "border-purple-200 dark:border-purple-800",
      sliderBg: "bg-purple-50/60 dark:bg-purple-900/20",
      sliderText: "text-purple-700 dark:text-purple-300",
      // Select chip
      chipActive: "border-purple-500 bg-purple-50 text-purple-700 dark:border-purple-500/50 dark:bg-purple-500/10 dark:text-purple-400 shadow-sm",
    },
    amber: {
      icon: "text-amber-500 dark:text-amber-400",
      hover: "hover:bg-amber-50/60 dark:hover:bg-amber-500/10",
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
      // Radio & Card components
      radioActiveFull: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-500/10 dark:text-amber-200",
      focusRing: "focus-within:ring-amber-500/30",
      // Segmented control
      segmentActive: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
      // Grid icon selector
      gridActive: "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
      // Colored slider card
      sliderBorder: "border-amber-200 dark:border-amber-800",
      sliderBg: "bg-amber-50/60 dark:bg-amber-900/20",
      sliderText: "text-amber-700 dark:text-amber-300",
      // Select chip
      chipActive: "border-amber-500 bg-amber-50 text-amber-700 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-400 shadow-sm",
    },
    sky: {
      icon: "text-sky-500 dark:text-sky-400",
      hover: "hover:bg-sky-50/60 dark:hover:bg-sky-500/10",
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
      // Radio & Card components
      radioActiveFull: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-500/10 dark:text-sky-200",
      focusRing: "focus-within:ring-sky-500/30",
      // Segmented control
      segmentActive: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
      // Grid icon selector
      gridActive: "border-sky-500 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400",
      // Colored slider card
      sliderBorder: "border-sky-200 dark:border-sky-800",
      sliderBg: "bg-sky-50/60 dark:bg-sky-900/20",
      sliderText: "text-sky-700 dark:text-sky-300",
      // Select chip
      chipActive: "border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-500/50 dark:bg-sky-500/10 dark:text-sky-400 shadow-sm",
    },
    orange: {
      icon: "text-orange-500 dark:text-orange-400",
      hover: "hover:bg-orange-50/60 dark:hover:bg-orange-500/10",
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
      // Radio & Card components
      radioActiveFull: "border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-500/10 dark:text-orange-200",
      focusRing: "focus-within:ring-orange-500/30",
      // Segmented control
      segmentActive: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
      // Grid icon selector
      gridActive: "border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400",
      // Colored slider card
      sliderBorder: "border-orange-200 dark:border-orange-800",
      sliderBg: "bg-orange-50/60 dark:bg-orange-900/20",
      sliderText: "text-orange-700 dark:text-orange-300",
      // Select chip
      chipActive: "border-orange-500 bg-orange-50 text-orange-700 dark:border-orange-500/50 dark:bg-orange-500/10 dark:text-orange-400 shadow-sm",
    },
    pink: {
      icon: "text-pink-500 dark:text-pink-400",
      hover: "hover:bg-pink-50/60 dark:hover:bg-pink-500/10",
      activeBg: "bg-pink-50 dark:bg-pink-500/10",
      activeBorder: "border-l-pink-500 dark:border-l-pink-500 border-pink-300 dark:border-pink-800",
      activeText: "text-pink-800 dark:text-pink-200",
      // Accordion layout
      accordionLeftBorder: "border-l-pink-600 dark:border-l-pink-400",
      accordionOpenEdgeBorder: "border-t-pink-300 border-r-pink-300 border-b-pink-300 dark:border-t-pink-800 dark:border-r-pink-800 dark:border-b-pink-800",
      accordionContentBorder: "border-t-pink-200 dark:border-t-pink-800",
      // Sidebar layout
      sidebarEdgeBorderHover: "hover:border-pink-300 dark:hover:border-pink-800",
      sidebarBgHover: "hover:bg-pink-50/60 dark:hover:bg-pink-500/10",
      // Radio & Card components
      radioActiveFull: "border-pink-300 bg-pink-50 text-pink-800 dark:border-pink-800 dark:bg-pink-500/10 dark:text-pink-200",
      focusRing: "focus-within:ring-pink-500/30",
      // Segmented control
      segmentActive: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
      // Grid icon selector
      gridActive: "border-pink-500 bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400",
      // Colored slider card
      sliderBorder: "border-pink-200 dark:border-pink-800",
      sliderBg: "bg-pink-50/60 dark:bg-pink-900/20",
      sliderText: "text-pink-700 dark:text-pink-300",
      // Select chip
      chipActive: "border-pink-500 bg-pink-50 text-pink-700 dark:border-pink-500/50 dark:bg-pink-500/10 dark:text-pink-400 shadow-sm",
    },
  }
  return themes[theme]
}

