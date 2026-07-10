import QRCodeStyling from "qr-code-styling"
import type { QrConfig, FrameStyleType } from "./types"

interface FrameLayout {
  paddingTop: number
  paddingBottom: number
  paddingX: number
  borderRadius: number
  borderWidth: number
  textY: number
  isBottomText: boolean
  totalWidth: number
  totalHeight: number
}

function calculateFrameLayout(style: FrameStyleType, size: number, textScale: number): FrameLayout {
  let paddingTop = 0
  let paddingBottom = 0
  let paddingX = 0
  let borderRadius = 0
  let borderWidth = 0
  let isBottomText = true

  switch (style) {
    case "border":
      paddingTop = paddingBottom = paddingX = size * 0.1
      borderRadius = size * 0.05
      borderWidth = size * 0.02
      break
    case "bottom":
      paddingTop = size * 0.08
      paddingBottom = size * 0.3
      paddingX = size * 0.08
      borderRadius = size * 0.06
      break
    case "top":
      paddingTop = size * 0.3
      paddingBottom = size * 0.08
      paddingX = size * 0.08
      borderRadius = size * 0.06
      isBottomText = false
      break
    case "tooltip":
      paddingTop = size * 0.08
      paddingBottom = size * 0.35
      paddingX = size * 0.08
      borderRadius = size * 0.1
      break
    case "ribbon":
      paddingTop = size * 0.3
      paddingBottom = size * 0.08
      paddingX = size * 0.08
      isBottomText = false
      break
    case "none":
    default:
      break
  }

  const totalWidth = size + 2 * paddingX
  const totalHeight = size + paddingTop + paddingBottom

  // Calculate text Y position
  let textY = 0
  if (style !== "none") {
    let textZoneHeight = isBottomText ? paddingBottom : paddingTop
    // For tooltip, the main body is smaller than the total paddingBottom because of the tail
    if (style === "tooltip") {
      textZoneHeight = paddingBottom * 0.7 // Exclude the tail height (30%)
    }
    const baseOffset = isBottomText ? totalHeight - paddingBottom + textZoneHeight / 2 : textZoneHeight / 2
    textY = baseOffset
  }

  return {
    paddingTop,
    paddingBottom,
    paddingX,
    borderRadius,
    borderWidth,
    textY,
    isBottomText,
    totalWidth,
    totalHeight
  }
}

export function createQrStylingInstance(config: QrConfig): QRCodeStyling {
  const resolvedMarkerBorderColor = config.syncMarkerBorderColorWithForeground ? config.fgColor : config.markerBorderColor
  const resolvedMarkerCenterColor = config.syncMarkerCenterColorWithForeground ? config.fgColor : config.markerCenterColor

  const options: any = {
    width: config.size,
    height: config.size,
    type: "canvas" as const,
    data: "", // Set dynamically when encoding
    margin: config.qrMargin || 0,
    qrOptions: {
      typeNumber: 0,
      mode: "Byte" as const,
      errorCorrectionLevel: config.errorCorrectionLevel
    },
    dotsOptions: {
      type: config.dotType,
      color: config.fgColor
    },
    backgroundOptions: {
      color: config.bgColor
    },
    cornersSquareOptions: {
      type: config.markerBorderType,
      color: resolvedMarkerBorderColor
    },
    cornersDotOptions: {
      type: config.markerCenterType,
      color: resolvedMarkerCenterColor
    }
  }

  if (config.includeLogo && config.logoUrl) {
    options.image = config.logoUrl
    options.imageOptions = {
      crossOrigin: "anonymous",
      hideBackgroundDots: config.excavateLogo,
      imageSize: config.logoWidth / config.size,
      margin: 0
    }
  }

  return new QRCodeStyling(options)
}

