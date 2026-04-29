# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-04-30

Version 2.0.0 transforms Imify into a professional "Image Toolkit," introducing specialized creative workspaces, a diagnostic SEO engine, and a high-performance processing core.

### ✨ Creative & Diagnostic Workspaces
- **Image Filling Designer:** A powerful layer-based workspace to fill shapes (polygons, stars, circles) with images. Features symmetric grid generators and professional layer management.
- **Advanced Image Splitter:** Multi-method slicing engine including:
  - **Basic/Advanced:** Grid, pixel-perfect, and pattern-based slicing.
  - **Social Slicer:** Optimized templates for Instagram Carousels and multi-post layouts.
  - **Sprite Extractor:** Automatically extract individual icons or elements from sprite sheets.
- **Pattern Generator:** Create seamless repeating patterns from image assets or manual brush strokes. Includes full control over distribution jitter, scale variance, and rotation.
- **SEO Audit (Chrome & Edge):** Real-time web diagnostics to identify missing alt text, oversized images, and performance bottlenecks directly on the active webpage.
- **Extension Command Center:** New quick-access popup for instant Page Scanning and Lite Image Inspection without opening the main dashboard.

### 🎨 UI/UX & Workflow Efficiency
- **Modernized Sidebar:** Reorganized configuration panels using color-coded **Accordions** (Formats, Resize, Advanced) for a cleaner, more focused workspace.
- **Unified Preset System:** Robust workflow to save, manage, and reuse favorite configurations across Single, Batch, and Splicing processors.
- **Professional Viewer Engine:** Upgraded all previewers with **Pointer-Aware Zoom** (zoom to cursor), smooth Pan controls, and high-fidelity rendering.
- **Customizable Productivity:**
  - Fully reconfigurable keyboard shortcuts for all major actions.
  - Adjustable workspace sidebar widths and theme-synced UI components.
  - Accessible dialogs with native Escape-key support and improved dark mode contrast.

### ⚙️ Engine, Formats & Performance
- **Smart Concurrency Advisor:** Hardware-aware engine that auto-detects CPU/RAM and recommends safe processing limits to prevent browser lag. Includes an "Overclock" mode for power users.
- **Expert Format Controls:**
  - Added **MozJPEG** target for superior quality-to-size compression ratios.
  - Advanced tuning for **AVIF, JXL, and WebP** (speed, effort, and lossless modes).
  - Print-ready **TIFF** and **BMP** support with multi-depth and DPI metadata preservation.
- **High-Performance WASM:** All heavy encoding/decoding operations run 100% client-side via optimized WASM modules, ensuring maximum privacy and offline capability.

### 🐛 Key Refinements & Fixes
- **Memory Optimization:** Implemented smart thumbnailing for batch queues to prevent OOM (Out of Memory) crashes when handling 4K+ images.
- **Color Accuracy:** Resolved "washed-out" issues by standardizing color-managed decode paths for wide-gamut source images.
- **Stability:** Fixed layer coordinate drift in manual editors and resolved intermittent progress-toast overlapping.
- **Interaction:** Smoother wheel-event handling and refined expand/collapse animations for all collapsible UI elements.

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