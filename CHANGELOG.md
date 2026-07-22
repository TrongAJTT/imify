# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

[Unreleased]

## [2.2.2] - 2026-07-22 - Web App only

### Added

- **Multi-Image Difference Checker (Up to 4 Images):** Added support for comparing up to 4 images simultaneously (Images A, B, C, D) with multi-file drag-and-drop intake across all 4 slots and responsive mobile support.
- **Custom Comparison Layouts:** Introduced visual grid layout selectors for 2 images (2 vertical columns, 2 horizontal rows), 3 images (3 columns, 3 rows), and 4 images (2x2 grid, 4 columns, 4 rows) with filled SVG icons.

### Fixed

- **Full Resolution Rendering:** Resolved image quality degradation in Difference Checker by removing downscaled 320px previews and preserving 100% loss-free original resolution object URLs.
- **Offline PWA Sub-Route Navigation:** Fixed Next.js client-side navigation errors when loading preset sub-routes (e.g., `/splicing/work` or `/filling/fill`).

## [2.2.1] - 2026-07-21 - Web App only

### Added

- **Upscaler Enhancements:** Added an advisory/warning card for high-resolution images (> 1000px) detailing hardware/browser ONNX memory constraints.
- **Retry Capability:** Added a "Retry All" option to batch processing queues for failed tasks.
- **Descriptive Tooltips:** Included a visual matrix/table tooltip describing available resizing policies (Crop, Contain, etc.).

### Fixed

- **Next.js PWA Offline Support:** Resolved static route redirect/404 issues on offline Next.js app pages (e.g. `/splicing/work` or `/inspector`) by updating Service Worker precaching patterns for `.html`/`.txt` pairs and handling RSC content headers properly.
- **Mobile Compatibility:** Fixed Android image decoding and file object URL resource leaks. Prevented mobile bottom sheets from auto-closing during Grid Design interactions.
- **Splicing Stability:** Resolved naming inconsistencies and enhanced UI stability in the splicing editor.
- Fix UI issues in the Dev Tools dialog when using dark mode.
- Fix background page scrolling when interacting with the "Imify has been updated" dialog.
- Fix a bug causing a blank bottom sheet when selecting options via checkbox cards on mobile in the Pattern Generator.
- Fix an issue where the left side of the UI was cut off in the Draw Asset dialog within the Pattern Generator.

### Changed

- **Unified Dialogs:** Removed redundant/duplicate dialog variants in `apps/extension` in favor of shared package dialogs (`BatchDownloadConfirmDialog` and `OOMWarningDialog`) with complete EN/VI internationalization support.
- **Developer Tools Dashboard:** Segmented "About" and "Language Settings" into dedicated tabs. Added state viewer word-wrap, filters, and log counts.
- **Centralized Configurations:** Consolidated internal presets, step parameters, zoom levels, boundaries, and brush thresholds into uniform `config.ts` modules for Splitter, Splicing, Filling, and Pattern Generator features.
- **Changelog**: Merge patch versions into minor version docs.
- Update the sidebar layout for better visual consistency across multiple features.
- Swap the positions of the "Developer Tools" and "Asset Management" buttons on the appbar.

## [2.2.0] - 2026-07-10 - Web App only

**The v2.2.0 update marks a massive leap forward for Imify.** In this release, we're bringing the power of Artificial Intelligence directly to your browser with our new **Background Removal** tool, alongside a highly secure, all-in-one **QR Code suite**. Most importantly, Imify is now a full-fledged Progressive Web App (PWA), meaning you can install it on your device and work 100% offline. Dive in to explore dozens of performance tweaks, custom locales, and a brand-new **Dashboard** built specifically for developers!

### ✂️ Background Removal

- **State-of-the-Art AI Engines:** Integrated 3 specialized models (ORMBG, MODNet, and Selfie Segmenter) to provide the best balance between quality and speed.
- **Interactive Comparison:** Real-time preview with a side-by-side comparison slider to verify extraction quality instantly.
- **Custom Presentation:** Choose custom background colors or keep transparency for professional-grade results.
- **Showcase Gallery:** Explore available processing presets through a new visual showcase panel in the sidebar.

### 🔍 QR Tools (Generator & Reader)

- **Privacy-First QR Generator:** Generate highly customizable, offline-safe static QR codes with support for logo overlays (with auto-excavation), pattern styles (dots, markers, shapes), custom colors, and loss-less vector SVG exports.
- **Advanced QR Reader:** Scan QR codes instantly using local device cameras, drag-and-drop file uploads (PNG/SVG), or active screen capture. History management saves scan results locally.
- **Visual Illustrations:** Added professional SVG illustrations for both QR Generator and QR Reader tools.

### 🌍 Internationalization & Custom Locales

