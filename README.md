# <img src="/assets/icon.png" alt="Imify" width="24" height="24" style="vertical-align: middle;"> Imify - Powerful Image Toolkit

> A privacy-first, 100% client-side image processing suite. Available as a **Next.js Web Application** and a **Browser Extension**. Save, convert, resize, split, splice, and audit images directly in your browser — without uploading anything to a server.

![version](https://img.shields.io/github/release/trongajtt/imify?color=green)
[![License](https://img.shields.io/badge/license-Apache%202-blue)](./LICENSE)
[![React](https://img.shields.io/badge/React-18.2.0-61dafb.svg)](https://reactjs.org/)
[![Plasmo](https://img.shields.io/badge/Plasmo-Framework-blue?logo=plasmo)](https://www.plasmo.com/)

## ✨ Key Features (v2.0.0 Suite)

* **Dual Platforms**: Use Imify as a standalone web application or as a tightly integrated browser extension.
* **100% Client-Side Processing**: Zero server dependencies. Complete data privacy using WebAssembly and Web Workers.
* **Rich Format Support**: Read and convert to `JPG`, `PNG` (Tiny mode, Floyd-Steinberg dithering, and OxiPNG WASM optimization), `WebP`, `AVIF`, `JXL` (JPEG XL), `TIFF`, `ICO`, `BMP`, and `PDF`.
* **Advanced Processing Tools (Available in both the web application and the browser extension)**:
  * **Batch Processor**: Drag-and-drop multiple files to convert them in bulk. Includes ZIP packaging.
  * **Image Splitter**: Slice images via grid systems or custom percentage/pixel sequences with a reorderable guide UI.
  * **Image Splicing**: Vertically or horizontally stitch multiple images together with gap controls.
  * **Pattern & Fill**: Generate seamless patterns and use symmetric edge-filling techniques.
  * **Difference Checker**: Pixel-perfect visual comparison tool for QA and analysis.
  * **Image Inspector**: Deep dive into image metadata and EXIF data.
* **Extension-Exclusive Features**:
  * **Right-Click Context Menu**: Instantly convert and download any web image using your preferred presets.
  * **SEO Audit**: Deep DOM scanning to detect oversized images, missing alt text, lazy-loading issues, and potential bandwidth savings via modern formats.
* **Smart Resizing Engine**: Scale by dimension, percentage, or match standard physical paper sizes (A4, Letter) with DPI controls.
* **Modern Workspace UI**: A unified, desktop-like layout with collapsible navigation, reorderable sidebar configurations (`dnd-kit`), and dark mode support.

## 📸 Screenshots

<div align="center">
  <img src="https://cdn.trongajtt.com/apps/imify/context-menu.webp" alt="ImifyPreview" style="width:32%;">
  <img src="https://cdn.trongajtt.com/apps/imify/image-splicing.webp" alt="ImifyPreview" style="width:32%;">
  <img src="https://cdn.trongajtt.com/apps/imify/difference-checker.webp" alt="ImifyPreview" style="width:32%;">
  <img src="https://cdn.trongajtt.com/apps/imify/image-processor.webp" alt="ImifyPreview" style="width:32%;">
  <img src="https://cdn.trongajtt.com/apps/imify/image-inspector.webp" alt="ImifyPreview" style="width:32%;">
</div>

## 💝 Support & Donate

If you find Imify useful, please consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/GitHub%20Sponsors-6e5494?style=for-the-badge&logo=github-sponsors&logoColor=white)](https://github.com/sponsors/TrongAJTT)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/trongajtt)

## 📥 Installation

Imify is officially available on the Chrome Web Store, Microsoft Edge Add-ons Store, and Firefox Add-ons Store. Click the badges below to install it directly:

[![Chrome Web Store](https://cdn.trongajtt.com/assets/get-on-chrome.webp)](https://chromewebstore.google.com/detail/imify-powerful-image-tool/ilhbmbkcakhlelcifilnlcmpklkafabg?authuser=0&hl=en)
[![Microsoft Edge Add-ons](https://cdn.trongajtt.com/assets/get-on-edge.webp)](https://microsoftedge.microsoft.com/addons/detail/jgdgjoioljlhigbnifkjeniojoeianfm)
[![Firefox Add-ons](https://cdn.trongajtt.com/assets/get-on-firefox.webp)](https://addons.mozilla.org/en-US/firefox/addon/imify-save-process-images/)

> [!IMPORTANT]
> 🛡️ **Note for Chrome Users (Enhanced Safe Browsing):**
> - Because Imify is a newly published extension, users with Chrome's "Enhanced Safe Browsing" enabled might see a warning stating the extension is *"not trusted."*
> - This is a standard Google policy applied to all **new developer accounts** until they build a history of trust over a few months. It is not related to the code itself. Imify is completely open-source, operates 100% offline, and requires no external servers. You can verify every line of code in this repository. It is entirely safe to click "Continue to install".

## 🛠️ Tech Stack

* **Monorepo**: [Turborepo](https://turbo.build/)
* **Web App**: [Next.js](https://nextjs.org/) (App Router)
* **Extension Framework**: [Plasmo](https://docs.plasmo.com/) (Manifest V3)
* **UI/Styling**: React, Tailwind CSS, Radix UI, dnd-kit, Lucide React
* **State Management**: Zustand
* **Core Image Processing**: Native `OffscreenCanvas` API, Web Workers
* **Advanced Encoders**: WebAssembly (Wasm) via `@jsquash/avif`, `@jsquash/jxl`, `@jsquash/oxipng`; plus `image-q`, `UPNG.js`, `UTIF.js`, `fflate`
* **Language**: TypeScript (Strict typing)

## 📂 Monorepo Structure

```text
imify/
├── apps/
│   ├── extension/          # Plasmo browser extension (Background, Popup, Sidepanel, Options)
│   └── web/                # Next.js web application
├── packages/
│   ├── config/             # Shared build, lint, and Tailwind presets
│   ├── core/               # Platform-agnostic types, math, and pure utilities
│   ├── engine/             # Wasm worker pools, quantizers, and encoders
│   ├── features/           # Shared business logic and UI (Splitter, Batch, SEO Audit)
│   ├── stores/             # Global Zustand state management
│   └── ui/                 # Design system (Radix, dnd-kit, Theme engines)
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

We use Turborepo to manage tasks across the monorepo.

```bash
# Start all development servers (Web app + Extension on Chrome)
pnpm dev

# Start only the Web app
pnpm --filter @imify/web dev

# Start only the Extension (Targeting specific browsers)
pnpm --filter @imify/extension dev:chrome
pnpm --filter @imify/extension dev:firefox
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
pnpm build:edge
pnpm build:firefox
```

## 🚀 Packaging for Distribution

To generate `.zip` files for the Web Store or AMO:

```bash
pnpm package:chrome
pnpm package:edge
pnpm package:firefox
pnpm package:all
```

This will generate a zip-ready folder in `build/chrome-mv3-prod` which you can upload directly to the Chrome Web Store.

### 🦊 Note for Mozilla AMO Reviewers

If you are reviewing this extension for the Mozilla Add-ons Store, please follow these steps to reproduce the exact build:

1. Install dependencies: `pnpm install`
2. Generate the Firefox package: `pnpm package:firefox`
3. The generated add-on will be an archive located in the output build directory.

**Compliance Declaration regarding WebAssembly (WASM) & Minification:**
- **WASM Origin:** All `.wasm` binaries used in this project for image encoding/decoding/optimisation (AVIF, JXL, OxiPNG, MozJPEG) are sourced standardly via open-source NPM packages (`@jsquash/avif`, `@jsquash/jxl`, `@jsquash/oxipng`, `@jsquash/mozjpeg`) as declared in `package.json`. There are no privately built or obfuscated custom wasm payloads.
- **Zero Remote Execution:** The extension processes all images 100% locally and does not fetch any executable code, scripts, or WASM files from remote servers.

> **Note for Firefox**: Our build pipeline includes a sanitation script (`scripts/sanitize-firefox-manifest.mjs`) that automatically removes the `offscreen` permission from the Firefox manifest to comply with AMO policies while maintaining maximum performance for Chrome users.

## 🔒 Privacy & Security

This extension is explicitly designed to respect user privacy:

- **No Analytics/Tracking**: We do not track what images you convert.
- **No Cloud Servers**: The extension does not make any external API calls to process your files. Every byte of image data is processed inside your local browser memory and discarded immediately after download.
- **Cross-Origin Restrictions**: The extension fetches image blobs using its native MV3 permissions, meaning it securely bypasses standard web CORS limitations without exposing your browser to malicious scripts.

## 📄 License

This project is licensed under the Apache 2.0 License - see the [LICENSE](./LICENSE) file for details.