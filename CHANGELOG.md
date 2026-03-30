# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Settings dialog for managing warning dialogs (download confirmation & OOM warnings)
- Dynamic configuration system for batch processing thresholds
- Sidebar navigation in Settings dialog for future extensibility
- Enhanced `Tooltip` component (label highlight + delayed hover, portal-based rendering to avoid clipping)
- **Image Splicing** (in development, not yet released):
  - Preview: zoom/pan, scroll mode toggle, value scrubbing for zoom, numbering overlay, preview rebuild progress
  - Heavy preview quality warning (confirmation + “don’t show again” preference)
  - Grid statistics, keyboard shortcuts, strip reorder, image direction options, Bento layout preset
  - Export: concurrency and progress, modes and background trimming, file renaming pattern with collision fallback
  - Import progress tracking
- **Diffchecker** (in development, not yet released):
  - Side-by-side viewer mode, fullscreen toggle and usage guidance
  - SSIM option for image comparison
  - `SliderInput` control and compare input handling
- **Single Processor**: refinements to preview/compare (zoom and side-by-side behavior)

### Changed
- Updated About dialog to use `package.json` as single source of truth for version info
- Refactored warning descriptions with concrete numbers (thresholds)
- Replaced `QualityInput` with `NumberInput` for quality settings
- Refactored/condensed `SplicingSidebarPanel` layout + option section structure
- `SingleProcessorTab`: compare/zoom logic and viewer integration

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