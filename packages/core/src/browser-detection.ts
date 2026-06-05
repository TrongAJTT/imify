export type SupportedBrowser = "chrome" | "edge" | "firefox"

type NavigatorWithUAData = Navigator & {
  userAgentData?: {
    brands?: Array<{ brand: string; version: string }>
  }
}

function hasEdgeBrand(brands: Array<{ brand: string; version: string }>): boolean {
  return brands.some((entry) => entry.brand.toLowerCase().includes("edge"))
}

export function detectBrowser(): SupportedBrowser {
  if (typeof navigator === "undefined") {
    return "chrome"
  }

  const nav = navigator as NavigatorWithUAData
  const userAgent = navigator.userAgent.toLowerCase()
  const brands = nav.userAgentData?.brands ?? []

  if (userAgent.includes("firefox")) {
    return "firefox"
  }

  if (
    userAgent.includes("edg/") ||
    userAgent.includes("edga") ||
    userAgent.includes("edgios") ||
    hasEdgeBrand(brands)
  ) {
    return "edge"
  }

  return "chrome"
}

/**
 * Checks if the browser supports the Screen Capture (getDisplayMedia) API.
 * This is generally not supported on mobile browsers.
 */
export function isScreenCaptureSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    !!navigator.mediaDevices.getDisplayMedia
  );
}

/**
 * Checks if the browser supports the Local Font Access API (queryLocalFonts).
 * This is generally not supported on mobile browsers.
 */
export function isLocalFontAccessSupported(): boolean {
  return typeof window !== "undefined" && "queryLocalFonts" in window;
}

/**
 * Checks if the browser supports the Camera (getUserMedia) API.
 */
export function isCameraSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    !!navigator.mediaDevices.getUserMedia
  );
}

/**
 * Checks if the browser supports Web Workers.
 */
export function isWebWorkerSupported(): boolean {
  return typeof Worker !== "undefined";
}

/**
 * Checks if the browser supports OffscreenCanvas.
 */
export function isOffscreenCanvasSupported(): boolean {
  return typeof OffscreenCanvas !== "undefined";
}

/**
 * Checks if the browser supports SharedArrayBuffer.
 * Note: Requires Cross-Origin Isolation for high-resolution timers and memory sharing.
 */
export function isSharedArrayBufferSupported(): boolean {
  return typeof SharedArrayBuffer !== "undefined";
}

/**
 * Checks if the browser supports IndexedDB.
 */
export function isIndexedDBSupported(): boolean {
  return typeof indexedDB !== "undefined";
}

/**
 * Checks if the environment is a Secure Context (HTTPS or localhost).
 * Many powerful APIs only work in a Secure Context.
 */
export function isSecureContext(): boolean {
  return typeof window !== "undefined" && window.isSecureContext;
}

/**
 * Detects if the current device is likely a mobile device.
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}