- **Comprehensive Multi-Language Support:** Fully localized the entire workspace, batch processor, creative designer tools, and landing pages in English (EN) and Vietnamese (VI).
- **Runtime Custom Locales:**
  - **IndexedDB Persistence:** Import and automatically save custom JSON translation bundles locally across application reloads.
  - **Locale Tools:** Reusable `LanguageItemCard` component integrated into settings and developer tools. Supports exporting translation bundles as ZIP files or deleting them directly.
  - **English Bundle Downloader:** Download the baseline English language JSON pack as a ZIP file directly from Dev Tools to simplify translation contributions.

### 🛠️ Developer Mode & Diagnostics

- **About Dev Tools:** Reorganized developer settings, introducing a dedicated dashboard tab detailing diagnostics tools, and moved the "Disable Developer Mode" option to this view.
- **LocalStorage Manager:** Search, filter (Imify-only toggle), edit, copy, and delete keys dynamically. Includes an inline JSON validator to prevent malformed data from corrupting application state.
- **State Serialization:** Registers QR Code Generator and Background Remover stores in the serialization registry (with auto-filtering of temporary text/WiFi fields).

### 🎨 UI & Asset Management Polish

- **Unified Card Grid:** Merged the landing page tools list and pro showcase section into a single, responsive layout card grid featuring dynamic "Highlight" and "New" badges.
- **Hero Carousel:** Implemented an auto-advancing 14-tool slide presentation with dot indicators and thumbnail controls.
- **Modernized Watermark Dialogs:** Completely redesigned Save and Open dialogs for watermark patterns, featuring centered layouts and improved typography.
- **Vibrant Preset Styling:** Enhanced visual feedback for active presets with improved color syncing and more vibrant card designs.
- **Organized Asset Manager:** Improved model management with collapsible sections, making it easier to navigate as your AI library grows.
- **Categorized Acknowledgements:** Expanded the credits system to include "Media & Illustrations" alongside dependency libraries, providing authors, licenses, and visual previews.

### 🚀 Performance, Navigation & Fixes

- **Document Fullscreen:** Added titlebar controls on desktop appbars and dropdown options on mobile devices to toggle fullscreen view.
- **PWA & Offline Support:**
  - **Full Offline Capability:** Imify Web now works 100% offline after the first visit.
  - **WASM Pre-caching:** All core image processing engines (AVIF, JXL, MozJPEG, OxiPNG) are automatically cached for immediate offline use.
  - **Native App Experience:** Added a Web App Manifest, allowing Imify to be installed as a standalone application.
  - **Unified Update Flow:** Integrated Service Worker update detection with the "Imify has been updated" dialog.
- **Smart Rehydration:** Replaced full-page reloads with smart store rehydration for a faster and smoother workspace experience.
- **Responsive Layout:**
  - Portrait/tall image overflow issue resolved in the Inspector's `BasicInfoCard` with max-height constraints.
  - SWAP bg color logic fixed in Palette color contrast tooltips.
  - Cleaned up obsolete translation assets and synchronized directories.

## [2.1.3] - 2026-05-03 - Web App only

**Web App Only**

Version 2.1.3 focuses on enhancing the landing page with modern interactive elements and unified brand visibility for a better user experience.

### 🎥 Interactive Video Demo

- **Feature Showcases:** Explore Imify's capabilities through a professional video presentation.
- **Quick Navigation Milestones:** Jump directly to specific feature demonstrations (like Batch Processing or Pattern Generation) using the new interactive milestone buttons.
- **Polished Presentation:** Muted autoplay and seamless looping provide a clean, non-distracting preview of the toolkit in action.

### 🧩 Community & Help Center

- **Interactive FAQ:** A new, sleek accordion system makes it easier than ever to find answers about privacy, performance, and features.
- **Unified Brand Presence:** Clean, professional badges for **Product Hunt**, **Unikorn**, and **J2TEAM Launch** are now available in the footer, with full support for both light and dark themes.

## [2.1.2] - 2026-05-01

Version 2.1.2 transforms Imify into a professional "Image Toolkit," introducing specialized creative workspaces, a diagnostic SEO engine, and a high-performance processing core.

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

## [1.5.0] - 2026-04-01

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

## [1.0.1] - 2026-03-24

### Fixed

- Move AnimatingSpinner out of contents to fix React type error on all pages

## [1.0.0] - 2026-03-23

### Added

- **Right-Click Magic (Context Menu)**: Instantly convert and download any web image to formats like JPG, PNG, WEBP, or AVIF with a single right-click.
- **Customizable Menu**: Full control over your context menu. Choose which formats to show, hide, and reorder.
- **Batch Processing Dashboard**: Drag & drop multiple heavy images and process them simultaneously using multi-threading (Web Workers).
- **Zero-Data Privacy**: 100% offline and client-side processing. No servers, no tracking, total privacy.
- **Format Support**: Natively supports 9 formats including AVIF, WEBP, JXL, TIFF, and PDF (export).
