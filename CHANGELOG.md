# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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