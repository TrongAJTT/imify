# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **TIFF Workflow:** Added TIFF-specific `Color Mode` control (`RGB` / `Grayscale`) in shared `TargetFormatQualityCard`, now available across Single Processor, Batch Processor, Image Splicing, and Custom Format editor flows.
- **TIFF Option Wiring:** Wired TIFF codec options end-to-end through shared format types, batch/splicing stores, custom-format normalization, main-thread converter, conversion worker, raster adapter pipeline, and splicing export mapping.
- **BMP Color Depth Controls:** Added BMP-specific `Color Depth` selection in shared `TargetFormatQualityCard` with 4 modes:
  - `24-bit RGB (Standard)`
  - `32-bit RGBA (With Transparency)`
  - `8-bit Grayscale`
  - `1-bit Monochrome (Printers/IoT)`
  These controls are now available in Single Processor, Batch Processor, Image Splicing, and Custom Format editor flows.
- **BMP Dithering (1-bit):** Added `Dithering Level` slider (0-100) that appears only in BMP `1-bit Monochrome` mode. Dithering is wired through UI/store/config/pipeline and ignored automatically for non-1-bit BMP modes.
- **BMP Encoder Upgrade:** Upgraded `encodeImageDataToBmp` to support real multi-depth BMP output (`1-bit`, `8-bit`, `24-bit`, `32-bit`) with proper headers, palettes, row stride alignment, and alpha-preserving 32-bit export (`BITMAPV4HEADER`).
- **BMP Option Wiring:** Wired BMP codec options end-to-end through shared type contracts, custom-format normalization, batch/splicing stores, splicing export option mapping, raster conversion facade, worker/main conversion pipelines, and adapter-based BMP encode path.
- **Universal Image Pipeline (Decode/Render Split):** Added new shared feature modules under `src/features/image-pipeline/` to separate image decoding and rendering concerns:
  - `decode-image-data.ts`: Unified Blob/File -> `ImageData` decoding with native `createImageBitmap` path and TIFF fallback via `UTIF.decode`/`UTIF.toRGBA8`.
  - `render-image-data.ts`: Unified `ImageData` -> preview Blob/Object URL rendering with MIME fallback chain and quality/max-dimension controls.
- **Shared Compare Frame for Raw Pixels:** Added `PixelCompareWorkspace` in DiffChecker components so comparison views now accept raw `ImageData` + mode (`split` / `side_by_side` / `overlay`) instead of duplicating URL-based viewer wiring.
- **DiffChecker TIFF Input Support:** DiffChecker now decodes TIFF input files through the shared decode pipeline and can render previews through the shared render pipeline, allowing TIFF files to participate in split/side-by-side/overlay workflows.
- **Shared Zoom/Pan Control Component:** Extracted zoom and pan control UI into a reusable `ZoomPanControl` component in `/ui` folder:
  - Provides unified zoom display with value scrubbing (hold and drag left/right to adjust), click-to-edit exact zoom percentage, and intelligent reset button.
  - Shows pan reset button only when zoom deviates from 100% or pan exceeds threshold in X/Y axes.
  - Now used in Image Splicing (for canvas preview), DiffChecker (for all comparison modes), and can be reused by other features.
  - DiffChecker's `ViewerShell` now includes full zoom/pan controls matching Image Splicing's UX instead of read-only zoom display.
  - Single Processor preview now displays "Drag to pan • Scroll to zoom" helper text instead of manual zoom buttons (zoom/pan controls delegated to `PixelCompareWorkspace`).
- **UI:** Added new `ZoomPanControl` reusable component in `/ui` folder for zoom/pan visualization and interaction across preview viewers.
- **Pointer-Aware Zoom (Custom Hook):** Created `usePointerZoom` custom hook for zoom-to-pointer functionality:
  - Ensures that when zooming, the point under the cursor stays fixed (consistent UX with professional image editors).
  - Used in Image Splicing canvas preview for pointer-zoom behavior.
  - DiffChecker's ViewerShell now uses pointer-zoom math for all modes (split, side-by-side, overlay, difference) instead of center-based zoom.
  - Hooks can be shared across features that need zoom-to-pointer UX.
