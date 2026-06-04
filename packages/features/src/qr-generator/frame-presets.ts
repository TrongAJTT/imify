import type { FrameConfig } from "./types"

export const FRAME_PRESETS: Record<string, FrameConfig> = {
  "none":               { id: "none", paddingTop: 0, paddingBottom: 0, paddingX: 0, borderRadius: 0, borderWidth: 0, textYOffset: 0 },
  "bottom-label":       { id: "bottom-label", paddingTop: 30, paddingBottom: 120, paddingX: 30, borderRadius: 0, borderWidth: 0, textYOffset: -40 },
  "top-label":          { id: "top-label", paddingTop: 120, paddingBottom: 30, paddingX: 30, borderRadius: 0, borderWidth: 0, textYOffset: 40 },
  "banner-bottom":      { id: "banner-bottom", paddingTop: 30, paddingBottom: 120, paddingX: 30, borderRadius: 16, borderWidth: 0, textYOffset: -40 },
  "border-box":         { id: "border-box", paddingTop: 40, paddingBottom: 40, paddingX: 40, borderRadius: 24, borderWidth: 6, textYOffset: 0 },
  "pill-bottom":        { id: "pill-bottom", paddingTop: 30, paddingBottom: 130, paddingX: 30, borderRadius: 999, borderWidth: 0, textYOffset: -45 },
}
