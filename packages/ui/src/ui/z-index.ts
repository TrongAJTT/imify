/**
 * @imify/ui — Z-Index Tokens
 *
 * Centralized, semantic layer tokens across the monorepo.
 * Values align with Tailwind CSS classes (e.g. `z-sticky`, `z-dropdown`, `z-modal`, `z-drag`).
 */

export const Z_INDEX = {
  /** Default base layer for flat content */
  base: 0,
  /** Raised elements like badges, inner card accents */
  raised: 1,
  /** Sticky headers, canvas action bars, zoom controls */
  sticky: 10,
  /** Dropdowns, select lists, context menus */
  dropdown: 20,
  /** Popovers, tooltips, color pickers, quick-actions */
  popover: 30,
  /** Dialog/Modal backdrops & window containers when not using native HTML5 Top Layer */
  modal: 50,
  /** Drag-and-drop floating ghost items */
  drag: 100,
  /** Global notification toasts fallback (when not using HTML5 Popover API) */
  toast: 200,
  /** Absolute maximum fallback value */
  max: 2147483647,
} as const

export type ZIndexKey = keyof typeof Z_INDEX
