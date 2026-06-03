import React, { useEffect, useRef, useState } from "react"
import jsQR from "jsqr"
import { Camera, Upload, Scan, RotateCcw, ShieldCheck } from "lucide-react"
import { EmptyDropCard, SegmentedControl, Button, SecondaryButton } from "@imify/ui"
import { useQrReaderStore } from "@imify/stores"
import { COMMON_IMAGE_ACCEPT_WITH_SVG, isCommonImageFile } from "../shared/image-file-utils"
import { useToast } from "@imify/core/hooks/use-toast"

export function QrReaderWorkspace() {
  const {
    activeTab,
    setActiveTab,
    hasCamera,
    setHasCamera,
    lastScanResult,
    setLastScanResult
  } = useQrReaderStore()

  const { success, error, warning } = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // 1. Detect if camera is available
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then((devices) => {
          const hasCam = devices.some((device) => device.kind === "videoinput")
          setHasCamera(hasCam)
          if (!hasCam && activeTab === "camera") {
            setActiveTab("import")
          }
        })
        .catch(() => {
          setHasCamera(false)
          if (activeTab === "camera") {
            setActiveTab("import")
          }
        })
    } else {
      setHasCamera(false)
      if (activeTab === "camera") {
        setActiveTab("import")
      }
    }
  }, [setHasCamera, activeTab, setActiveTab])

  // Helper to stop camera tracks
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
      setCameraStream(null)
    }
  }

  // 2. Manage camera stream activation
  useEffect(() => {
    let active = true

    if (activeTab === "camera" && !lastScanResult) {
      setCameraError(null)
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          if (!active) {
            stream.getTracks().forEach((t) => t.stop())
            return
          }
          setCameraStream(stream)
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        })
        .catch((err) => {
          if (!active) return
          console.error("Camera access failed:", err)
          setCameraError("Camera access denied or unavailable. Please check permissions.")
          warning("Camera Error", "Could not access the camera. Switched to File Import.")
          setActiveTab("import")
        })
    } else {
      stopCamera()
    }

    return () => {
      active = false
      stopCamera()
    }
  }, [activeTab, lastScanResult])

  // 3. Scan loop for camera video stream
  useEffect(() => {
    let animationFrameId: number
    let active = true

    const scanFrame = () => {
      if (!active) return

      const video = videoRef.current
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement("canvas")
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext("2d")

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert"
          })

          if (code && code.data) {
            setLastScanResult(code.data)
            success("Scanned successfully", "QR Code decoded!")
            stopCamera()
            return // Stop loop
          }
        }
      }

      animationFrameId = requestAnimationFrame(scanFrame)
    }

    if (activeTab === "camera" && cameraStream && !lastScanResult) {
      animationFrameId = requestAnimationFrame(scanFrame)
    }

    return () => {
      active = false
      cancelAnimationFrame(animationFrameId)
    }
  }, [activeTab, cameraStream, lastScanResult, setLastScanResult, success])

  // 4. File import scan logic (PNG & SVG)
  const handleScanFile = (file: File) => {
    setIsAnalyzing(true)
    const reader = new FileReader()

    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result !== "string") {
        setIsAnalyzing(false)
        return
      }

      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")

        if (ctx) {
          ctx.drawImage(img, 0, 0)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(imageData.data, imageData.width, imageData.height)

          if (code && code.data) {
            setLastScanResult(code.data)
            success("Scanned successfully", "QR Code decoded from image file!")
          } else {
            error("Scan Failed", "No valid QR code was detected in the uploaded image.")
          }
        }
        setIsAnalyzing(false)
      }
      img.onerror = () => {
        error("Error", "Could not load image file.")
        setIsAnalyzing(false)
      }
      img.src = result
    }

    reader.readAsDataURL(file)
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (isCommonImageFile(file) || file.name.toLowerCase().endsWith(".svg")) {
      handleScanFile(file)
    } else {
      error("Unsupported Format", "Please upload a valid image or SVG file.")
    }
  }

  const tabOptions = [
    { value: "import" as const, label: "File Import", icon: <Upload size={13} /> },
    ...(hasCamera !== false ? [{ value: "camera" as const, label: "Camera Scan", icon: <Camera size={13} /> }] : [])
  ]

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900/40">
      {/* Workspace Header Actions */}
      <div className="shrink-0 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 py-3 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">QR Code Reader</span>
          <SegmentedControl
            value={activeTab}
            options={tabOptions}
            onChange={(val) => setActiveTab(val)}
            colorTheme="blue"
          />
        </div>
        {lastScanResult && (
          <div className="flex items-center gap-2">
            <SecondaryButton
              onClick={() => setLastScanResult(null)}
              className="text-xs h-8 flex items-center gap-1.5 px-3"
            >
              <RotateCcw size={13} />
              <span>Scan Again</span>
            </SecondaryButton>
          </div>
        )}
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-0 overflow-y-auto">
        {lastScanResult ? (
          <div className="flex flex-col items-center justify-center text-center p-8 max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl">
            <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500 mb-4 animate-bounce">
              <ShieldCheck size={26} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
              QR Code Scanned
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-[280px]">
              The contents have been successfully decoded. Check the sidebar for details and quick actions.
            </p>
            <Button
              onClick={() => setLastScanResult(null)}
              className="text-xs py-1.5 h-8 px-6"
            >
              Scan Another QR Code
            </Button>
          </div>
        ) : activeTab === "camera" ? (
          <div className="relative w-full max-w-md aspect-square rounded-2xl border border-slate-200 dark:border-slate-800 bg-black overflow-hidden shadow-2xl flex items-center justify-center">
            {cameraError ? (
              <div className="p-6 text-center text-xs text-rose-500 dark:text-rose-400">
                {cameraError}
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Scanner viewfinder box with laser scanning line */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-dashed border-sky-400/80 rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
                    {/* Pulsing Corner brackets */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-sky-400 rounded-tl"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-sky-400 rounded-tr"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-sky-400 rounded-bl"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-sky-400 rounded-br"></div>
                    {/* Laser sweep animation line */}
                    <div className="absolute left-0 right-0 h-0.5 bg-sky-400/80 shadow-[0_0_8px_#38bdf8] animate-[scan_2s_ease-in-out_infinite] top-0"></div>
                  </div>
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="inline-flex rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
                    Align QR code within the dashed frame to scan
                  </span>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="w-full max-w-lg">
            <EmptyDropCard
              icon={<Scan size={32} className="text-blue-500/80 dark:text-blue-400" />}
              title={isAnalyzing ? "Analyzing Image..." : "Upload QR Code Image"}
              subtitle="Drag & drop a PNG, JPG, or SVG containing a QR code, or click to browse"
              onDropFiles={handleFiles}
              fileInput={{
                accept: COMMON_IMAGE_ACCEPT_WITH_SVG,
                onInputFiles: handleFiles
              }}
            />
          </div>
        )}
      </div>

      {/* Add slide down animation styling to head dynamically if it doesn't exist */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 1; }
          100% { top: 0%; opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}
