import { compress } from "woff2-encoder"

export interface GoogleFontCurated {
  family: string
  category: string
  license: string
  defaultWeight: number
}

export const CURATED_GOOGLE_FONTS: GoogleFontCurated[] = [
  { family: "Roboto", category: "sans-serif", license: "Apache-2.0", defaultWeight: 700 },
  { family: "Open Sans", category: "sans-serif", license: "OFL-1.1", defaultWeight: 700 },
  { family: "Montserrat", category: "sans-serif", license: "OFL-1.1", defaultWeight: 700 },
  { family: "Lato", category: "sans-serif", license: "OFL-1.1", defaultWeight: 700 },
  { family: "Poppins", category: "sans-serif", license: "OFL-1.1", defaultWeight: 700 },
  { family: "Inter", category: "sans-serif", license: "OFL-1.1", defaultWeight: 700 },
  { family: "Oswald", category: "sans-serif", license: "OFL-1.1", defaultWeight: 700 },
  { family: "Raleway", category: "sans-serif", license: "OFL-1.1", defaultWeight: 700 },
  { family: "Nunito", category: "sans-serif", license: "OFL-1.1", defaultWeight: 700 },
  { family: "Merriweather", category: "serif", license: "OFL-1.1", defaultWeight: 700 },
  { family: "Playfair Display", category: "serif", license: "OFL-1.1", defaultWeight: 700 },
  { family: "Ubuntu", category: "sans-serif", license: "Ubuntu-Font-License-1.0", defaultWeight: 700 },
  { family: "Source Sans 3", category: "sans-serif", license: "OFL-1.1", defaultWeight: 700 },
  { family: "Bebas Neue", category: "sans-serif", license: "OFL-1.1", defaultWeight: 400 },
  { family: "Dancing Script", category: "handwriting", license: "OFL-1.1", defaultWeight: 700 },
  { family: "Pacifico", category: "handwriting", license: "OFL-1.1", defaultWeight: 400 },
  { family: "Abril Fatface", category: "display", license: "OFL-1.1", defaultWeight: 400 },
  { family: "Lobster", category: "display", license: "OFL-1.1", defaultWeight: 400 },
  { family: "Quicksand", category: "sans-serif", license: "OFL-1.1", defaultWeight: 700 },
  { family: "Comfortaa", category: "display", license: "OFL-1.1", defaultWeight: 700 }
]

export function isWoff2(buffer: ArrayBuffer): boolean {
  const view = new DataView(buffer)
  if (view.byteLength < 4) return false
  return (
    view.getUint8(0) === 0x77 && // 'w'
    view.getUint8(1) === 0x4f && // 'O'
    view.getUint8(2) === 0x46 && // 'F'
    view.getUint8(3) === 0x32    // '2'
  )
}

export async function convertToWoff2IfNeeded(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  if (isWoff2(buffer)) {
    return buffer
  }

  try {
    const uint8Array = new Uint8Array(buffer)
    const compressed = await compress(uint8Array)
    return compressed.buffer
  } catch (error) {
    console.error("Failed to convert font to WOFF2:", error)
    throw new Error("Could not convert font to WOFF2. Make sure it is a valid TTF or OTF file.")
  }
}

export async function fetchGoogleFontWoff2(family: string, weight: number): Promise<{ data: ArrayBuffer; fileName: string }> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`
  
  const response = await fetch(cssUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch font CSS for ${family} (status: ${response.status})`)
  }
  const cssText = await response.text()
  
  // Try to find the latin block first to prioritize the latin subset
  const latinIndex = cssText.indexOf("/* latin */")
  let searchCss = cssText
  if (latinIndex !== -1) {
    searchCss = cssText.substring(latinIndex)
  }
  
  const woff2UrlRegex = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/
  const match = searchCss.match(woff2UrlRegex)
  
  let woff2Url = match ? match[1] : null
  if (!woff2Url) {
    const fallbackMatch = cssText.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/)
    woff2Url = fallbackMatch ? fallbackMatch[1] : null
  }
  
  if (!woff2Url) {
    throw new Error(`Could not extract WOFF2 URL from CSS for ${family}`)
  }
  
  const binaryResponse = await fetch(woff2Url)
  if (!binaryResponse.ok) {
    throw new Error(`Failed to download WOFF2 binary from ${woff2Url}`)
  }
  
  const data = await binaryResponse.arrayBuffer()
  const normalizedFamily = family.toLowerCase().replace(/\s+/g, "-")
  const fileName = `${normalizedFamily}-${weight}.woff2`
  
  return { data, fileName }
}

export interface SystemFontInfo {
  family: string
  fullName: string
  postscriptName: string
  style: string
}

export async function getSystemFonts(): Promise<SystemFontInfo[]> {
  if (typeof window === "undefined" || !("queryLocalFonts" in window)) {
    return []
  }
  
  try {
    const queryLocalFonts = (window as any).queryLocalFonts
    const availableFonts = await queryLocalFonts()
    return availableFonts.map((f: any) => ({
      family: f.family,
      fullName: f.fullName,
      postscriptName: f.postscriptName,
      style: f.style
    }))
  } catch (error) {
    console.error("Failed to query local fonts:", error)
    return []
  }
}

export async function fetchSystemFontBlob(postscriptName: string): Promise<Blob | null> {
  if (typeof window === "undefined" || !("queryLocalFonts" in window)) {
    return null
  }
  
  try {
    const queryLocalFonts = (window as any).queryLocalFonts
    const availableFonts = await queryLocalFonts()
    const match = availableFonts.find((f: any) => f.postscriptName === postscriptName)
    if (match) {
      return await match.blob()
    }
  } catch (error) {
    console.error(`Failed to fetch system font blob for ${postscriptName}:`, error)
  }
  return null
}
