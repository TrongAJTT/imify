# <img src="assets/icon.png" alt="Imify" width="24" height="24" style="vertical-align: middle;"> Imify - Save & Convert Images

> A privacy-first, 100% client-side browser extension that allows users to seamlessly convert, resize, and format images directly from the browser. Built with Manifest V3, it utilizes the browser's native capabilities and WebAssembly (Wasm) to process images locally without ever sending user data to an external server.

[![License](https://img.shields.io/badge/license-Apache%202-blue)](./LICENSE)
[![React](https://img.shields.io/badge/React-18.2.0-61dafb.svg)](https://reactjs.org/)
[![Plasmo](https://img.shields.io/badge/Plasmo-Framework-blue?logo=plasmo)](https://www.plasmo.com/)

## ✨ Key Features

* **100% Client-Side Processing**: Zero server dependencies. Complete data privacy.
* **Rich Format Support**: Read and convert to `JPG`, `PNG` (including TinyPNG-like quantization), `WebP`, `AVIF`, `JXL` (JPEG XL), `TIFF`, `ICO`, `BMP`, and `PDF`.
* **Dynamic Context Menu**: Right-click any image on the web to instantly convert and download it using your predefined formats.
* **Smart Resizing Engine**:
  * Keep original size / Change Width / Change Height / Scale by Percentage (%)
  * **Smart Framing**: Fit (Contain) or Fill (Cover) target dimensions.
  * **Page Size Matching**: Automatically fit images to standard paper sizes (A4, Letter, etc.) with adjustable DPI print-ready PDFs.
* **Batch Processing**: A dedicated dashboard to drag-and-drop multiple files to convert them in bulk. Includes ZIP packaging.
* **Frictionless Import**: Easily fetch images via remote URLs directly from the UI or via clipboard paste, bypassing strict web CORS limits smoothly.
* **Custom Presets**: Create, edit, and toggle your own custom conversion formats to appear in the right-click menu.
* **Real-time Progress**: Non-intrusive sticky toasts inject into the current webpage to show conversion progress for heavy formats (e.g. AVIF, PDF).

## 📸 Screenshots

<div align="center">
  <img src="https://cdn.trongajtt.com/apps/imify/your-menu-your-decision.webp" alt="ImifyPreview" style="width:32%;">
  <img src="https://cdn.trongajtt.com/apps/imify/single-image-processor.webp" alt="ImifyPreview" style="width:32%;">
  <img src="https://cdn.trongajtt.com/apps/imify/batch-image-processor.webp" alt="ImifyPreview" style="width:32%;">
  <img src="https://cdn.trongajtt.com/apps/imify/unmatched-format-compatibility.webp" alt="ImifyPreview" style="width:32%;">
  <img src="https://cdn.trongajtt.com/apps/imify/personalized-default-settings.webp" alt="ImifyPreview" style="width:32%;">
</div>

## 📥 Installation

Imify is officially available on the Firefox Add-ons Store. Links to the Chrome Web Store and Microsoft Edge Add-ons store will be updated as soon as they are approved. Click the badges below to install it directly:

<!--Imify is officially available on major browser extension stores. Click the badges below to install it directly:
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web_Store-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](LINK_CHROME_WEB_STORE_CỦA_BẠN)
[![Microsoft Edge Add-ons](https://img.shields.io/badge/Edge-Add--ons-0078D7?style=for-the-badge&logo=microsoftedge&logoColor=white)](LINK_EDGE_ADDONS_CỦA_BẠN)-->
[![Firefox Add-ons](https://img.shields.io/badge/Firefox-Add--ons-FF7139?style=for-the-badge&logo=firefoxbrowser&logoColor=white)](https://addons.mozilla.org/en-US/firefox/addon/imify-save-process-images/)

## 🛠️ Tech Stack

* **Framework**: [Plasmo](https://docs.plasmo.com/) (React-based browser extension framework)
* **UI/Styling**: React, Tailwind CSS, Lucide React
* **Core Image Processing**: Native `OffscreenCanvas` API, Web Workers
* **Advanced Encoders**: WebAssembly (Wasm) via `@jsquash/avif` & `@jsquash/jxl`, `UPNG.js`, `UTIF.js`, `fflate`
* **PDF Generation**: `pdf-lib` (Client-side PDF document creation)
* **Language**: TypeScript (Strict typing)
* **Manifest Version**: MV3

## 📂 Project Structure (Feature-Based)

```text
src/
├── background/             # Service worker: Context menu logic & Message routing
├── contents/               # CSUI: Injected sticky progress toasts
├── options/                # Options Page: Dashboard for Settings & Batch Conversion
├── features/               # Vertical slices of business logic
│   ├── batch-processor/    # Drag & drop bulk processing logic
│   ├── converter/          # Core Engines: Canvas processing, BMP encoding, PDF embedding
│   ├── custom-formats/     # CRUD operations for user presets
│   └── settings/           # Storage sync and global format toggles
├── core/                   # Pure functions, math, and constants
│   ├── image-utils.ts      # Dimension calculation & aspect ratio math
│   └── paper-constants.ts  # Physical paper size to Pixel/DPI mappings
```

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v18 or higher)
* [pnpm](https://pnpm.io/) (Recommended package manager)

### Installation

1. Clone the repository:
   
   ```bash
   git clone https://github.com/trongajtt/imify.git
   cd imify
   ```

2. Install dependencies:
   
   ```bash
   pnpm install
   ```

### Development

To start the development server (Hot Module Replacement enabled):

```bash
# Default (Chrome)
pnpm dev

# Specific targets
pnpm dev:chrome
pnpm dev:firefox
```

### Loading the Extension

1. Open your browser and navigate to:
   * Chrome: `chrome://extensions/`
   * Firefox: `about:debugging#/runtime/this-extension`
2. Enable **Developer mode** (for Chrome).
3. Click **Load unpacked** (Chrome) or **Load Temporary Add-on** (Firefox).
4. Select the build directory (e.g., `build/chrome-mv3-dev` or `build/firefox-mv3-dev`).

## 📦 Building for Production

To create production-ready, optimized builds:

```bash
# Build all and verify (CI mode)
pnpm build:ci

# Build specific target
pnpm build:chrome
pnpm build:firefox
```

## 🚀 Packaging for Distribution

To generate `.zip` files for the Web Store or AMO:

```bash
pnpm package:chrome
pnpm package:firefox
```

This will generate a zip-ready folder in `build/chrome-mv3-prod` which you can upload directly to the Chrome Web Store.

### 🦊 Note for Mozilla AMO Reviewers

If you are reviewing this extension for the Mozilla Add-ons Store, please follow these steps to reproduce the exact build:

1. Install dependencies: `pnpm install`
2. Generate the Firefox package: `pnpm package:firefox`
3. The generated add-on will be an archive located in the output build directory.

**Compliance Declaration regarding WebAssembly (WASM) & Minification:**
- **WASM Origin:** All `.wasm` binaries used in this project for image encoding/decoding (e.g., AVIF, JXL) are sourced standardly and transparently via open-source NPM packages (`@jsquash/avif`, `@jsquash/jxl`, etc.) as defined in `package.json`. There are no custom-compiled, opaque binary blobs hidden in the source tree.
- **Zero Remote Execution:** The extension processes all images 100% locally and does not fetch any executable code, scripts, or WASM files from remote servers.

> **Note for Firefox**: Our build pipeline includes a sanitation script (`scripts/sanitize-firefox-manifest.mjs`) that automatically removes the `offscreen` permission from the Firefox manifest to comply with AMO policies while maintaining maximum performance for Chrome users.

## 🔒 Privacy & Security

This extension is explicitly designed to respect user privacy:

- **No Analytics/Tracking**: We do not track what images you convert.
- **No Cloud Servers**: The extension does not make any external API calls to process your files. Every byte of image data is processed inside your local browser memory and discarded immediately after download.
- **Cross-Origin Restrictions**: The extension fetches image blobs using its native MV3 permissions, meaning it securely bypasses standard web CORS limitations without exposing your browser to malicious scripts.

## 📄 License

This project is licensed under the Apache 2.0 License - see the [LICENSE](./LICENSE) file for details.

## 💝 Support & Donate

If you find Imify useful, please consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/GitHub%20Sponsors-6e5494?style=for-the-badge&logo=github-sponsors&logoColor=white)](https://github.com/sponsors/TrongAJTT)

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/trongajtt)
