import React, { useEffect, useRef, useState, useMemo } from "react";
import jsQR from "jsqr";
import {
  Camera,
  Upload,
  Scan,
  RotateCcw,
  ShieldCheck,
  Monitor,
  Copy,
  ArrowLeft,
  Clock,
} from "lucide-react";
import {
  Button,
  Subheading,
  MutedText,
  Kicker,
  TextArea,
  ToastContainer,
  Tooltip,
  cn,
  LabelText,
} from "@imify/ui";
import { useQrReaderStore } from "@imify/stores";
import {
  COMMON_IMAGE_ACCEPT_WITH_SVG,
  isCommonImageFile,
} from "../shared/image-file-utils";
import { useToast } from "@imify/core/hooks/use-toast";
import { useTranslation } from "@imify/i18n";
import { useClipboardImageIntake } from "../shared/use-clipboard-image-intake";
import { QrActionsPanel } from "./qr-actions-panel";

function decodeUtf8String(str: string): string {
  try {
    return decodeURIComponent(escape(str));
  } catch (e) {
    return str;
  }
}

// Helper function to extract and crop the QR code image from a source canvas
function extractQrImage(
  canvas: HTMLCanvasElement,
  location: {
    topLeftCorner: { x: number; y: number };
    topRightCorner: { x: number; y: number };
    bottomLeftCorner: { x: number; y: number };
    bottomRightCorner: { x: number; y: number };
  },
): string {
  const minX = Math.min(
    location.topLeftCorner.x,
    location.bottomLeftCorner.x,
    location.topRightCorner.x,
    location.bottomRightCorner.x,
  );
  const maxX = Math.max(
    location.topLeftCorner.x,
    location.bottomLeftCorner.x,
    location.topRightCorner.x,
    location.bottomRightCorner.x,
  );
  const minY = Math.min(
    location.topLeftCorner.y,
    location.bottomLeftCorner.y,
    location.topRightCorner.y,
    location.bottomRightCorner.y,
  );
  const maxY = Math.max(
    location.topLeftCorner.y,
    location.bottomLeftCorner.y,
    location.topRightCorner.y,
    location.bottomRightCorner.y,
  );

  const padding = 12;
  const cropX = Math.max(0, minX - padding);
  const cropY = Math.max(0, minY - padding);
  const cropW = Math.min(canvas.width - cropX, maxX - minX + padding * 2);
  const cropH = Math.min(canvas.height - cropY, maxY - minY + padding * 2);

  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = cropW;
  cropCanvas.height = cropH;
  const cropCtx = cropCanvas.getContext("2d");
  if (cropCtx) {
    cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    return cropCanvas.toDataURL("image/png");
  }
  return canvas.toDataURL("image/png");
}

function scanQrCodeWithPreprocessing(
  canvas: HTMLCanvasElement,
  inversionAttempts:
    | "dontInvert"
    | "onlyInvert"
    | "attemptBoth"
    | "invertFirst" = "attemptBoth",
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const w = canvas.width;
  const h = canvas.height;

  // Attempt 1: Raw Scan
  let imageData = ctx.getImageData(0, 0, w, h);
  let code = jsQR(imageData.data, w, h, { inversionAttempts });
  if (code && code.data) {
    return { code, canvas };
  }

  // Attempt 2: Scale Down if too large (> 1000px)
  if (w > 1000 || h > 1000) {
    const maxDim = 800;
    const scale = Math.min(maxDim / w, maxDim / h);
    const scaledW = Math.round(w * scale);
    const scaledH = Math.round(h * scale);

    const scaledCanvas = document.createElement("canvas");
    scaledCanvas.width = scaledW;
    scaledCanvas.height = scaledH;
    const scaledCtx = scaledCanvas.getContext("2d");
    if (scaledCtx) {
      scaledCtx.drawImage(canvas, 0, 0, scaledW, scaledH);
      const scaledData = scaledCtx.getImageData(0, 0, scaledW, scaledH);
      code = jsQR(scaledData.data, scaledW, scaledH, { inversionAttempts });
      if (code && code.data) {
        return { code, canvas: scaledCanvas };
      }
    }
  }

  const applyThreshold = (imgData: ImageData, thresh: number) => {
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const v = gray >= thresh ? 255 : 0;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
    }
  };

  // Attempt 3: Binarization (Threshold 128)
  const prepCanvas = document.createElement("canvas");
  prepCanvas.width = w;
  prepCanvas.height = h;
  const prepCtx = prepCanvas.getContext("2d");
  if (prepCtx) {
    prepCtx.putImageData(imageData, 0, 0);
    const prepData = prepCtx.getImageData(0, 0, w, h);
    applyThreshold(prepData, 128);
    prepCtx.putImageData(prepData, 0, 0);
    code = jsQR(prepData.data, w, h, { inversionAttempts });
    if (code && code.data) {
      return { code, canvas: prepCanvas };
    }
  }

  // Attempt 4: Binarization (Threshold 180)
  if (prepCtx) {
    const prepData = ctx.getImageData(0, 0, w, h);
    applyThreshold(prepData, 180);
    prepCtx.putImageData(prepData, 0, 0);
    code = jsQR(prepData.data, w, h, { inversionAttempts });
    if (code && code.data) {
      return { code, canvas: prepCanvas };
    }
  }

  // Attempt 5: Binarization (Threshold 80)
  if (prepCtx) {
    const prepData = ctx.getImageData(0, 0, w, h);
    applyThreshold(prepData, 80);
    prepCtx.putImageData(prepData, 0, 0);
    code = jsQR(prepData.data, w, h, { inversionAttempts });
    if (code && code.data) {
      return { code, canvas: prepCanvas };
    }
  }

  return null;
}

