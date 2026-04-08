# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **JXL Effort Control:** Added `Effort Level` selector in **Target Format & Quality** card for JXL format, allowing users to control compression algorithm complexity (1-9 scale):
  - **1-3:** Lightning/Fast modes - faster encoding, larger file sizes (recommended for Batch processing)
  - **4-6:** Fast-Balanced/Balanced modes - balanced performance and compression
  - **7-9:** Optimal/Maximum modes - maximum compression, slower encoding (default: 7, recommended for Single processing)
  - Fully integrated into Custom Presets, Single/Batch Processor, and Image Splicing workflows with tooltips explaining trade-offs.
- **Splicing (Bento):** Added a new **Fixed Horizontal** layout, where **Count** is the maximum number of images per row.
- **Splicing (Bento):** Added **Image Alignment** controls for fixed layouts, including **Fixed Vertical** and **Fixed Horizontal**.
- **UI:** Added new `BaseDialog` component using HTML5 native `<dialog>` element for better accessibility and native backdrop handling.
- **UI:** Improved **Auto Renaming** dialog with full dark mode support and consistent components.
- **UI:** Added new `SelectChip` component for reusable selections.
- **UI:** Enhanced `TextInput` with a large variant for better focus on content.
- **UI:** Migrated all dialogs (**Auto Renaming**, **Watermarking**, **Settings**, **Attribution**, **About**) to use `BaseDialog` component with native click-outside and Esc key handling.
- **UI:** Added `SidebarCard` component for reusable popover entrance cards with icon (left), label, and sublabel support.
- **UI:** Added `AccordionCard` component extending SidebarCard with collapsible content for improved UX in workspace contexts.
- **UI:** Added `TargetFormatQualityCard` and `ResizeCard` accordion-based components replacing popovers in Single/Batch Processor and Image Splicing.
- **UI:** Added `TargetFormatQualityPopover` component consolidating format, quality, ICO sizes, and PNG tiny mode selection into a single popover interface.
- **UI:** Added `ResizePopover` component providing unified resize controls (6 modes: No resize, Fit width, Fit height, Set size, Scale, Paper size) with mode-aware sublabel display.
- **UI:** Added `tooltip` prop to `SelectInput` and `NumberInput` components for inline help documentation with (?) icon.
- **Settings:** Added workspace layout controls in **General** tab to customize both sidebar widths using 6-step discrete sliders:
  - Navigation sidebar width levels (Compact → Max).
  - Configuration sidebar width levels (Compact → Max).
  - Real-time preview while the Settings dialog is open.
- **Settings:** Added new **Performance** tab with discrete sliders for concurrency limits:
  - `Standard formats max concurrency` (JPG, PNG, WebP, BMP, TIFF, ICO).
  - `Heavy formats max concurrency` (AVIF, JXL).
  - Safety warning for high AVIF/JXL concurrency values.
- **UI:** Added reusable `DiscreteSlider` component for non-linear preset-based configuration controls.
- **UI:** Added reusable shared `ConcurrencySelector` component and integrated it across Single/Batch Processor and Image Splicing sidebars.
- **UI:** Added shared theme configuration system (`theme-config.ts`) for semantic visual hierarchy using color coding across Accordion, Checkbox, and Sidebar cards.
  - **Color Theming:** Blue for Format & Quality, Purple for Resize, Amber for Advanced Settings, Sky/Orange for additional actions.
  - Left border highlight on active accordion cards with subtle background wash based on theme color.
  - Icon coloring and hover states automatically synchronized across all theme-aware components.
- **Single/Batch Processor:** Replaced grid-based Resize UI with new `ResizePopover` component for improved layout flexibility and cleaner control hierarchy.
- **Single/Batch Processor:** Persisted accordion open/close state for Target Format & Quality and Resize controls per-context (Single vs Batch).
- **Image Splicing:** Migrated resize and export format controls from popovers to accordion cards for better UX continuity.
- **Image Splicing:** Added `ResizePopover` integration for image resize controls with 3-mode variant (No resize, Fit width, Fit height).

