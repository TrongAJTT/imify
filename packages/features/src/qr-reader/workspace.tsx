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
  ExternalLink,
  Mail,
  Phone,
  MessageSquare,
  Wifi,
  User,
  Calendar,
  MessageCircle,
  FileText,
  Eye,
  EyeOff,
  HelpCircle,
  MapPin,
  AlignLeft,
  Printer,
} from "lucide-react";
import {
  Button,
  SecondaryButton,
  Subheading,
  MutedText,
  Kicker,
  TextArea,
  ToastContainer,
  Tooltip,
  cn,
} from "@imify/ui";
import { useQrReaderStore, useWorkspaceHeaderStore } from "@imify/stores";
import {
  COMMON_IMAGE_ACCEPT_WITH_SVG,
  isCommonImageFile,
} from "../shared/image-file-utils";
import { useToast } from "@imify/core/hooks/use-toast";
import { useTranslation } from "@imify/i18n";
import { useClipboardImageIntake } from "../shared/use-clipboard-image-intake";
import { parseQrString, formatICalDateForDisplay } from "./qr-parser";

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
  inversionAttempts: "dontInvert" | "onlyInvert" | "attemptBoth" | "invertFirst" = "attemptBoth"
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

// ---------------------------------------------------------------------------
// Small reusable field row
// ---------------------------------------------------------------------------
function FieldRow({
  icon,
  label,
  value,
  mono = false,
  onClick,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  onClick?: () => void;
}) {
  return (
    <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
      {icon && (
        <span className="mt-0.5 text-slate-400 shrink-0">{icon}</span>
      )}
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
          {label}
        </span>
        <span
          className={`text-xs font-medium select-all break-all leading-snug ${
            onClick
              ? "text-blue-500 hover:underline cursor-pointer"
              : "text-slate-800 dark:text-slate-200"
          } ${mono ? "font-mono" : ""}`}
          onClick={onClick}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

const PLATFORM_META: Record<
  string,
  { label: string; color: string; iconColor: string }
> = {
  whatsapp: {
    label: "WhatsApp",
    color:
      "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
    iconColor: "text-green-500",
  },
  telegram: {
    label: "Telegram",
    color:
      "bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800",
    iconColor: "text-sky-500",
  },
  zalo: {
    label: "Zalo",
    color:
      "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-500",
  },
};

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
  const [showPassword, setShowPassword] = useState(false);

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
            setLastScanResult(code.data);
            success(t("workspace.scannedSuccess"), t("workspace.decodedSuccess"));

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
            setLastScanResult(code.data);
            success(t("workspace.scannedSuccess"), t("workspace.decodedFileSuccess"));

            // Extract QR image using helper function
            setScannedQrImage(extractQrImage(decodedCanvas, code.location));
          } else {
            error(
              t("workspace.scanFailed"),
              t("workspace.noQrDetected"),
            );
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        success(t("workspace.copied"), t("sidebar.copied"));
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

  const renderStructuredData = () => {
    if (!lastScanResult) return null;
    const parsed = parseQrString(lastScanResult);

    switch (parsed.type) {
      // ── URL ──────────────────────────────────────────────────────────────
      case "url": {
        const cleanUrl = parsed.raw.startsWith("http")
          ? parsed.raw
          : `https://${parsed.raw}`;

        const handleCheckReputation = () => {
          navigator.clipboard
            .writeText(cleanUrl)
            .then(() => {
              success(
                t("sidebar.copiedUrl"),
                t("sidebar.redirectingUrlVoid")
              );
              setTimeout(() => {
                window.open(
                  "https://www.urlvoid.com/",
                  "_blank",
                  "noopener,noreferrer"
                );
              }, 2000);
            })
            .catch(() => {
              error(t("workspace.errorHeader"), t("sidebar.copyUrlFailed"));
            });
        };

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            <Button
              onClick={() =>
                window.open(cleanUrl, "_blank", "noopener,noreferrer")
              }
              className="w-full text-xs h-9 flex items-center justify-center gap-1.5"
            >
              <ExternalLink size={14} />
              <span>{t("sidebar.openBrowserLink")}</span>
            </Button>
            <SecondaryButton
              onClick={handleCheckReputation}
              className="w-full text-xs h-9 flex items-center justify-center gap-1.5 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>{t("sidebar.checkReputation")}</span>
              <span onClick={(e) => e.stopPropagation()} className="inline-flex">
                <Tooltip
                  variant="wide1"
                  content={t("sidebar.urlVoidTooltip")}
                >
                  <HelpCircle
                    size={13}
                    className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 cursor-help"
                  />
                </Tooltip>
              </span>
            </SecondaryButton>
          </div>
        );
      }

      // ── EMAIL ─────────────────────────────────────────────────────────────
      case "email": {
        const email = parsed.emailData;
        if (!email) return null;
        return (
          <div className="space-y-2 text-xs mt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FieldRow label={t("sidebar.fields.to")} value={email.to} />
              {email.subject && <FieldRow label={t("sidebar.fields.subject")} value={email.subject} />}
            </div>
            {email.body && <FieldRow label={t("sidebar.fields.body")} value={email.body} />}
            <Button
              onClick={() =>
                window.open(
                  `mailto:${email.to}?subject=${encodeURIComponent(email.subject || "")}&body=${encodeURIComponent(email.body || "")}`
                )
              }
              className="w-full text-xs h-9 flex items-center justify-center gap-1.5"
            >
              <Mail size={14} />
              <span>{t("sidebar.draftEmail")}</span>
            </Button>
          </div>
        );
      }

      // ── SMS ───────────────────────────────────────────────────────────────
      case "sms": {
        const sms = parsed.smsData;
        if (!sms) return null;
        return (
          <div className="space-y-2 text-xs mt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FieldRow label={t("sidebar.fields.phone")} value={sms.phone} />
              {sms.message && <FieldRow label={t("sidebar.fields.message")} value={sms.message} />}
            </div>
            <Button
              onClick={() =>
                window.open(
                  `sms:${sms.phone}?body=${encodeURIComponent(sms.message || "")}`
                )
              }
              className="w-full text-xs h-9 flex items-center justify-center gap-1.5"
            >
              <MessageSquare size={14} />
              <span>{t("sidebar.sendSms")}</span>
            </Button>
          </div>
        );
      }

      // ── PHONE ─────────────────────────────────────────────────────────────
      case "phone": {
        const num = parsed.raw.startsWith("tel:") ? parsed.raw.substring(4) : parsed.raw;
        return (
          <div className="space-y-3 mt-1">
            <FieldRow label={t("sidebar.fields.phone")} value={num} />
            <Button
              onClick={() => window.open(`tel:${num}`)}
              className="w-full text-xs h-9 flex items-center justify-center gap-1.5"
            >
              <Phone size={14} />
              <span>{t("sidebar.callNumber")}</span>
            </Button>
          </div>
        );
      }

      // ── WIFI ──────────────────────────────────────────────────────────────
      case "wifi": {
        const wifi = parsed.wifiData;
        if (!wifi) return null;
        return (
          <div className="space-y-2 text-xs mt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FieldRow
                icon={<Wifi size={14} />}
                label={t("sidebar.fields.ssid")}
                value={wifi.ssid}
              />
              {wifi.password && (
                <div className="flex flex-col bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 relative">
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    {t("sidebar.fields.password")}
                  </span>
                  <span className="font-mono font-medium text-xs text-slate-800 dark:text-slate-200 select-all pr-8">
                    {showPassword ? wifi.password : "••••••••"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 bottom-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FieldRow
                label={t("sidebar.fields.encryption")}
                value={wifi.encryption || t("sidebar.no")}
              />
              {wifi.hidden !== undefined && (
                <FieldRow
                  label={t("sidebar.fields.hidden")}
                  value={wifi.hidden ? t("sidebar.yes") : t("sidebar.no")}
                />
              )}
            </div>
            {wifi.password && (
              <SecondaryButton
                onClick={() => copyToClipboard(wifi.password!)}
                className="w-full text-xs h-9 flex items-center justify-center gap-1.5"
              >
                <Copy size={14} />
                <span>{t("sidebar.copyPassword")}</span>
              </SecondaryButton>
            )}
          </div>
        );
      }

      // ── VCARD ─────────────────────────────────────────────────────────────
      case "vcard": {
        const vcard = parsed.vcardData;
        if (!vcard) return null;
        return (
          <div className="space-y-2 text-xs mt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {vcard.name && (
                <FieldRow
                  icon={<User size={14} />}
                  label={t("sidebar.fields.name")}
                  value={vcard.name}
                />
              )}
              {(vcard.title || vcard.org) && (
                <FieldRow
                  icon={<FileText size={14} />}
                  label={t("sidebar.fields.companyTitle")}
                  value={[vcard.title, vcard.org].filter(Boolean).join(" — ")}
                />
              )}
              {vcard.phoneMobile && (
                <FieldRow
                  icon={<Phone size={14} />}
                  label={t("sidebar.fields.phoneMobile")}
                  value={vcard.phoneMobile}
                  onClick={() => window.open(`tel:${vcard.phoneMobile}`)}
                />
              )}
              {vcard.phoneWork && (
                <FieldRow
                  icon={<Phone size={14} />}
                  label={t("sidebar.fields.phoneWork")}
                  value={vcard.phoneWork}
                  onClick={() => window.open(`tel:${vcard.phoneWork}`)}
                />
              )}
              {vcard.phoneHome && (
                <FieldRow
                  icon={<Phone size={14} />}
                  label={t("sidebar.fields.phoneHome")}
                  value={vcard.phoneHome}
                  onClick={() => window.open(`tel:${vcard.phoneHome}`)}
                />
              )}
              {vcard.phoneFax && (
                <FieldRow
                  icon={<Printer size={14} />}
                  label={t("sidebar.fields.phoneFax")}
                  value={vcard.phoneFax}
                />
              )}
              {vcard.email && (
                <FieldRow
                  icon={<Mail size={14} />}
                  label={t("sidebar.fields.email")}
                  value={vcard.email}
                  onClick={() => window.open(`mailto:${vcard.email}`)}
                />
              )}
              {vcard.url && (
                <FieldRow
                  icon={<ExternalLink size={14} />}
                  label={t("sidebar.fields.url")}
                  value={vcard.url}
                  onClick={() => window.open(vcard.url, "_blank")}
                />
              )}
              {vcard.address && (
                <FieldRow
                  icon={<MapPin size={14} />}
                  label={t("sidebar.fields.address")}
                  value={vcard.address}
                />
              )}
              {vcard.note && (
                <FieldRow
                  icon={<AlignLeft size={14} />}
                  label={t("sidebar.fields.note")}
                  value={vcard.note}
                />
              )}
            </div>
            <div className="flex gap-2 pt-1">
              {vcard.phoneMobile && (
                <Button
                  onClick={() => window.open(`tel:${vcard.phoneMobile}`)}
                  className="flex-1 text-xs h-9 flex items-center justify-center gap-1.5"
                >
                  <Phone size={14} />
                  <span>{t("sidebar.call")}</span>
                </Button>
              )}
              {vcard.email && (
                <Button
                  onClick={() => window.open(`mailto:${vcard.email}`)}
                  className="flex-1 text-xs h-9 flex items-center justify-center gap-1.5"
                >
                  <Mail size={14} />
                  <span>{t("sidebar.email")}</span>
                </Button>
              )}
            </div>
          </div>
        );
      }

      // ── EVENT ─────────────────────────────────────────────────────────────
      case "event": {
        const ev = parsed.eventData;
        if (!ev) return null;

        const startDisplay = ev.startDate
          ? formatICalDateForDisplay(ev.startDate)
          : undefined;
        const endDisplay = ev.endDate
          ? formatICalDateForDisplay(ev.endDate)
          : undefined;

        return (
          <div className="space-y-2 text-xs mt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ev.title && (
                <FieldRow
                  icon={<Calendar size={14} />}
                  label={t("sidebar.fields.eventTitle")}
                  value={ev.title}
                />
              )}
              {(startDisplay || endDisplay) && (
                <div className="flex flex-col bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <Clock size={11} />
                    {t("sidebar.fields.dateTime")}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {startDisplay && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 w-8 shrink-0">{t("sidebar.fields.from")}</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{startDisplay}</span>
                      </div>
                    )}
                    {endDisplay && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 w-8 shrink-0">{t("sidebar.fields.to")}</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{endDisplay}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ev.location && (
                <FieldRow
                  icon={<MapPin size={14} />}
                  label={t("sidebar.fields.location")}
                  value={ev.location}
                />
              )}
              {ev.description && (
                <FieldRow
                  icon={<AlignLeft size={14} />}
                  label={t("sidebar.fields.description")}
                  value={ev.description}
                />
              )}
            </div>
            {ev.url && (
              <FieldRow
                icon={<ExternalLink size={14} />}
                label={t("sidebar.fields.url")}
                value={ev.url}
                onClick={() => window.open(ev.url, "_blank")}
              />
            )}
            <div className="flex gap-2 pt-1">
              <Button
                onClick={() => {
                  const blob = new Blob([parsed.raw], {
                    type: "text/calendar;charset=utf-8",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${ev.title || "event"}.ics`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex-1 text-xs h-9 flex items-center justify-center gap-1.5"
              >
                <Calendar size={14} />
                <span>{t("sidebar.saveIcs")}</span>
              </Button>
              {ev.url && (
                <SecondaryButton
                  onClick={() => window.open(ev.url, "_blank")}
                  className="flex-1 text-xs h-9 flex items-center justify-center gap-1.5"
                >
                  <ExternalLink size={14} />
                  <span>{t("sidebar.openUrl")}</span>
                </SecondaryButton>
              )}
            </div>
          </div>
        );
      }

      // ── MESSAGING ─────────────────────────────────────────────────────────
      case "messaging": {
        const msg = parsed.messagingData;
        if (!msg) return null;

        const meta = PLATFORM_META[msg.platform] ?? PLATFORM_META["whatsapp"];

        const openLink = () => {
          window.open(parsed.raw, "_blank", "noopener,noreferrer");
        };

        return (
          <div className="space-y-2 text-xs mt-1">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${meta.color}`}>
              <MessageCircle size={12} />
              {meta.label}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FieldRow
                icon={<User size={14} />}
                label={msg.platform === "telegram" ? t("sidebar.fields.recipient") : t("sidebar.fields.phone")}
                value={msg.recipient}
              />
              {msg.message && (
                <FieldRow
                  icon={<AlignLeft size={14} />}
                  label={t("sidebar.fields.message")}
                  value={msg.message}
                />
              )}
            </div>
            <Button
              onClick={openLink}
              className="w-full text-xs h-9 flex items-center justify-center gap-1.5"
            >
              <MessageCircle size={14} />
              <span>{t("sidebar.openInPlatform", { platform: meta.label })}</span>
            </Button>
          </div>
        );
      }

      // ── TEXT (fallback) ───────────────────────────────────────────────────
      case "text":
      default:
        return (
          <div className="space-y-3 mt-1">
            <Button
              onClick={() => copyToClipboard(lastScanResult)}
              className="w-full text-xs h-9 flex items-center justify-center gap-1.5"
            >
              <Copy size={14} />
              <span>{t("sidebar.copyText")}</span>
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full gap-3 overflow-hidden animate-in fade-in duration-300">
      {/* Workspace Header Actions */}
      <div className="shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Subheading>{t("workspace.heading")}</Subheading>
          {!lastScanResult && cameraStream && (
            <SecondaryButton
              onClick={stopCamera}
              className="text-xs h-8 flex items-center gap-1.5 px-3 animate-in fade-in-50 slide-in-from-left-4 duration-300"
            >
              <ArrowLeft size={13} />
              {t("workspace.stopScanning")}
            </SecondaryButton>
          )}
        </div>
        {lastScanResult && (
          <div className="flex items-center gap-2">
            <SecondaryButton
              onClick={() => {
                setLastScanResult(null);
                setScannedQrImage(null);
              }}
              className="text-xs h-8 flex items-center gap-1.5 px-3"
            >
              <RotateCcw size={13} />
              {t("workspace.scanAgain")}
            </SecondaryButton>
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
                <div className="h-40 w-40 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 flex items-center justify-center shadow-inner">
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

              {/* Action Buttons */}
              <div className="flex flex-row md:flex-col gap-2 w-full">
                <Button
                  onClick={() => {
                    setLastScanResult(null);
                    setScannedQrImage(null);
                  }}
                  className="flex-1 text-xs h-9 px-4 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  {t("workspace.scanAnother")}
                </Button>

                <SecondaryButton
                  onClick={() => {
                    saveToHistory(lastScanResult);
                    success(t("history.title"), t("history.saveSuccess"));
                  }}
                  disabled={isAlreadySaved}
                  className="flex-1 text-xs h-9 px-4 flex items-center justify-center gap-1.5 border-slate-200 dark:border-slate-800"
                >
                  <Clock size={14} />
                  <span>{isAlreadySaved ? t("history.saved") : t("history.saveToHistory")}</span>
                </SecondaryButton>
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
                  className="w-full font-mono text-xs"
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
              <div className="mt-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2.5">
                  {t("sidebar.parsedActions")}
                </span>
                {renderStructuredData()}
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
      <ToastContainer toasts={toasts} onRemove={hide} />
    </div>
  );
}
