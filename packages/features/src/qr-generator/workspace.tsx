import React, { useRef, useState } from "react"
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react"
import { Download, RotateCcw } from "lucide-react"
import { Button, SecondaryButton } from "@imify/ui"
import { useQrGeneratorStore } from "@imify/stores"
import { encodeQrData } from "./qr-encoder"
import { downloadWithFilename } from "../processor/processor-utils"
import { useToast } from "@imify/core/hooks/use-toast"

export function QrGeneratorWorkspace() {
  const {
    type,
    data,
    size,
    bgColor,
    fgColor,
    includeLogo,
    logoUrl,
    logoWidth,
    logoHeight,
    excavateLogo,
    errorCorrectionLevel,
    resetToDefault
  } = useQrGeneratorStore()

  const { success, error } = useToast()
  const [isDownloading, setIsDownloading] = useState(false)

  // Encode the current state's field values to the standard raw string
  const rawQrValue = encodeQrData(type, data[type])

  const downloadSVG = async () => {
    try {
      setIsDownloading(true)
      const svgElement = document.getElementById("imify-qr-svg")
      if (!svgElement) {
        throw new Error("SVG element not found")
      }

      const svgString = new XMLSerializer().serializeToString(svgElement)
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
      
      await downloadWithFilename(blob, `imify-qr-${type}.svg`)
      success("Export Successful", "QR code downloaded as SVG")
    } catch (err) {
      error("Export Failed", "Could not download the QR code as SVG")
    } finally {
      setIsDownloading(false)
    }
  }

  const downloadPNG = async () => {
    try {
      setIsDownloading(true)
      const canvas = document.getElementById("imify-qr-canvas") as HTMLCanvasElement
      if (!canvas) {
        throw new Error("Canvas element not found")
      }

      // Convert canvas to blob to use standard download utility
      canvas.toBlob(async (blob) => {
        if (blob) {
          await downloadWithFilename(blob, `imify-qr-${type}.png`)
          success("Export Successful", "QR code downloaded as PNG")
        } else {
          error("Export Failed", "Could not export canvas to blob")
        }
        setIsDownloading(false)
      }, "image/png")
    } catch (err) {
      error("Export Failed", "Could not download the QR code as PNG")
      setIsDownloading(false)
    }
  }

  const downloadWebP = async () => {
    try {
      setIsDownloading(true)
      const canvas = document.getElementById("imify-qr-canvas") as HTMLCanvasElement
      if (!canvas) {
        throw new Error("Canvas element not found")
      }

      canvas.toBlob(async (blob) => {
        if (blob) {
          await downloadWithFilename(blob, `imify-qr-${type}.webp`)
          success("Export Successful", "QR code downloaded as WebP")
        } else {
          error("Export Failed", "Could not export canvas to blob")
        }
        setIsDownloading(false)
      }, "image/webp", 1.0)
    } catch (err) {
      error("Export Failed", "Could not download the QR code as WebP")
      setIsDownloading(false)
    }
  }

  // Check if QR code is empty or has content to preview
  const hasContent = rawQrValue.trim().length > 0

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900/40">
      {/* Workspace Header actions */}
      <div className="shrink-0 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 py-3.5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">QR Generator Preview</span>
          {hasContent && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 text-2xs font-medium text-emerald-700 dark:text-emerald-300">
              Ready
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <SecondaryButton
            onClick={resetToDefault}
            className="text-xs h-8 flex items-center gap-1.5 px-3"
          >
            <RotateCcw size={13} />
            <span>Reset Settings</span>
          </SecondaryButton>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-0 overflow-y-auto">
        {hasContent ? (
          <div className="flex flex-col items-center justify-center space-y-6 max-w-sm w-full">
            {/* Visual QR Container */}
            <div
              className="relative p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl flex flex-col items-center justify-center aspect-square w-full"
              style={{
                // Checkerboard background in case QR background color is transparent
                backgroundImage: bgColor === "transparent" || bgColor.startsWith("rgba(0,0,0,0)") 
                  ? "linear-gradient(45deg, #efefef 25%, transparent 25%), linear-gradient(-45deg, #efefef 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #efefef 75%), linear-gradient(-45deg, transparent 75%, #efefef 75%)"
                  : undefined,
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px"
              }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <QRCodeSVG
                  id="imify-qr-svg"
                  value={rawQrValue}
                  size={Math.min(size, 280)}
                  bgColor={bgColor === "transparent" ? "rgba(0,0,0,0)" : bgColor}
                  fgColor={fgColor}
                  level={errorCorrectionLevel}
                  imageSettings={
                    includeLogo && logoUrl
                      ? {
                          src: logoUrl,
                          height: logoHeight,
                          width: logoWidth,
                          excavate: excavateLogo
                        }
                      : undefined
                  }
                  className="max-h-full max-w-full"
                />
              </div>

              {/* Hidden Canvas used for PNG & WebP rendering/downloading */}
              <div className="hidden">
                <QRCodeCanvas
                  id="imify-qr-canvas"
                  value={rawQrValue}
                  size={size}
                  bgColor={bgColor === "transparent" ? "rgba(0,0,0,0)" : bgColor}
                  fgColor={fgColor}
                  level={errorCorrectionLevel}
                  imageSettings={
                    includeLogo && logoUrl
                      ? {
                          src: logoUrl,
                          height: logoHeight,
                          width: logoWidth,
                          excavate: excavateLogo
                        }
                      : undefined
                  }
                />
              </div>
            </div>

            {/* Download and Export Buttons */}
            <div className="w-full grid grid-cols-3 gap-2">
              <Button
                onClick={downloadPNG}
                disabled={isDownloading}
                className="text-xs h-9 flex items-center justify-center gap-1.5"
              >
                <Download size={14} />
                <span>PNG</span>
              </Button>
              <Button
                onClick={downloadSVG}
                disabled={isDownloading}
                className="text-xs h-9 flex items-center justify-center gap-1.5"
              >
                <Download size={14} />
                <span>SVG</span>
              </Button>
              <Button
                onClick={downloadWebP}
                disabled={isDownloading}
                className="text-xs h-9 flex items-center justify-center gap-1.5"
              >
                <Download size={14} />
                <span>WebP</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 max-w-sm rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 shadow-sm">
            <div className="h-12 w-12 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500 mb-4">
              <Download size={22} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
              No QR Content
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px]">
              Fill in the data fields in the sidebar to generate and preview your custom QR code.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
