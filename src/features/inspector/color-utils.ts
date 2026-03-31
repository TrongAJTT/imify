import type { PaletteColor } from "./types"

// WCAG relative luminance of an sRGB channel value 0-255.
function linearize(c: number): number {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

export function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
}

export function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export type WcagLevel = "AAA" | "AA" | "AA Large" | "Fail"

export function wcagLevel(ratio: number): WcagLevel {
  if (ratio >= 7) return "AAA"
  if (ratio >= 4.5) return "AA"
  if (ratio >= 3) return "AA Large"
  return "Fail"
}

export interface ContrastResult {
  onWhite: { ratio: number; level: WcagLevel }
  onBlack: { ratio: number; level: WcagLevel }
}

export function checkContrast(r: number, g: number, b: number): ContrastResult {
  const lum = relativeLuminance(r, g, b)
  const whiteLum = 1
  const blackLum = 0

  const ratioOnWhite = contrastRatio(lum, whiteLum)
  const ratioOnBlack = contrastRatio(lum, blackLum)

  return {
    onWhite: { ratio: ratioOnWhite, level: wcagLevel(ratioOnWhite) },
    onBlack: { ratio: ratioOnBlack, level: wcagLevel(ratioOnBlack) }
  }
}

// Minimal color name dictionary — covers ~150 perceptually distinct named colors.
// Stored as [H, S, L, name] tuples for fast HSL-distance matching.
const COLOR_NAMES: Array<[number, number, number, string]> = [
  [0, 0, 0, "Midnight Black"],
  [0, 0, 10, "Ebony Clay"],
  [0, 0, 20, "Jet Black"],
  [0, 0, 30, "Charcoal"],
  [0, 0, 40, "Graphite"],
  [0, 0, 50, "Gray"],
  [0, 0, 60, "Silver Chalice"],
  [0, 0, 70, "Light Gray"],
  [0, 0, 80, "Gainsboro"],
  [0, 0, 90, "Ghost White"],
  [0, 0, 100, "White"],
  [0, 80, 20, "Dark Red"],
  [0, 80, 40, "Crimson"],
  [0, 80, 55, "Tomato"],
  [0, 80, 70, "Salmon"],
  [0, 100, 50, "Red"],
  [15, 75, 35, "Auburn"],
  [15, 80, 45, "Copper Rust"],
  [20, 70, 40, "Sienna"],
  [20, 70, 55, "Peru"],
  [25, 60, 50, "Bronze"],
  [28, 80, 60, "Sandy Brown"],
  [30, 100, 50, "Orange"],
  [30, 70, 40, "Brown"],
  [35, 85, 55, "Sunflower"],
  [38, 100, 50, "Dark Orange"],
  [40, 70, 55, "Marigold"],
  [45, 90, 65, "Amber"],
  [48, 100, 50, "Gold"],
  [50, 80, 60, "Mustard"],
  [55, 90, 60, "Khaki"],
  [60, 100, 50, "Yellow"],
  [70, 70, 55, "Yellow Green"],
  [80, 60, 40, "Olive Drab"],
  [80, 60, 50, "Olive"],
  [90, 50, 40, "Dark Olive"],
  [100, 60, 40, "Forest Green"],
  [120, 40, 30, "Dark Green"],
  [120, 50, 40, "Emerald"],
  [120, 60, 50, "Green"],
  [120, 70, 65, "Mint Green"],
  [130, 50, 55, "Medium Sea Green"],
  [140, 40, 50, "Jade"],
  [150, 50, 45, "Sea Green"],
  [160, 45, 45, "Teal Green"],
  [170, 50, 40, "Dark Cyan"],
  [175, 60, 45, "Teal"],
  [180, 60, 40, "Cerulean"],
  [185, 50, 50, "Cadet Blue"],
  [195, 55, 50, "Steel Blue"],
  [200, 60, 50, "Denim"],
  [200, 70, 40, "Dark Cerulean"],
  [210, 60, 45, "Lapis Blue"],
  [210, 70, 55, "Cornflower"],
  [220, 80, 60, "Malibu Blue"],
  [220, 90, 45, "Cobalt"],
  [225, 70, 35, "Sapphire"],
  [230, 60, 50, "Royal Blue"],
  [240, 50, 40, "Dark Blue"],
  [240, 60, 50, "Blue"],
  [240, 50, 70, "Periwinkle"],
  [250, 50, 60, "Lavender Blue"],
  [260, 50, 50, "Slate Blue"],
  [270, 50, 50, "Medium Purple"],
  [270, 60, 40, "Indigo"],
  [275, 60, 55, "Purple Heart"],
  [280, 50, 45, "Rebecca Purple"],
  [285, 55, 50, "Orchid"],
  [290, 50, 40, "Dark Violet"],
  [295, 60, 55, "Amethyst"],
  [300, 60, 50, "Magenta"],
  [300, 70, 35, "Dark Magenta"],
  [310, 55, 55, "Hot Pink"],
  [320, 60, 60, "Violet Red"],
  [325, 70, 45, "Deep Cerise"],
  [330, 60, 50, "Dark Pink"],
  [340, 65, 55, "Pale Violet Red"],
  [350, 70, 45, "Blush"],
  [355, 75, 55, "Rose"],
  [0, 30, 70, "Rose Quartz"],
  [30, 30, 60, "Desert Sand"],
  [30, 20, 80, "Antique White"],
  [40, 50, 75, "Peach Puff"],
  [50, 40, 80, "Lemon Chiffon"],
  [120, 30, 80, "Honeydew"],
  [180, 30, 85, "Azure"],
  [210, 30, 85, "Alice Blue"],
  [240, 30, 90, "Lavender"],
  [300, 20, 90, "Lavender Blush"],
  [10, 100, 35, "Maroon"],
  [0, 0, 15, "Raisin Black"],
  [220, 15, 30, "Blue Whale"],
  [220, 15, 50, "Slate Gray"],
]

