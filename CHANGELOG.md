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
- Image Splicing preview upgrades:
  - Zoom/pan controls + scroll mode toggle
  - Value scrubbing (hold + drag) for fast zoom adjustments
  - Zoom tooltip support + image numbering overlay
  - Preview rebuild progress tracking
- Heavy preview quality warning for Splicing (with confirmation + “don’t show again” preference)
- Image Splicing UX improvements:
  - Grid statistics
  - Keyboard shortcuts
  - Drag-and-drop reordering in the image strip
  - Image appearance direction options + Bento layout preset
- Image Splicing export upgrades:
  - Concurrency and progress tracking
  - New export modes and background trimming options
  - File renaming pattern support for splicing exports (with unique-name collision fallback)
- Splicing import progress tracking

### Changed
- Updated About dialog to use `package.json` as single source of truth for version info
- Refactored warning descriptions with concrete numbers (thresholds)
- Replaced `QualityInput` with `NumberInput` for quality settings
- Refactored/condensed `SplicingSidebarPanel` layout + option section structure

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