- **Performance Optimization (Wheel Event Throttling):** Added throttling to Image Splicing's wheel event handler:
  - Wheel events are now throttled to ~60fps (16ms) to prevent frame lag during rapid zoom operations.
  - Uses a pending event queue to ensure the last wheel delta is always processed.
  - Significantly reduces frame stuttering when rapidly scrolling to zoom on large/complex layouts.
- **UI:** Added new `ColoredSliderCard` reusable wrapper component for theme-customizable slider inputs with subtitle support (placed in `/ui` folder for general composition).
- **Export Standardization:** Created reusable export control components to standardize export settings across Batch Processor and Image Splicing:
  - `ExportControlsPanel` (shared): Reusable base component combining Concurrency Selector and File Renaming controls.
  - `BatchExportPanel`: Feature-specific accordion wrapper for Batch Processing that adds Privacy Mode and Watermarking controls on top of shared export controls. Renders as collapsible AccordionCard with amber theme.
  - `SplicingExportPanel`: Feature-specific accordion wrapper for Image Splicing that adds Export Mode selector and Trim Background control with smart conditional rendering (hides Concurrency when mode is "single"). Renders as collapsible AccordionCard with amber theme.
  - Removed redundant `SidebarPanel title="EXPORT"` wrappers—export panels are now self-contained accordions providing both visual grouping and interaction (collapse/expand).
  - Consolidated scattered export controls into organized, maintainable component hierarchy with proper separation of concerns.
- **Image Splicing UI Standardization:** Standardized all Image Splicing sidebar sections into reusable accordion components with dynamic sublabels:
  - `LayoutSettingsAccordion` (sky theme): Collapsible preset selector + layout direction controls with dynamic sublabel showing preset mode (e.g., "Vertical stitching", "3 columns", "Layout: auto").
  - `CanvasSettingsAccordion` (purple theme): Collapsible canvas styling controls (spacing, padding, border, colors) with dynamic sublabel displaying current padding and gap values (e.g., "Padding: 5, Gaps: 10/6").
  - `ImageSettingsAccordion` (orange theme): Collapsible image styling controls (resize, padding, border, colors) with dynamic sublabel showing current resize mode and padding (e.g., "Mode: Fit Width, Padding: 8").
  - Replaced three `SidebarPanel` sections with new accordion components for visual consistency with export controls.
  - Added standardized horizontal padding (`px-2`) to export-related cards (`TargetFormatQualityCard`, `FormatAdvancedSettingsCard`, `SplicingExportPanel`) to align visual spacing with accordion margins.
  - Removed old `NumberInput`, `ColorPickerPopover`, and `ResizeCard` inline markup from `SplicingPresetLayout`, `SplicingCanvasSettings`, and `SplicingImageSettings` sections.
- **Diffchecker UI Standardization:** Standardized all Diffchecker sidebar sections into reusable accordion components with dynamic sublabels and always-open state:
  - `ViewModeAccordion` (blue theme): Collapsible view mode selector with dynamic sublabel showing current mode (e.g., "Split", "Side by Side", "Overlay", "Difference").
  - `ComparisonAccordion` (purple theme): Collapsible comparison controls with dynamic sublabel reflecting active comparison settings (e.g., "Opacity: 85%", "Algorithm: Binary, Threshold: 50", "Drag on viewer to adjust").
  - `AlignmentAccordion` (orange theme): Collapsible alignment controls with dynamic sublabel showing scale mode and anchor position (e.g., "Scale: Match Larger, Anchor: Center").
  - All three accordions set to `defaultOpen={true}` (always visible/expanded) for constant accessibility.
  - Replaced three `SidebarPanel` sections with new accordion components for visual consistency with other sidebar patterns.
  - Removed old `RadioCard`, `SelectInput`, and `SliderInput` inline markup from diffchecker sidebar panel sections.
  - Improved gap spacing from `gap-3` to `gap-1` for tighter accordion layout.