export function QrReaderWorkspace() {
  const { t } = useTranslation("qrReader");
  const {
    hasCamera,
    setHasCamera,
    lastScanResult,
    setLastScanResult,
    savedHistory,
    saveToHistory,
  } = useQrReaderStore();

  const { toasts, success, error, hide } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scannedQrImage, setScannedQrImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isScreenShare, setIsScreenShare] = useState(false);
  const [hasDisplayMedia, setHasDisplayMedia] = useState(true);

  // 1. Detect if camera and screen capture are available
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.mediaDevices) {
      // Check camera
      if (navigator.mediaDevices.enumerateDevices) {
        navigator.mediaDevices
          .enumerateDevices()
          .then((devices) => {
            const hasCam = devices.some(
              (device) => device.kind === "videoinput",
            );
            setHasCamera(hasCam);
          })
          .catch(() => {
            setHasCamera(false);
          });
      }

      // Check screen capture support (getDisplayMedia)
      setHasDisplayMedia(!!navigator.mediaDevices.getDisplayMedia);
    } else {
      setHasCamera(false);
      setHasDisplayMedia(false);
    }
  }, [setHasCamera]);

  // Bind stream to video element when it becomes available
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Clean up media tracks on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Helper to stop camera/screen capture tracks
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  // 2. Start Camera Scan immediately
  const startCameraScan = () => {
    setCameraError(null);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        setCameraStream(stream);
        setIsScreenShare(false);
        success(t("workspace.cameraStarted"), t("workspace.cameraAlign"));
      })
      .catch((err) => {
        console.error("Camera access failed:", err);
        setCameraError(t("workspace.cameraDenied"));
        error(t("workspace.cameraError"), t("workspace.cameraFail"));
      });
  };

  // 3. Start Screen Capture immediately
  const startScreenCapture = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      setCameraStream(stream);
      setIsScreenShare(true);
      success(t("workspace.screenStarted"), t("workspace.screenSelect"));
    } catch (err) {
      console.error("DisplayMedia capture failed:", err);
      error(t("workspace.captureFailed"), t("workspace.captureError"));
    }
  };

  // 4. Scan loop for camera & screen capture video stream
  useEffect(() => {
    let animationFrameId: number;
    let active = true;

    const scanFrame = () => {
      if (!active) return;

      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const result = scanQrCodeWithPreprocessing(canvas, "dontInvert");

          if (result && result.code && result.code.data) {
            const { code, canvas: decodedCanvas } = result;
            setLastScanResult(decodeUtf8String(code.data));
            success(
              t("workspace.scannedSuccess"),
              t("workspace.decodedSuccess"),
            );

            // Extract QR image using helper function
            setScannedQrImage(extractQrImage(decodedCanvas, code.location));
            stopCamera();
            return; // Stop loop
          }
        }
      }

      animationFrameId = requestAnimationFrame(scanFrame);
    };

    if (cameraStream && !lastScanResult) {
      animationFrameId = requestAnimationFrame(scanFrame);
    }

    return () => {
      active = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [cameraStream, lastScanResult, setLastScanResult, success]);

  // 5. File import scan logic (PNG & SVG)
  const handleScanFile = (file: File) => {
    setIsAnalyzing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result !== "string") {
        setIsAnalyzing(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const result = scanQrCodeWithPreprocessing(canvas, "attemptBoth");

          if (result && result.code && result.code.data) {
            const { code, canvas: decodedCanvas } = result;
            setLastScanResult(decodeUtf8String(code.data));
            success(
              t("workspace.scannedSuccess"),
              t("workspace.decodedFileSuccess"),
            );

            // Extract QR image using helper function
            setScannedQrImage(extractQrImage(decodedCanvas, code.location));
          } else {
            error(t("workspace.scanFailed"), t("workspace.noQrDetected"));
          }
        }
        setIsAnalyzing(false);
      };
      img.onerror = () => {
        error(t("workspace.errorHeader"), t("workspace.loadFailed"));
        setIsAnalyzing(false);
      };
      img.src = result;
    };

    reader.readAsDataURL(file);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (isCommonImageFile(file) || file.name.toLowerCase().endsWith(".svg")) {
      handleScanFile(file);
    } else {
      error(t("workspace.unsupportedFormat"), t("workspace.uploadValid"));
    }
  };

  useClipboardImageIntake({
    onImages: (images) => {
      if (images.length > 0) {
        handleScanFile(images[0]);
      }
    },
    onError: (msg) => {
      error(t("workspace.errorHeader"), msg);
    },
    mode: "single",
    enabled: !cameraStream,
  });

  const copyRawContent = () => {
    if (!lastScanResult) return;
    navigator.clipboard
      .writeText(lastScanResult)
      .then(() => {
        setCopied(true);
        success(t("workspace.copied"), t("workspace.copiedSuccess"));
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        error(t("workspace.errorHeader"), t("workspace.copyFailed"));
      });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const cardItems = [
    {
      id: "import",
      title: t("workspace.import.title"),
      description: t("workspace.import.description"),
      icon: <Upload size={32} />,
      styles: {
        borderHover: "hover:border-blue-500/50 hover:shadow-blue-500/5",
        iconBg:
          "bg-blue-50 dark:bg-blue-950/30 text-blue-500 dark:text-blue-400 group-hover:bg-blue-500",
      },
      onClick: () => fileInputRef.current?.click(),
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
    {
      id: "camera",
      title: t("workspace.camera.title"),
      description:
        hasCamera === false
          ? t("workspace.camera.noDevice")
          : t("workspace.camera.description"),
      icon: <Camera size={32} />,
      styles: {
        borderHover: "hover:border-emerald-500/50 hover:shadow-emerald-500/5",
        iconBg:
          "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 dark:text-emerald-400 group-hover:bg-emerald-500",
      },
      onClick: startCameraScan,
      disabled: hasCamera === false,
    },
    {
      id: "screen",
      title: t("workspace.screen.title"),
      description: t("workspace.screen.description"),
      icon: <Monitor size={32} />,
      styles: {
        borderHover: "hover:border-indigo-500/50 hover:shadow-indigo-500/5",
        iconBg:
          "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 dark:text-indigo-400 group-hover:bg-indigo-500",
      },
      onClick: startScreenCapture,
    },
  ].filter((item) => item.id !== "screen" || hasDisplayMedia);

  const isAlreadySaved = useMemo(() => {
    if (!lastScanResult) return false;
    return savedHistory.some((item) => item.raw === lastScanResult);
  }, [savedHistory, lastScanResult]);

  return (
    <div className="flex-1 flex flex-col h-full gap-3 overflow-hidden animate-in fade-in duration-300">
      {/* Workspace Header Actions */}
      <div className="shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Subheading>{t("workspace.heading")}</Subheading>
          {!lastScanResult && cameraStream && (
            <Button
              variant="secondary"
              onClick={stopCamera}
              className="text-xs h-8 flex items-center gap-1.5 px-3 animate-in fade-in-50 slide-in-from-left-4 duration-300"
            >
              <ArrowLeft size={13} />
              {t("workspace.stopScanning")}
            </Button>
          )}
        </div>
        {lastScanResult && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setLastScanResult(null);
                setScannedQrImage(null);
              }}
              className="text-xs h-8 flex items-center gap-1.5 px-3"
            >
              <RotateCcw size={13} />
              {t("workspace.scanAgain")}
            </Button>
          </div>
        )}
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col items-center justify-center p-1 min-h-0 overflow-y-auto w-full h-full">
        {lastScanResult ? (
          <div className="w-full max-w-2xl bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 flex flex-col md:flex-row gap-6 items-start animate-in zoom-in-95 duration-200">
            {/* Left: Extracted QR Code Image & Refresh/Save buttons */}
            <div className="flex flex-col items-center gap-4 shrink-0 w-full md:w-auto">
              <div className="flex flex-col items-center gap-2">
                <Kicker>{t("workspace.extractedCode")}</Kicker>
                <div className="h-40 w-40 border border-slate-200 dark:border-slate-855 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 flex items-center justify-center shadow-inner">
                  {scannedQrImage ? (
                    <img
                      src={scannedQrImage}
                      alt="Decoded QR Code"
                      className="max-h-full max-w-full object-contain rounded-md select-none"
                    />
                  ) : (
                    <Scan
                      size={40}
                      className="text-slate-300 dark:text-slate-700 animate-pulse"
                    />
                  )}
                </div>
              </div>

              {/* Action Buttons (Strictly aligned heights using Button element) */}
              <div className="flex flex-row md:flex-col gap-2 w-full">
                <Button
                  onClick={() => {
                    setLastScanResult(null);
                    setScannedQrImage(null);
                  }}
                  className="flex-1 text-xs py-2 px-4 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  {t("workspace.scanAnother")}
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => {
                    saveToHistory(lastScanResult);
                    success(t("history.title"), t("history.saveSuccess"));
                  }}
                  disabled={isAlreadySaved}
                  className="flex-1 text-xs py-2 px-4 flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-800"
                >
                  <Clock size={14} />
                  <span>
                    {isAlreadySaved
                      ? t("history.saved")
                      : t("history.saveToHistory")}
                  </span>
                </Button>
              </div>
            </div>

            {/* Right: Raw Data and Available Actions */}
            <div className="flex-1 flex flex-col gap-4 w-full">
              <div className="relative group flex flex-col w-full">
                <TextArea
                  readOnly
                  label={t("workspace.rawData")}
                  value={lastScanResult}
                  onChange={() => {}}
                  rows={4}
                  className="w-full text-xs"
                />
                <Tooltip content={t("workspace.copyRaw")}>
                  <button
                    type="button"
                    onClick={copyRawContent}
                    className="absolute right-2.5 bottom-3 h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 shadow-sm transition-all active:scale-95"
                  >
                    {copied ? (
                      <ShieldCheck size={13} className="text-emerald-500" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                </Tooltip>
              </div>

              {/* Available Actions (Moved from sidepanel) */}
              <div className="mt-1">
                <LabelText className="text-xs mb-2">
                  {t("sidebar.detailsAndActions")}
                </LabelText>
                <QrActionsPanel raw={lastScanResult} />
              </div>
            </div>
          </div>
        ) : cameraStream ? (
          <div className="relative w-full max-w-2xl aspect-video md:aspect-square rounded-2xl border border-slate-200 dark:border-slate-800 bg-black overflow-hidden shadow-2xl flex items-center justify-center animate-in zoom-in-95 duration-300">
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
                  <MutedText className="inline-flex rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm border-0">
                    {isScreenShare
                      ? t("workspace.alignWindow")
                      : t("workspace.alignQr")}
                  </MutedText>
                </div>
              </>
            )}
          </div>
        ) : (
          <div
            className={cn(
              "grid grid-cols-1 gap-6 w-full h-full min-h-0 max-w-6xl animate-in fade-in duration-300",
              cardItems.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2",
            )}
          >
            {cardItems.map((item) => (
              <button
                key={item.id}
                onClick={item.onClick}
                onDragOver={item.onDragOver}
                onDrop={item.onDrop}
                disabled={item.disabled}
                className={`flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-all duration-300 group hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] w-full h-full ${
                  item.styles.borderHover
                } ${item.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div
                  className={`h-20 w-20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:text-white transition-all duration-300 shadow-sm ${item.styles.iconBg}`}
                >
                  {item.icon}
                </div>
                <Subheading className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  {item.title}
                </Subheading>
                <MutedText className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[240px]">
                  {item.description}
                </MutedText>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hidden File Input for Card click triggers */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFiles(e.target.files)}
        accept={COMMON_IMAGE_ACCEPT_WITH_SVG}
        className="hidden"
      />

      <ToastContainer toasts={toasts} onRemove={hide} />
    </div>
  );
}