### Changed
- **TypeScript Configuration:** Migrated from deprecated `moduleResolution: "node10"` and `baseUrl` to modern `"bundler"` resolver with relative path mappings.
- **Dependencies:** Added `@radix-ui/react-collapsible` (^1.1.12) for accordion component implementation.
- **Single/Batch Processor:** Moved Concurrency selector to separate row below Resize popover for better visual separation.
- **Workspace Layout:** Sidebar widths are now driven by persisted Settings preferences instead of hardcoded static widths.
- **UI:** Refactored `Tooltip` component to use Radix UI Popover for automatic viewport collision detection and safe area positioning instead of manual coordinates.
- **UI/UX:** Improved accordion card layout padding to align form inputs correctly when expanded (changed from `pl-7 pr-0` to `px-2.5`).
- **UI:** Consolidated theme configuration into shared `theme-config.ts` utility module to eliminate code duplication across `AccordionCard`, `CheckboxCard`, and `SidebarCard` components.
- **Concurrency:** Replaced format-specific inline concurrency option logic with centralized performance-preference driven limits and shared option builders.
- **UI:** Enhanced input components (`SelectInput`, `NumberInput`, `TextInput`) with improved background contrast:
  - Changed background from `bg-slate-50/dark:bg-slate-800/50` to `bg-white/dark:bg-slate-800/80` with shadow for better visual hierarchy.
  - Added `shadow-sm` to inputs for subtle depth against accordion/sidebar backgrounds.
- **UI:** Added semantic `theme` prop to `CheckboxCard` component for color-coded visual grouping matching `AccordionCard` and `SidebarCard` theming system.

### Fixed
- **Splicing**: Fixed an issue where the "Trim background" feature could work incorrectly.
- **UI**: Implemented "Click outside to close" and native Escape key handling for all dialogs using `BaseDialog`.
- **UI**: Fixed dark mode visibility issues in the naming pattern input and quick presets buttons.
- **UI**: Added "Apply Pattern" button disable state for **Auto Renaming** and **Watermarking** dialogs when no changes are made.
- **UI:** Fixed Resize card sublabel to display mode-specific values (e.g., "Fit width • 1280px", "Set size • 3000×4000", "Paper size • A4 @ 300dpi") instead of generic mode label.
- **UI:** Fixed Resize Type dropdown showing duplicate "Fit width" and "Fit height" options by deduplicating batch and splicing mode names.
- **UI**: Fixed accordion card state persistence to correctly restore open/close state when switching between Single and Batch Processor contexts.
- **Single/Batch Processor:** Persists accordion open/close state per processor context (Single and Batch maintain independent state).
- **Image Splicing:** Added support for `fit_width` and `fit_height` resize modes in ResizePopover (previously only supported via legacy SelectField).
- **Single/Batch Processor:** Replaced heavy format toast notification with inline tooltip on Concurrency selector explaining format limitations.
- **DX**: Resolved TypeScript error `Cannot find name 'require'` by adding `node` types to `tsconfig.json`.

## [1.5.0] - 2024-04-01

### Added
- **Context Menu (new unified settings page):**
  - Global formats, custom presets, and menu preview are now grouped under one “Context Menu” section with top tabs.
  - Choose how the right‑click menu is sorted, and preview the final menu layout before using it.
  - Pin up to **2** items to the top of the menu so your “must-have” actions never move.
  - New “Most Used (Stable)” sort mode that adapts to your habits without constantly reshuffling.
- **Usage Stats:** View how often each format/preset is used, and reset stats anytime.
- **Navigation & Layout:**
  - Collapsible left navigation sidebar (icon-only mode with tooltips).
  - New “desktop app” layout: full-height workspace, denser spacing, and consistent side panels.
- **Better empty states:** Standardized drag‑and‑drop cards across tools for clearer “drop files here” guidance.
- **Settings:** New option to choose which feature opens by default when you open the extension page.

### Changed
- **Context Menu management:** Reordering and enabling/disabling formats/presets is smoother and more consistent, with a clear “Save changes” workflow where needed.
- **Menus feel more predictable:** Your pinned items stay fixed, while the rest can be sorted without breaking muscle memory.
- **UI consistency:** Inputs and selectors across dialogs/pages now share a more consistent look and spacing.
- **Side panels:** Tighter spacing so you can see more controls without scrolling as much.

### Fixed
- **Context Menu editing:** Fixed cases where “Save changes” could become unresponsive after the first save.

## [1.0.1] - 2024-03-24

### Fixed
- Move AnimatingSpinner out of contents to fix React type error on all pages

## [1.0.0] - 2024-03-23

### Added
- **Right-Click Magic (Context Menu)**: Instantly convert and download any web image to formats like JPG, PNG, WEBP, or AVIF with a single right-click.
- **Customizable Menu**: Full control over your context menu. Choose which formats to show, hide, and reorder.
- **Batch Processing Dashboard**: Drag & drop multiple heavy images and process them simultaneously using multi-threading (Web Workers).
- **Zero-Data Privacy**: 100% offline and client-side processing. No servers, no tracking, total privacy.
- **Format Support**: Natively supports 9 formats including AVIF, WEBP, JXL, TIFF, and PDF (export).