- **Image Splicing Preview Settings Accordion:** Standardized Preview Settings section into collapsible accordion component:
  - `PreviewSettingsAccordion` (sky theme): Collapsible preview quality and image numbering controls with dynamic sublabel showing current quality percentage and numbering status (e.g., "Quality: 20%, Numbers: On").
  - Responsive grid layout (`grid-cols-1 lg:grid-cols-2 xl:grid-cols-3`) that scales based on content area width for optimal readability across different sidebar sizes.
  - Replaced flat `SplicingPreviewSettings` section with accordion for consistent visual hierarchy with other settings.
- **Image Inspector UI Standardization:** Standardized all Image Inspector sidebar sections into reusable accordion components with dynamic sublabels:
  - `DisplayAccordion` (blue theme, always open): Collapsible palette color controls with dynamic sublabel showing selected count (e.g., "4 colors").
  - Changed Palette Colors from discrete SelectInput options to SliderInput for smooth value selection (4-12 colors, step 2).
  - `MetadataAccordion` (purple theme, always open): Collapsible EXIF sorting and privacy controls with dynamic sublabel showing current sort mode and privacy filter status (e.g., "Group by category, Privacy: On").
  - `InformationAccordion` (orange theme, collapsible): Tool information and privacy assurance text with clear explanation of 100% client-side analysis.
  - Replaced three `SidebarPanel` sections with new accordion components for visual consistency across the application.
- **UI Refactor:** Enhanced `RadioCard` component with new features for improved consistency with `CheckboxCard`:
  - Added optional `icon` prop to display icon at the card's start.
  - Renamed `tooltip` prop to `tooltipContent` and added `tooltipLabel` for structured tooltip content/label pairs.
  - Moved help icon (?) from inline with title to the right edge of card, positioned left of `rightSlot` when present.
- **UI Refactor:** Updated all `RadioCard` usage sites with appropriate contextual icons:
  - **Smart Resize (Fit mode):** Added icons for Fill (Maximize2), Cover (Crop), Contain (Minimize).
  - **Diffchecker:** Added icons for Split (Columns), Side by Side (Columns), Overlay (Layers), Difference (Zap).
  - **Splicing Presets:** Added icons for Stitch V (Rows), Stitch H (Columns), Grid (Grid3x3), Bento (LayoutGrid).
- **AVIF Advanced Controls:** Added AVIF-specific controls across Single/Batch Processor and Image Splicing:
  - **Speed (0-10)** in `Target Format & Quality` with guidance about AVIF's inverse speed/effort behavior.
  - New advanced AVIF options: transparent-edge preservation (high alpha quality), alpha quality override, lossless mode, chroma subsampling (4:2:0 / 4:2:2 / 4:4:4), and tune mode (Auto / SSIM / PSNR).
  - All AVIF options are wired end-to-end through direct encoder, worker encoder, batch pipeline, and splicing export pipeline.
- **UI:** Added reusable `FormatAdvancedSettingsCard` wrapper for format-specific advanced options (currently AVIF mapping).
- **UI:** Added reusable `AvifAdvancedSettingsCard` accordion for AVIF expert controls with light/dark friendly styling.
- **PNG Advanced Controls:** Added PNG-specific optimization controls across Batch Processor, Image Splicing, and Custom Format editor:
  - Kept **Tiny Mode** in `Target Format & Quality` for fast access.
  - Added new **PNG Advanced** accordion with `Clean Transparent Pixels`, `Auto Grayscale Detection`, `Dithering (Tiny Mode)`, and `OxiPNG Compression (WASM)`.
  - Wired PNG advanced options through shared `FormatAdvancedSettingsCard` using the new reusable `PngAdvancedSettingsCard`.
- **JXL Effort Control:** Added `Effort Level` selector in **Target Format & Quality** card for JXL format, allowing users to control compression algorithm complexity (1-9 scale):
  - **1-3:** Lightning/Fast modes - faster encoding, larger file sizes (recommended for Batch processing)
  - **4-6:** Fast-Balanced/Balanced modes - balanced performance and compression
  - **7-9:** Optimal/Maximum modes - maximum compression, slower encoding (default: 7, recommended for Single processing)
  - Fully integrated into Custom Presets, Single/Batch Processor, and Image Splicing workflows with tooltips explaining trade-offs.