function hslDistance(
  h1: number, s1: number, l1: number,
  h2: number, s2: number, l2: number
): number {
  const dh = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2)) / 180
  const ds = Math.abs(s1 - s2) / 100
  const dl = Math.abs(l1 - l2) / 100
  return dh * 2 + ds + dl * 1.5
}

export function getColorName(hsl: [number, number, number]): string {
  const [h, s, l] = hsl

  if (s < 8) {
    if (l < 8) return "Midnight Black"
    if (l < 20) return "Ebony"
    if (l < 35) return "Charcoal"
    if (l < 55) return "Gray"
    if (l < 75) return "Silver"
    if (l < 90) return "Light Gray"
    return "White"
  }

  let bestName = "Unknown"
  let bestDist = Infinity

  for (const [nh, ns, nl, name] of COLOR_NAMES) {
    if (ns < 8) continue
    const dist = hslDistance(h, s, l, nh, ns, nl)
    if (dist < bestDist) {
      bestDist = dist
      bestName = name
    }
  }

  return bestName
}

export function buildTailwindConfig(palette: PaletteColor[]): string {
  const semanticNames = [
    "primary", "secondary", "accent",
    "highlight", "muted", "subtle", "base", "surface"
  ]

  const entries = palette
    .slice(0, semanticNames.length)
    .map((c, i) => `    'imify-${semanticNames[i]}': '${c.hex}',`)
    .join("\n")

  return [
    "// Paste into tailwind.config.js",
    "theme: {",
    "  extend: {",
    "    colors: {",
    entries,
    "    }",
    "  }",
    "},"
  ].join("\n")
}

export function buildGradientCss(palette: PaletteColor[]): string | null {
  const gradient = getSuggestedGradient(palette)
  if (!gradient) return null
  return `background: ${gradient.css};`
}

export function getSuggestedGradient(
  palette: PaletteColor[]
): { from: string; to: string; css: string } | null {
  if (palette.length < 2) return null

  const from = palette[0]
  const candidates = palette.slice(1, 5)

  const colorDistance = (a: PaletteColor, b: PaletteColor): number => {
    const dr = a.rgb[0] - b.rgb[0]
    const dg = a.rgb[1] - b.rgb[1]
    const db = a.rgb[2] - b.rgb[2]
    return Math.sqrt(dr * dr + dg * dg + db * db)
  }

  let to = candidates[0] ?? palette[1]
  let bestScore = -1

  for (const candidate of candidates) {
    const dist = colorDistance(from, candidate)
    const weight = candidate.percentage / 100
    const score = dist * 0.85 + weight * 255 * 0.15
    if (score > bestScore) {
      bestScore = score
      to = candidate
    }
  }

  return {
    from: from.hex,
    to: to.hex,
    css: `linear-gradient(135deg, ${from.hex} 0%, ${to.hex} 100%)`
  }
}

export function buildScssVariables(palette: PaletteColor[]): string {
  const semanticNames = [
    "primary", "secondary", "accent",
    "highlight", "muted", "subtle", "base", "surface"
  ]
  const lines = palette
    .slice(0, semanticNames.length)
    .map((c, i) => `$img-${semanticNames[i]}: ${c.hex};`)
  return lines.join("\n")
}
