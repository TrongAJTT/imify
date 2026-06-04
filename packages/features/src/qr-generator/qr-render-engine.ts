import QRCodeStyling from "qr-code-styling"
import type { QrConfig } from "./types"

export function createQrStylingInstance(config: QrConfig): QRCodeStyling {
  const resolvedMarkerBorderColor = config.syncMarkerBorderColorWithForeground ? config.fgColor : config.markerBorderColor
  const resolvedMarkerCenterColor = config.syncMarkerCenterColorWithForeground ? config.fgColor : config.markerCenterColor

  const options: any = {
    width: config.size,
    height: config.size,
    type: "canvas" as const,
    data: "", // Set dynamically when encoding
    margin: 0,
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

  // Calculate layout dimensions
  const isNone = config.frameConfig.id === "none"
  const paddingTop = isNone ? 0 : config.frameConfig.paddingTop
  const paddingBottom = isNone ? 0 : config.frameConfig.paddingBottom
  const paddingX = isNone ? 0 : config.frameConfig.paddingX
  const borderRadius = isNone ? 0 : config.frameConfig.borderRadius
  const borderWidth = isNone ? 0 : config.frameConfig.borderWidth

  const totalWidth = config.size + 2 * paddingX
  const totalHeight = config.size + paddingTop + paddingBottom

  const masterCanvas = document.createElement("canvas")
  masterCanvas.width = totalWidth
  masterCanvas.height = totalHeight
  const ctx = masterCanvas.getContext("2d")
  if (!ctx) return masterCanvas

  const resolvedFrameColor = config.syncFrameColorWithForeground ? config.fgColor : config.frameColor
  const resolvedTextColor = config.syncTextColorWithBackground ? config.bgColor : config.frameTextColor

  // Draw frame background
  if (!isNone) {
    ctx.save()
    ctx.fillStyle = resolvedFrameColor
    ctx.beginPath()
    if ((ctx as any).roundRect) {
      ;(ctx as any).roundRect(0, 0, totalWidth, totalHeight, borderRadius)
    } else {
      const r = borderRadius
      const w = totalWidth
      const h = totalHeight
      ctx.moveTo(r, 0)
      ctx.lineTo(w - r, 0)
      ctx.quadraticCurveTo(w, 0, w, r)
      ctx.lineTo(w, h - r)
      ctx.quadraticCurveTo(w, h, w - r, h)
      ctx.lineTo(r, h)
      ctx.quadraticCurveTo(0, h, 0, h - r)
      ctx.lineTo(0, r)
      ctx.quadraticCurveTo(0, 0, r, 0)
    }
    ctx.fill()

    if (borderWidth > 0) {
      ctx.strokeStyle = resolvedTextColor
      ctx.lineWidth = borderWidth
      ctx.stroke()
    }
    ctx.restore()
  }

  // Draw QR code image
  const qrX = paddingX
  const qrY = paddingTop
  ctx.drawImage(img, qrX, qrY)

  // Draw frame text
  if (config.frameText && !isNone) {
    if (typeof document !== "undefined" && "fonts" in document) {
      try {
        const fontSpec = `bold 16px "${config.frameFontFamily}"`
        await document.fonts.load(fontSpec)
      } catch (e) {
        console.warn(`Failed to wait for font loading: ${config.frameFontFamily}`, e)
      }
    }

    ctx.save()
    ctx.fillStyle = resolvedTextColor
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    const fontSize = Math.max(12, Math.round(config.size * 0.075))
    ctx.font = `bold ${fontSize}px "${config.frameFontFamily}"`

    const isBottomText = paddingBottom >= paddingTop
    const textBaseY = isBottomText ? totalHeight - paddingBottom / 2 : paddingTop / 2
    const textY = textBaseY + config.frameConfig.textYOffset

    ctx.fillText(config.frameText, totalWidth / 2, textY)
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

  // Calculate layout dimensions
  const isNone = config.frameConfig.id === "none"
  const paddingTop = isNone ? 0 : config.frameConfig.paddingTop
  const paddingBottom = isNone ? 0 : config.frameConfig.paddingBottom
  const paddingX = isNone ? 0 : config.frameConfig.paddingX
  const borderRadius = isNone ? 0 : config.frameConfig.borderRadius
  const borderWidth = isNone ? 0 : config.frameConfig.borderWidth

  const totalWidth = config.size + 2 * paddingX
  const totalHeight = config.size + paddingTop + paddingBottom

  // Extract inner elements of the generated QR SVG
  const match = rawSvgText.match(/<svg[^>]*>([\s\S]*?)<\/svg>/)
  if (!match) return rawSvgText
  const innerElements = match[1]

  // Resolve colors
  const resolvedFrameColor = config.syncFrameColorWithForeground ? config.fgColor : config.frameColor
  const resolvedTextColor = config.syncTextColorWithBackground ? config.bgColor : config.frameTextColor

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">\n`

  // Draw frame background
  if (!isNone) {
    const borderAttr = borderWidth > 0 ? ` stroke="${resolvedTextColor}" stroke-width="${borderWidth}"` : ""
    svgContent += `  <rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" rx="${borderRadius}" ry="${borderRadius}" fill="${resolvedFrameColor}"${borderAttr} />\n`
  }

  // Draw QR code elements shifted by padding
  svgContent += `  <g transform="translate(${paddingX}, ${paddingTop})">\n`
  svgContent += `    ${innerElements}\n`
  svgContent += `  </g>\n`

  // Draw text label
  if (config.frameText && !isNone) {
    const fontSize = Math.max(12, Math.round(config.size * 0.075))
    const isBottomText = paddingBottom >= paddingTop
    const textBaseY = isBottomText ? totalHeight - paddingBottom / 2 : paddingTop / 2
    const textY = textBaseY + config.frameConfig.textYOffset

    svgContent += `  <text x="${totalWidth / 2}" y="${textY}" fill="${resolvedTextColor}" font-family="${config.frameFontFamily}" font-size="${fontSize}" font-weight="bold" text-anchor="middle" dominant-baseline="central">${config.frameText}</text>\n`
  }

  svgContent += `</svg>`
  return svgContent
}