export async function renderMasterCanvas(config: QrConfig, encodedData: string): Promise<HTMLCanvasElement> {
  const qrInstance = createQrStylingInstance(config)
  qrInstance.update({ data: encodedData })

  // Get raw PNG blob from qr-code-styling
  const blob = await qrInstance.getRawData("png")
  if (!blob) throw new Error("Failed to render QR PNG")
  if (!(blob instanceof Blob)) {
    throw new Error("Expected a Blob from qr-code-styling")
  }
  const url = URL.createObjectURL(blob)

  // Load into HTMLImageElement
  const img = new Image()
  img.src = url
  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve()
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
  })

  const layout = calculateFrameLayout(config.frameStyle, config.size, config.frameTextScale)
  const masterCanvas = document.createElement("canvas")
  masterCanvas.width = layout.totalWidth
  masterCanvas.height = layout.totalHeight
  const ctx = masterCanvas.getContext("2d")
  if (!ctx) return masterCanvas

  const resolvedFrameColor = config.syncFrameColorWithForeground ? config.fgColor : config.frameColor
  const resolvedTextColor = config.syncTextColorWithBackground ? config.bgColor : config.frameTextColor

  // Draw frame background
  if (config.frameStyle !== "none") {
    ctx.save()
    ctx.fillStyle = resolvedFrameColor
    
    if (config.frameStyle === "ribbon") {
      const w = layout.totalWidth
      const h = layout.totalHeight
      const pt = layout.paddingTop
      const px = layout.paddingX
      const ribbonH = pt * 0.8
      const ribbonY = pt * 0.1
      
      // Main ribbon body
      ctx.fillRect(0, ribbonY, w, ribbonH)
      
      // Ribbon tails
      ctx.beginPath()
      ctx.moveTo(0, ribbonY + ribbonH)
      ctx.lineTo(px * 0.5, ribbonY + ribbonH + ribbonY)
      ctx.lineTo(px * 0.5, ribbonY)
      ctx.fill()
      
      ctx.beginPath()
      ctx.moveTo(w, ribbonY + ribbonH)
      ctx.lineTo(w - px * 0.5, ribbonY + ribbonH + ribbonY)
      ctx.lineTo(w - px * 0.5, ribbonY)
      ctx.fill()

      // QR Background area (if ribbon, we might want a white box under QR)
      ctx.fillStyle = config.bgColor
      ctx.fillRect(px, pt, config.size, config.size)
    } else if (config.frameStyle === "tooltip") {
      const w = layout.totalWidth
      const h = layout.totalHeight
      const r = layout.borderRadius
      
      ctx.beginPath()
      if ((ctx as any).roundRect) {
        ;(ctx as any).roundRect(0, 0, w, h - layout.paddingBottom * 0.3, r)
      } else {
        // Fallback for roundRect
        ctx.rect(0, 0, w, h - layout.paddingBottom * 0.3)
      }
      ctx.fill()
      
      // Tooltip tail
      ctx.beginPath()
      const tailW = layout.paddingBottom * 0.4
      const tailH = layout.paddingBottom * 0.3
      ctx.moveTo(w / 2 - tailW / 2, h - tailH)
      ctx.lineTo(w / 2, h)
      ctx.lineTo(w / 2 + tailW / 2, h - tailH)
      ctx.fill()
    } else {
      ctx.beginPath()
      if ((ctx as any).roundRect) {
        ;(ctx as any).roundRect(0, 0, layout.totalWidth, layout.totalHeight, layout.borderRadius)
      } else {
        ctx.rect(0, 0, layout.totalWidth, layout.totalHeight)
      }
      ctx.fill()

      if (layout.borderWidth > 0) {
        ctx.strokeStyle = resolvedTextColor
        ctx.lineWidth = layout.borderWidth
        ctx.stroke()
      }
    }
    ctx.restore()
  }

  // Draw QR code image
  ctx.drawImage(img, layout.paddingX, layout.paddingTop)

  // Draw frame text
  if (config.frameText && config.frameStyle !== "none") {
    if (typeof document !== "undefined" && "fonts" in document) {
      try {
        const fontSpec = `bold 16px "${config.frameFontFamily}"`
        await document.fonts.load(fontSpec)
      } catch (e) {}
    }

    ctx.save()
    ctx.fillStyle = resolvedTextColor
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    const baseFontSize = Math.max(12, Math.round(config.size * 0.08))
    const fontSize = baseFontSize * (config.frameTextScale / 100)
    ctx.font = `bold ${fontSize}px "${config.frameFontFamily}"`

    ctx.fillText(config.frameText, layout.totalWidth / 2, layout.textY)
    ctx.restore()
  }

  return masterCanvas
}

