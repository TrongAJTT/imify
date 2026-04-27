# Imify Config (`packages/config`)

Shared build, lint, and styling configurations for the Imify monorepo.

## Purpose

This package centralizes the "rules" of the project to ensure consistency across all apps and packages.

## Shared Configurations

### 1. Tailwind CSS
Shared Tailwind presets that define the project's color palette, semantic tokens, and animation keyframes (e.g., `collapsible-down`).

### 2. TypeScript
Base `tsconfig.json` files that are extended by other packages to ensure consistent compilation settings and path alias support.

### 3. Linting & Formatting
Configurations for ESLint and Prettier to maintain a unified code style.

## Usage

Packages extend these configurations in their respective config files:

```javascript
// tailwind.config.js
module.exports = {
  presets: [require("@imify/config/tailwind-preset")],
  // ...
}
```
