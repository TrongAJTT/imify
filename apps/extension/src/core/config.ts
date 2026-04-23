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
}
