/**
 * Base Tailwind config shared across all apps and packages in the Imify monorepo.
 * Apps extend this config and add their own `content` paths.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  darkMode: "class",
  content: [],
  theme: {
    extend: {
      keyframes: {
        "collapsible-down": {
          from: { height: 0, opacity: 0 },
          to: { height: "var(--radix-collapsible-content-height)", opacity: 1 }
        },
        "collapsible-up": {
          from: { height: "var(--radix-collapsible-content-height)", opacity: 1 },
          to: { height: 0, opacity: 0 }
        },
        "fade-in": {
          from: { opacity: 0 },
          to: { opacity: 1 }
        },
        "fade-out": {
          from: { opacity: 1 },
          to: { opacity: 0 }
        },
        "slide-in-from-bottom": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" }
        },
        "slide-out-to-bottom": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(100%)" }
        },
        "zoom-in": {
          from: { opacity: 0, transform: "scale(0.95)" },
          to: { opacity: 1, transform: "scale(1)" }
        }
      },
      animation: {
        "collapsible-down": "collapsible-down 200ms ease-out",
        "collapsible-up": "collapsible-up 200ms ease-out",
        "fade-in": "fade-in 200ms ease-out",
        "fade-out": "fade-out 200ms ease-in",
        "slide-in-from-bottom": "slide-in-from-bottom 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-out-to-bottom": "slide-out-to-bottom 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        "zoom-in": "zoom-in 200ms ease-out"
      },
      zIndex: {
        base: "0",
        raised: "1",
        sticky: "10",
        dropdown: "20",
        popover: "30",
        modal: "50",
        drag: "100",
        toast: "200"
      }
    }
  },
  plugins: []
}