- **MozJPEG Format (JPG Output):** Added a new `MozJPEG (.jpg)` target format in Single/Batch Processor and Image Splicing.
  - Added dedicated **MozJPEG Advanced** accordion with `Progressive Loading` and `Chroma Subsampling (4:2:0 / 4:2:2 / 4:4:4)` controls.
  - Wired MozJPEG options through shared format settings, conversion worker/main raster adapter pipeline, and splicing export pipeline.
  - Added local-only WASM asset sync flow via `scripts/sync-mozjpeg-wasm.mjs` and `sync:mozjpeg-wasm` (no remote encoder fetch).
- **WebP Advanced + Lossless Controls:** Added WebP-specific controls across Single/Batch Processor, Image Splicing, and Custom Format editor:
  - Added `Lossless Mode`, `Near-Lossless` slider, and `Effort Level (1-9)` in `Target Format & Quality`.
  - Added new `WebP Advanced` accordion with `Sharp YUV` and `Preserve Exact Alpha`.
  - Wired WebP options end-to-end through shared format cards, stores, batch/single config builders, splicing export config, and custom-format normalization.
- **WebP Local WASM Workflow:** Added local-only WebP WASM sync support:
  - New `scripts/sync-webp-wasm.mjs` script and `sync:webp-wasm` package command.
  - Included WebP sync in aggregate `sync:wasm` pipeline.
  - Added bundled local assets `assets/wasm/webp_enc.js` and `assets/wasm/webp_enc.wasm` (no remote encoder fetch).
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
- **TIFF Encoding (UTIF):** TIFF encode path now supports visual grayscale rendering and writes DPI metadata tags (`t282`, `t283`, `t296`) from resize DPI settings so print-size exports preserve resolution information in downstream design/print tools.
- **Config Contracts (Breaking):** Removed all legacy flat codec props from conversion and options payloads (`jxlEffort`, `avif*`, `pngTinyMode`, `icoOptions`, etc.) and standardized on grouped `formatOptions` only across core types, converter worker/main pipeline, batch/single processors, splicing export, and custom format flows (no compatibility migration path retained).
- **PNG Encoding Pipeline:** PNG now uses an option-aware adapter route:
  - Default PNG still uses browser `canvas.convertToBlob(...)` for lightweight path.
  - When pixel-level PNG optimization is enabled (`tinyMode`, `cleanTransparentPixels`, `autoGrayscale`, `dithering`), encoding switches to UPNG-based processing with shared main-thread/worker behavior.
  - Optional `oxipngCompression` now runs an additional lossless wasm optimization pass via `@jsquash/oxipng` after PNG encode (with safe fallback if wasm optimization fails).
- **Converter Architecture:** Introduced a modular adapter-style raster encoding pipeline (`raster-encode-adapters.ts`) to standardize format-specific encoding across main thread and conversion worker. This removes duplicated `if/switch` logic and makes future format extension easier.
- **Boilerplate Reduction (Custom Format Options):** Extracted shared codec options normalization into `src/features/custom-formats/format-options-normalizer.ts` and reused it from both `src/options/shared.ts` and `src/features/custom-formats/store.ts` to avoid duplicated WebP/AVIF/JXL/PNG/ICO normalization logic.
- **Boilerplate Reduction (Splicing Export DTO Mapping):** Added shared builder `src/options/stores/splicing-format-options.ts` and switched `use-splicing-export` to use a single `buildActiveSplicingFormatOptions(...)` mapping path instead of repeating per-format option wiring inline.
- **WebP Encoding Path:** Added hybrid WebP adapter behavior in raster encoding and splicing export:
  - Default/basic WebP stays on native canvas encode.
  - Advanced/lossless WebP options automatically switch to local `@jsquash/webp` WASM encode path.
- **Converter Pipeline Refactor (Adaptive / Loosely Coupled):** Decoupled raster conversion into a shared ImageData-first pipeline (`raster-processing-pipeline.ts`) used by both main-thread engine and conversion worker.
  - `extractRasterFrame(...)` now centralizes decode + resize + draw into a single reusable stage.
  - `raster-encode-adapters.ts` now accepts pure `ImageData` payload instead of direct `ctx/canvas` coupling.
  - Canvas fallback encode path is now injected via `encodeCanvasFormatFromImageData(...)`, reducing environment-specific branching in high-impact engine files.
  - Added `raster-conversion-facade.ts` as a shared orchestration layer so runtime entrypoints delegate conversion flow instead of embedding pipeline wiring.
  - Adapter registry is now fully dependency-injected (`createRasterAdapterRegistry(...)` / `createDefaultRasterAdapterRegistry(...)`) to support format extension with minimal callsite churn.
