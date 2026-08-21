export const APP_CONFIG = {
  BATCH: {
    // Show download warning if user tries to download MORE than this number of items at once
    DOWNLOAD_CONFIRM_THRESHOLD: 4, 
    
    // Recommended total megabytes in batch memory before showing OOM warning
    OOM_WARNING_MB: 350,
    
    // Max file size for a single input in megabytes
    MAX_FILE_SIZE_MB: 30,
  },
  /** Image Splicing – preview pane */
  SPLICING: {
    /** When choosing preview quality ≥50%, warn if image count exceeds this */
    HEAVY_PREVIEW_QUALITY_WARNING_IMAGE_COUNT: 20,
    /** When choosing preview quality ≥50%, warn if sum(width×height) exceeds this (px²) */
    HEAVY_PREVIEW_QUALITY_WARNING_TOTAL_PIXELS: 80_000_000,
  },
  /** PDF Studio */
  PDF_STUDIO: {
    PAGE_SIZE_DESKTOP: 36,
    PAGE_SIZE_MOBILE: 24,
    LAZY_LOAD_PAGING_DESKTOP: false,
    LAZY_LOAD_PAGING_MOBILE: true,
  },
};

/** Default initial canvas/preview height across all tool workspaces */
export const CANVAS_INITIAL_HEIGHT_VH = 65;
export const CANVAS_INITIAL_HEIGHT_STYLE = "65vh";
export const CANVAS_MIN_HEIGHT_PX = 200;

/**
 * Calculates initial canvas/preview height in pixels based on viewport height (80vh).
 * Safely falls back to a sensible pixel default when executed on SSR / without window.
 */
export function getInitialCanvasHeightPx(fallbackPx = 680): number {
  if (typeof window !== "undefined" && window.innerHeight > 0) {
    return Math.max(
      CANVAS_MIN_HEIGHT_PX,
      Math.round((window.innerHeight * CANVAS_INITIAL_HEIGHT_VH) / 100)
    );
  }
  return fallbackPx;
}