export async function exportAsSvg(config: QrConfig, encodedData: string): Promise<string> {
  const qrInstance = createQrStylingInstance(config)
  qrInstance.update({ data: encodedData })
  
  // Get raw SVG from qr-code-styling
  const blob = await qrInstance.getRawData("svg")
  if (!blob) throw new Error("Failed to render QR SVG")
  let rawSvgText = ""
  if (blob instanceof Blob) {
    rawSvgText = await blob.text()
  } else {
    rawSvgText = blob.toString("utf-8")
  }

  const layout = calculateFrameLayout(config.frameStyle, config.size, config.frameTextScale)

  // Extract inner elements of the generated QR SVG
  const match = rawSvgText.match(/<svg[^>]*>([\s\S]*?)<\/svg>/)
  if (!match) return rawSvgText
  const innerElements = match[1]

  // Resolve colors
  const resolvedFrameColor = config.syncFrameColorWithForeground ? config.fgColor : config.frameColor
  const resolvedTextColor = config.syncTextColorWithBackground ? config.bgColor : config.frameTextColor

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.totalWidth}" height="${layout.totalHeight}" viewBox="0 0 ${layout.totalWidth} ${layout.totalHeight}">\n`

  // Draw frame background
  if (config.frameStyle !== "none") {
    if (config.frameStyle === "ribbon") {
      const w = layout.totalWidth
      const pt = layout.paddingTop
      const px = layout.paddingX
      const ribbonH = pt * 0.8
      const ribbonY = pt * 0.1
      
      // Main ribbon body
      svgContent += `  <rect x="0" y="${ribbonY}" width="${w}" height="${ribbonH}" fill="${resolvedFrameColor}" />\n`
      // Ribbon tails
      svgContent += `  <path d="M 0,${ribbonY + ribbonH} L ${px * 0.5},${ribbonY + ribbonH + ribbonY} L ${px * 0.5},${ribbonY} Z" fill="${resolvedFrameColor}" />\n`
      svgContent += `  <path d="M ${w},${ribbonY + ribbonH} L ${w - px * 0.5},${ribbonY + ribbonH + ribbonY} L ${w - px * 0.5},${ribbonY} Z" fill="${resolvedFrameColor}" />\n`
      // QR Background
      svgContent += `  <rect x="${px}" y="${pt}" width="${config.size}" height="${config.size}" fill="${config.bgColor}" />\n`
    } else if (config.frameStyle === "tooltip") {
      const w = layout.totalWidth
      const h = layout.totalHeight
      const r = layout.borderRadius
      const tailW = layout.paddingBottom * 0.4
      const tailH = layout.paddingBottom * 0.3
      const mainH = h - tailH
      
      svgContent += `  <rect x="0" y="0" width="${w}" height="${mainH}" rx="${r}" ry="${r}" fill="${resolvedFrameColor}" />\n`
      svgContent += `  <path d="M ${w / 2 - tailW / 2},${mainH} L ${w / 2},${h} L ${w / 2 + tailW / 2},${mainH} Z" fill="${resolvedFrameColor}" />\n`
    } else {
      const borderAttr = layout.borderWidth > 0 ? ` stroke="${resolvedTextColor}" stroke-width="${layout.borderWidth}"` : ""
      svgContent += `  <rect x="0" y="0" width="${layout.totalWidth}" height="${layout.totalHeight}" rx="${layout.borderRadius}" ry="${layout.borderRadius}" fill="${resolvedFrameColor}"${borderAttr} />\n`
    }
  }

  // Draw QR code elements shifted by padding
  svgContent += `  <g transform="translate(${layout.paddingX}, ${layout.paddingTop})">\n`
  svgContent += `    ${innerElements}\n`
  svgContent += `  </g>\n`

  // Draw text label
  if (config.frameText && config.frameStyle !== "none") {
    const baseFontSize = Math.max(12, Math.round(config.size * 0.08))
    const fontSize = baseFontSize * (config.frameTextScale / 100)

    svgContent += `  <text x="${layout.totalWidth / 2}" y="${layout.textY}" fill="${resolvedTextColor}" font-family="${config.frameFontFamily}" font-size="${fontSize}" font-weight="bold" text-anchor="middle" dominant-baseline="central">${config.frameText}</text>\n`
  }

  svgContent += `</svg>`
  return svgContent
}
