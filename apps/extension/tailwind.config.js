const baseConfig = require("@imify/config/tailwind-base")

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...baseConfig,
  content: [
    "./src/**/*.{ts,tsx,html}",
    "./*.{ts,tsx,html}",
    "../../packages/ui/src/**/*.{ts,tsx}",
    "../../packages/features/src/**/*.{ts,tsx}",
    "../../packages/stores/src/**/*.{ts,tsx}",
  ],
}

