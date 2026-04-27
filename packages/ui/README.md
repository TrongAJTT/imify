# Imify UI (`packages/ui`)

The design system and shared component library for Imify. Built with **Tailwind CSS**, **Radix UI**, and **Lucide Icons**.

## Design Philosophy

Imify UI aims for a "Premium Utility" aesthetic: clean, high-contrast, and focused on functional density. It supports full Dark Mode and responsive layouts out of the box.

## Core Components (`src/ui/`)

### 1. Layout Components
- `SidebarPanel`: The base container for the tool configuration sidebar.
- `WorkspaceConfigSidebarPanel`: A reorderable (DnD) version of the sidebar panel.
- `AccordionCard`: A sophisticated collapsible card with theme-aware semantic highlights.

### 2. Form & Inputs
- `Button`: Multi-variant action component.
- `NumberInput`: Precision numeric controls with min/max validation.
- `SelectInput`: Custom-styled dropdowns.
- `Checkbox`: Semantic boolean toggles.

### 3. Typography & Display
- `Heading`: Structured headers for the workspace.
- `BodyText`: Standardized readable text.
- `LabelText`: Specialized labels for configuration controls.

## Specialized Systems

### Reorder System
Integrated with `@dnd-kit`, providing a robust drag-and-drop experience for configuration cards. It uses specialized `Mouse` and `Touch` sensors to ensure stability across Web and Extension environments.

### Theme Engine
`theme-config.ts` defines a semantic color system (sky, indigo, amber, etc.) that maps to Tailwind utility classes, allowing for consistent feature-specific coloring.

## Development
This package uses Tailwind CSS for styling. Ensure the parent application's `tailwind.config.js` includes the `packages/ui` source in its content array.
