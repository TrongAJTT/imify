"use client"

import { Button } from "@imify/ui/ui/button"
import { Tooltip } from "@imify/features/shared/tooltip"
import { Github } from "lucide-react"

export function ExtensionDownloadButtons() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 pt-8">
      <Tooltip
        label="Chrome Web Store"
        content="Install the stable version for Google Chrome. Recommended for most users."
        variant="wide1"
      >
        <a
          href="https://chromewebstore.google.com/detail/imify-powerful-image-tool/ilhbmbkcakhlelcifilnlcmpklkafabg"
          target="_blank"
          rel="noopener noreferrer"
          className="block transition-transform hover:scale-105 active:scale-95 drop-shadow-sm hover:drop-shadow-md"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://cdn.trongajtt.com/assets/get-on-chrome.webp" alt="Get on Chrome Web Store" className="h-14 w-auto" />
        </a>
      </Tooltip>

      <Tooltip
        label="Microsoft Edge Add-ons"
        content="Install the stable build for Microsoft Edge with the same core extension features."
        variant="wide1"
      >
        <a
          href="https://microsoftedge.microsoft.com/addons/detail/jgdgjoioljlhigbnifkjeniojoeianfm"
          target="_blank"
          rel="noopener noreferrer"
          className="block transition-transform hover:scale-105 active:scale-95 drop-shadow-sm hover:drop-shadow-md"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://cdn.trongajtt.com/assets/get-on-edge.webp" alt="Get on Microsoft Edge Add-ons" className="h-14 w-auto" />
        </a>
      </Tooltip>

      <Tooltip
        label="Firefox Add-ons"
        content="Install the stable version for Firefox to use context menu tools and extension-exclusive workflows."
        variant="wide1"
      >
        <a
          href="https://addons.mozilla.org/en-US/firefox/addon/imify-save-process-images"
          target="_blank"
          rel="noopener noreferrer"
          className="block transition-transform hover:scale-105 active:scale-95 drop-shadow-sm hover:drop-shadow-md"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://cdn.trongajtt.com/assets/get-on-firefox.webp" alt="Get on Firefox Add-ons" className="h-14 w-auto" />
        </a>
      </Tooltip>

      <Tooltip
        label="GitHub Releases"
        content="Try the newest builds early (including experimental updates if available), or pick any specific version you want from the release list."
        variant="wide2"
      >
        <Button variant="outline" className="h-14 font-semibold border-slate-200 dark:border-slate-800 transition-transform hover:scale-105 active:scale-95 px-5" asChild>
          <a href="https://github.com/TrongAJTT/imify/releases" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
            <Github className="h-8 w-8 shrink-0" />
            <div className="text-left leading-tight">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Download from</div>
              <div className="text-sm">GitHub Releases</div>
            </div>
          </a>
        </Button>
      </Tooltip>
    </div>
  )
}
