# AMO Reviewer Notes — Imify v2.1.0

## 1. `sidePanel` API calls (`chrome.sidePanel.setOptions`, `chrome.sidePanel.open`)

**Files flagged:** `popup.js`, `options.js`, `sidepanel.js`

This extension supports both Chrome/Edge (where the Side Panel API is available) and Firefox (where it is not). All calls to `chrome.sidePanel` are wrapped in explicit availability guards:

```js
if (!chrome.sidePanel?.setOptions || !chrome.sidePanel?.open) {
  throw new Error("Side Panel API is unavailable in this browser build.")
}
```

On Firefox, this branch is always false, so the API is never invoked. The Side Panel feature is documented as Chrome/Edge-only in our store listing. The same code bundle is shipped to all platforms, so the dead code path will be present but never executed on Firefox.

---

## 2. `offscreen.createDocument` API calls

**File flagged:** `background/index.js`

This extension uses the Offscreen Document API for heavy image encoding (AVIF/JXL) on Chrome/Edge. On Firefox, this API is not supported. Usage is gated behind two guards:

1. A manifest permission check at startup:
   ```js
   const OFFSCREEN_PERMISSION_ENABLED =
     chrome.runtime.getManifest().permissions?.includes("offscreen") ?? false
   ```
   The Firefox manifest has `offscreen` removed by our build pipeline, so this is always `false` on Firefox.

2. An API availability check before any call:
   ```js
   if (!chrome.offscreen?.createDocument) { throw ... }
   ```

The offscreen path is never reached on Firefox. As a fallback, the extension performs image conversion directly on the main thread.

---

## 3. `innerHTML` assignments

**Files flagged:** Multiple JS bundles

No direct `innerHTML` assignments exist in our source code. These originate from **React DOM's internal rendering engine** (v18.3.1), which uses `innerHTML` for its initial server-side hydration path. This is standard behavior for all React 18 applications and is not user-input driven. The strings assigned are always React-generated virtual DOM output, never interpolated user content.

---

## 4. `eval` / `Function` constructor

**File flagged:** `dist.*.js`

Only hard-coded string literals are ever evaluated — no user input or dynamic strings are involved. This is a well-known pattern used by many popular libraries (including `sinon`, `chai`, `lodash`) for ES intrinsic detection. It does not represent an XSS or code injection risk.

---

## 5. Local WASM-based AI Inference (Transformers.js)

**Files flagged:** `background-remover.worker.js`, `transformers.js`

This extension performs background removal and image analysis using **WASM-based AI engines**. This approach is chosen for both performance and user privacy, as all inference happens **entirely on the user's device** without sending any data to a remote server.

### Library Patching (`scripts/patch-transformers.mjs`)
We use a custom build-time script to patch the `@huggingface/transformers` library. This is done for two reasons:
1. **MV3 Compatibility**: The library contains Node.js-specific code (e.g., `await import("worker_threads")`) that causes syntax errors in browser environments. Our patch neutralizes these paths.
2. **Path Resolution**: To ensure the extension remains **100% offline-capable**, we obfuscate the engine filenames during build. This prevents the bundler from attempting to resolve them as static assets and allows our runtime loader to point specifically to the local binaries bundled within the extension (`assets/onnx-engines/`).

All AI processing is local, privacy-first, and does not require internet access once the extension is installed.