- **Color Pipeline (Global Decode):** Added shared color-managed decode utilities (`color-managed-pipeline.ts`) and applied them to conversion, worker, ICO generation, preview rendering, and splicing decode stages for consistent color behavior.
- **JXL Workflow:** JXL encode input is now normalized through the shared color-managed decode path and sRGB canvas context pipeline before WASM encoding, reducing color desaturation risk from wide-gamut source profiles.
- **Batch Processor, DiffChecker:** Batch queue grid items and Difference Checker image preview thumbnails now use low-quality thumbnail generation via `createImageBitmap` (200px, 0.6 JPEG quality) to prevent OOM (Out of Memory) crashes when processing multiple large images. Thumbnails are generated asynchronously via new `useThumbnail` React hook.
- **Image Inspector:** Added smooth expand/collapse animations to all collapsible information cards (Color, Metadata) with CSS transitions. Metadata card now always displays even when no EXIF data is present, showing an empty state with message "No metadata tags found".
- **UI:** Consolidated per-component Tailwind class maps into `src/options/components/ui/theme-config.ts` and updated `AccordionCard` and `SidebarCard` to consume those tokens as a single source of truth (removed duplicated class maps across components).
- **UI:** Adjusted `AccordionCard` visuals: stronger collapsed header tint and thicker neutral left border when collapsed, thinner themed left-accent when expanded, and transparent expanded content background for a cleaner overlay appearance.
- **UI:** Enhanced `InfoSection` collapsible cards with smooth CSS animations (maxHeight transition over 300ms with easing) for better visual feedback during expand/collapse.
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
- **UI:** Refactored `ColorPickerPopover` from manual absolute positioning with `useState` to Radix UI Popover component with Portal, automatic viewport collision detection (`sideOffset: 8`, `collisionPadding: 12`), and native Escape key handling.

### Fixed
- **TIFF Encoding (Single Processor):** Fixed error "The source image could not be decoded" in Single Processor TIFF export by:
  - Adding null-check in TIFF encoder to validate `UTIF.encodeImage()` result and throw meaningful error if encoding fails.
  - Adding error handling in `readImageMetaOnMain` to gracefully fallback when `createImageBitmap` fails for unsupported image formats (TIFF preview unavailable in some browsers).
  - Adding try-catch wrapper in `createPreviewAsset` to gracefully skip preview generation for formats not supported by browser's image decoding (allows TIFF download without preview).
  - Adding graceful fallback in `applyWatermarkToImageBlob` to skip watermark processing if source image cannot be decoded, returning original unmodified blob.
- **Preview Fallback Rendering (Single Processor):** Added intelligent preview fallback mechanism that encodes result output to JPEG when the original output format cannot be previewed:
  - When TIFF, BMP, ICO, or other formats fail to preview, automatically generates JPEG fallback preview from the encoded output data.
  - Displays amber warning icon + tooltip "Preview: JPEG fallback (format not supported)" to inform user that preview is using fallback encoding.
  - Preserved original file format for download—fallback only affects preview rendering, not the output file itself.
  - Graceful degrade to "preview unavailable" if even JPEG fallback encoding fails.
- **JXL / Wide-Gamut Input:** Fixed washed-out color output in JXL-heavy workflows by standardizing decode-to-encode color handling through browser-managed color conversion before extracting RGBA for WASM encoders.
- **DX / TypeScript:** Restored optional `hover` token in `ThemeClasses` to keep legacy backup files type-safe during full-repo `tsc --noEmit` checks.
- **UI:** Fixed `ColorPickerPopover` clipping inside accordion cards by refactoring from manual absolute positioning to Radix UI Popover component with Portal and automatic viewport collision detection.
- **DX:** Fixed strict TypeScript issue in context menu builder when checking optional `chrome.runtime.lastError.message`.
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