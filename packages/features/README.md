# Imify Features (`packages/features`)

A high-level module containing feature-specific UI and business logic that is shared between the Web app and the Browser Extension.

## Shared Philosophy

This package encapsulates the "meat" of the Imify application. By keeping logic here, we ensure that a bug fix in the **Image Splitter** automatically applies to both the extension and the website.

## Main Features

### 1. Image Splitter (`src/splitter/`)
- Complex grid-based and sequence-based image slicing.
- Interactive guide system with reorderable sequences.
- Preset management and UI configuration cards.

### 2. Image Splicing (`src/splicing/`)
- Multi-image vertical and horizontal joining.
- Layout management and gap configuration.

### 3. SEO Audit (`src/seo-audit/`)
- Logic for analyzing image health (alt text, sizes, security).
- Reporting and recommendation engine.

### 4. Workspace Chrome (`src/workspace-chrome/`)
- Shared shell components: `OptionsHeader`, `SettingsDialog`, `AboutDialog`.
- Layout preference management.

### 5. Other Tools
- **Batch Processor**: Handling multiple images with shared configs.
- **Filling**: Pattern-based background filling.
- **Diffchecker**: Pixel-perfect image comparison.
- **Inspector**: Deep dive into image metadata and structure.

## Structure
Each feature typically includes:
- `components/`: Feature-specific React components.
- `hooks/`: Specialized hooks for feature state or behavior.
- `types.ts`: Local types specific to that feature.
- `index.ts`: Public API for the feature.

## Integration
Applications import these features and wrap them in their respective platform-specific shells (Next.js layout or Extension Options page).

## Feature Docs
- `docs/PRESET_ENTRY_FLOW.md`: Cross-platform behavior and architecture for "Prefer recently used preset" entry flow (Web redirect route vs Extension tab-state activation).
