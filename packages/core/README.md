# Imify Core (`packages/core`)

The foundational package for the Imify monorepo, containing shared types, constants, and pure utility functions.

## Overview

This package is strictly **platform-agnostic**. It does not depend on React, Node.js APIs, or Browser APIs directly. Instead, it defines the common language used by the `engine`, `features`, and `apps`.

## Key Modules

### 1. Types (`src/types/`)
Defines the core data structures for:
- `ImageFormat`: Supported input/output formats (AVIF, JXL, WebP, ICO, etc.).
- `FormatConfig`: Configuration schema for image conversion.
- `StorageState`: The global state schema used for persistence.

### 2. Utils
- **Download Utils**: Standardized filename generation and blob handling.
- **Error Utils**: Shared error types and user-facing error message builders.
- **Format Config**: Definitions of format capabilities (transparency support, lossy/lossless availability).

### 3. Constants
Shared constants for storage keys, versioning, and default application states.

## Usage

Since this is a shared package in a Turborepo, it is imported by other packages via the `@imify/core` workspace alias.

```typescript
import { type ImageFormat } from "@imify/core/types"
import { toOutputFilename } from "@imify/core/download-utils"
```
