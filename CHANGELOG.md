# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Image Inspector:** A comprehensive new workspace for deep image analysis.
  - Extracts rich metadata (dimensions, EXIF, GPS, color space) with built-in privacy alerts for sensitive data.
  - Generates custom color palettes with semantic naming and suggests two-color gradients.
  - Built-in WCAG contrast checker (AAA/AA compliance) for accessibility analysis.
  - Developer export utilities: CSS/SCSS variables, Tailwind config, `<picture>` tags, and ThumbHash support.
  - Secure GPS visualization (links to external maps without embedding trackers).
- **Universal Clipboard Support:** - Paste images directly into any tool (Inspector, Single/Batch Processor, Splicing, Diffchecker) using standard keyboard shortcuts.
  - Paste image URLs to automatically fetch and import remote images.
  - Smart import handling prevents accidental overwrites when a workspace is already active.
- **Image Splicing Tool:**
  - Interactive preview with zoom, pan, scroll modes, and a numbering overlay.
  - Advanced configuration including grid statistics, custom layouts (e.g., Bento preset), and keyboard shortcuts.
  - Robust export system with concurrency, background trimming, and smart file renaming to prevent collisions.
- **Difference Checker:** - New side-by-side viewer mode with fullscreen toggle.
  - Added SSIM (Structural Similarity Index) option for highly accurate image comparison.
- **Global Settings:** Added a new Settings dialog with sidebar navigation to manage warning preferences (e.g., download confirmations, out-of-memory alerts) and batch processing thresholds.
- Improved tooltips across the entire extension for better visibility and smoother hover interactions.

### Changed
- **UI Refinements:** Redesigned the Image Splicing sidebar and quality input fields for a cleaner, more condensed look.
- **Clearer Warnings:** Warning messages now display exact threshold numbers instead of generic alerts.
- **Single Processor:** Refined the zoom behavior and side-by-side viewer logic for a smoother comparison experience.
- The "About" dialog now automatically stays synchronized with the exact extension build version.

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