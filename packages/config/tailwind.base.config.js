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
        }
      },
      animation: {
        "collapsible-down": "collapsible-down 200ms ease-out",
        "collapsible-up": "collapsible-up 200ms ease-out"
      }
    }
  },
  plugins: []
}
