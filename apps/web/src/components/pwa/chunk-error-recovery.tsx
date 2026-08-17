"use client";

import { useEffect } from "react";

const RETRY_KEY = "__imify_chunk_retry_timestamp__";
const RETRY_COOLDOWN_MS = 15_000; // 15 seconds cooldown to prevent reload loops

/**
 * Checks if the error or message indicates an outdated chunk or dynamic import failure.
 */
function isChunkLoadingError(errorOrMessage: unknown): boolean {
  if (!errorOrMessage) return false;

  let message = "";
  let name = "";

  if (typeof errorOrMessage === "string") {
    message = errorOrMessage;
  } else if (errorOrMessage instanceof Error) {
    message = errorOrMessage.message || "";
    name = errorOrMessage.name || "";
  } else if (typeof errorOrMessage === "object") {
    message = String((errorOrMessage as Record<string, unknown>).message || "");
    name = String((errorOrMessage as Record<string, unknown>).name || "");
  }

  const combined = `${name} ${message}`.toLowerCase();

  return (
    combined.includes("chunkloaderror") ||
    combined.includes("loading chunk") ||
    combined.includes("failed to fetch dynamically imported module") ||
    combined.includes("error loading dynamically imported module") ||
    combined.includes("is not executable, and strict mime type checking is enabled") ||
    combined.includes("text/html")
  );
}

/**
 * Perform a clean cache wipe and page reload.
 */
async function performCleanReload() {
  const lastRetry = sessionStorage.getItem(RETRY_KEY);
  const now = Date.now();

  if (lastRetry && now - Number(lastRetry) < RETRY_COOLDOWN_MS) {
    console.warn("[ChunkRecovery] Cooldown active, skipping auto-reload to avoid loop.");
    return;
  }

  sessionStorage.setItem(RETRY_KEY, String(now));
  console.info("[ChunkRecovery] Detected outdated chunk or asset 404, cleaning caches and reloading...");

  try {
    // 1. Wipe caches if Cache Storage API is available
    if ("caches" in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((k) => caches.delete(k)));
    }
  } catch (err) {
    console.warn("[ChunkRecovery] Failed to clear caches before reload:", err);
  }

  // 2. Hard reload the page to get the latest HTML and JS chunks
  window.location.reload();
}

/**
 * Global component that intercepts ChunkLoadErrors and automatically reloads
 * the application when an outdated deploy bundle is detected.
 */
export function ChunkErrorRecovery() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Intercept unhandled window errors (script tags / network load errors)
    const handleError = (event: ErrorEvent) => {
      if (isChunkLoadingError(event.error || event.message)) {
        event.preventDefault?.();
        void performCleanReload();
      }
    };

    // 2. Intercept unhandled promise rejections (dynamic import() failures)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadingError(event.reason)) {
        event.preventDefault?.();
        void performCleanReload();
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
