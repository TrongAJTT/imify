import { useCallback } from "react"

/**
 * Hook for handling navigation within the Imify ecosystem (Web & Extension).
 * Automatically detects the environment and uses the appropriate method (chrome.tabs or window.open).
 */
export function useImifyNavigation() {
  const openSingleProcessor = useCallback(() => {
    // Check if running in a browser extension context
    const isExtension = typeof chrome !== "undefined" && !!chrome.tabs?.create && !!chrome.runtime?.getURL

    if (isExtension) {
      // In extension, open the options page with the single processor tab active
      void chrome.tabs.create({
        url: chrome.runtime.getURL("options.html?tab=single")
      })
    } else {
      // On web, open the dedicated path in a new tab
      window.open("/single-processor", "_blank")
    }
  }, [])

  return {
    openSingleProcessor
  }
}
