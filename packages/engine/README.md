# Imify Engine (`packages/engine`)

The heavy-lifting image processing engine for Imify. It manages Wasm-based encoders, quantizers, and worker pools to ensure fast, client-side image manipulation.

## Core Responsibilities

### 1. Image Conversion (`src/converter/`)
The primary entry point for all conversion tasks. It handles:
- Orchestrating multiple encoders (MozJPEG, OxiPNG, AVIF, JXL, WebP).
- Managing image quantization (using `image-q`) for formats like ICO and indexed PNG.
- Handling metadata stripping and color profile management.

### 2. Worker Pool Management (`src/converter/wasm-worker-pool.ts`)
To prevent the main thread from blocking during heavy encoding tasks, this package implements a sophisticated worker pool:
- **Dynamic Scaling**: Manages a pool of Web Workers to parallelize batch processing.
- **Wasm Resolution**: Provides hooks for resolving Wasm binaries across different environments (Web URL vs. Extension `web_accessible_resources`).
- **Progress Tracking**: Exposes fine-grained progress events for each conversion job.

### 3. Special Formats
- **ICO Support**: Generates multi-resolution icon files using quantization and scaling.
- **Modern Formats**: Native support for AVIF and JXL via Wasm.

## Technical Stack
- **Wasm Encoders**: Based on `@jsquash` and official Wasm builds of MozJPEG, OxiPNG, etc.
- **Quantization**: `image-q` for color-sensitive downsizing.
- **Worker Communication**: Standardized message-passing for cross-thread processing.

## Contribution Note
When adding a new encoder, ensure you provide both the Wasm loader logic and a corresponding entry in the `WasmEncodeWorkerPool`.
