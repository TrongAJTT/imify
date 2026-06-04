import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  QrType,
  QrDataMap,
  QrDotType,
  QrMarkerBorderType,
  QrMarkerCenterType,
  FrameConfig
} from "@imify/features/qr-generator/types"

interface QrGeneratorState {
  type: QrType
  data: QrDataMap
  size: number
  bgColor: string
  fgColor: string
  includeLogo: boolean
  logoUrl: string | null
  logoWidth: number
  logoHeight: number
  excavateLogo: boolean
  errorCorrectionLevel: "L" | "M" | "Q" | "H"

  // Design
  dotType: QrDotType
  markerBorderType: QrMarkerBorderType
  markerCenterType: QrMarkerCenterType
  syncMarkerBorderColorWithForeground: boolean
  markerBorderColor: string
  syncMarkerCenterColorWithForeground: boolean
  markerCenterColor: string

  // Frame
  frameConfig: FrameConfig
  frameText: string
  frameFontFamily: string
  frameFontId: string
  syncFrameColorWithForeground: boolean
  frameColor: string
  syncTextColorWithBackground: boolean
  frameTextColor: string

  setType: (type: QrType) => void
  updateDataField: <K extends QrType>(type: K, field: keyof QrDataMap[K], value: any) => void
  setSize: (size: number) => void
  setBgColor: (color: string) => void
  setFgColor: (color: string) => void
  setIncludeLogo: (include: boolean) => void
  setLogoUrl: (url: string | null) => void
  setLogoWidth: (w: number) => void
  setLogoHeight: (h: number) => void
  setExcavateLogo: (excavate: boolean) => void
  setErrorCorrectionLevel: (level: "L" | "M" | "Q" | "H") => void

  // Design setters
  setDotType: (type: QrDotType) => void
  setMarkerBorderType: (type: QrMarkerBorderType) => void
  setMarkerCenterType: (type: QrMarkerCenterType) => void
  setSyncMarkerBorderColorWithForeground: (sync: boolean) => void
  setMarkerBorderColor: (color: string) => void
  setSyncMarkerCenterColorWithForeground: (sync: boolean) => void
  setMarkerCenterColor: (color: string) => void

  // Frame setters
  setFrameConfig: (config: FrameConfig) => void
  updateFrameConfigField: <K extends keyof FrameConfig>(key: K, value: FrameConfig[K]) => void
  setFrameText: (text: string) => void
  setFrameFontFamily: (family: string) => void
  setFrameFontId: (id: string) => void
  setSyncFrameColorWithForeground: (sync: boolean) => void
  setFrameColor: (color: string) => void
  setSyncTextColorWithBackground: (sync: boolean) => void
  setFrameTextColor: (color: string) => void

  resetToDefault: () => void
}

const INITIAL_DATA: QrDataMap = {
  url: { url: "" },
  text: { text: "" },
  email: { to: "", subject: "", body: "" },
  phone: { phone: "" },
  sms: { phone: "", message: "" },
  wifi: { ssid: "", password: "", encryption: "WPA" },
  vcard: {
    firstName: "",
    lastName: "",
    organization: "",
    title: "",
    phoneMobile: "",
    phoneWork: "",
    email: "",
    url: "",
    addressStreet: "",
    addressCity: "",
    addressState: "",
    addressZip: "",
    addressCountry: "",
    note: ""
  }
}

const DEFAULT_FRAME_CONFIG: FrameConfig = {
  id: "none",
  paddingTop: 0,
  paddingBottom: 0,
  paddingX: 0,
  borderRadius: 0,
  borderWidth: 0,
  textYOffset: 0
}

export const useQrGeneratorStore = create<QrGeneratorState>()(
  persist(
    (set) => ({
      type: "url",
      data: INITIAL_DATA,
      size: 256,
      bgColor: "#ffffff",
      fgColor: "#000000",
      includeLogo: false,
      logoUrl: null,
      logoWidth: 40,
      logoHeight: 40,
      excavateLogo: true,
      errorCorrectionLevel: "M",

      // Design Defaults
      dotType: "square",
      markerBorderType: "square",
      markerCenterType: "square",
      syncMarkerBorderColorWithForeground: true,
      markerBorderColor: "#000000",
      syncMarkerCenterColorWithForeground: true,
      markerCenterColor: "#000000",

      // Frame Defaults
      frameConfig: DEFAULT_FRAME_CONFIG,
      frameText: "SCAN ME",
      frameFontFamily: "sans-serif",
      frameFontId: "",
      syncFrameColorWithForeground: true,
      frameColor: "#000000",
      syncTextColorWithBackground: true,
      frameTextColor: "#ffffff",

      setType: (type) => set({ type }),
      updateDataField: (type, field, value) =>
        set((state) => ({
          data: {
            ...state.data,
            [type]: {
              ...state.data[type],
              [field]: value
            }
          }
        })),
      setSize: (size) => set({ size }),
      setBgColor: (bgColor) => set({ bgColor }),
      setFgColor: (fgColor) => set({ fgColor }),
      setIncludeLogo: (includeLogo) => set({ includeLogo }),
      setLogoUrl: (logoUrl) => set({ logoUrl }),
      setLogoWidth: (logoWidth) => set({ logoWidth }),
      setLogoHeight: (logoHeight) => set({ logoHeight }),
      setExcavateLogo: (excavateLogo) => set({ excavateLogo }),
      setErrorCorrectionLevel: (errorCorrectionLevel) => set({ errorCorrectionLevel }),

      // Design Setters
      setDotType: (dotType) => set({ dotType }),
      setMarkerBorderType: (markerBorderType) => set({ markerBorderType }),
      setMarkerCenterType: (markerCenterType) => set({ markerCenterType }),
      setSyncMarkerBorderColorWithForeground: (syncMarkerBorderColorWithForeground) => set({ syncMarkerBorderColorWithForeground }),
      setMarkerBorderColor: (markerBorderColor) => set({ markerBorderColor }),
      setSyncMarkerCenterColorWithForeground: (syncMarkerCenterColorWithForeground) => set({ syncMarkerCenterColorWithForeground }),
      setMarkerCenterColor: (markerCenterColor) => set({ markerCenterColor }),

      // Frame Setters
      setFrameConfig: (frameConfig) => set({ frameConfig }),
      updateFrameConfigField: (key, value) =>
        set((state) => ({
          frameConfig: {
            ...state.frameConfig,
            [key]: value,
            id: "custom"
          }
        })),
      setFrameText: (frameText) => set({ frameText }),
      setFrameFontFamily: (frameFontFamily) => set({ frameFontFamily }),
      setFrameFontId: (frameFontId) => set({ frameFontId }),
      setSyncFrameColorWithForeground: (syncFrameColorWithForeground) => set({ syncFrameColorWithForeground }),
      setFrameColor: (frameColor) => set({ frameColor }),
      setSyncTextColorWithBackground: (syncTextColorWithBackground) => set({ syncTextColorWithBackground }),
      setFrameTextColor: (frameTextColor) => set({ frameTextColor }),

      resetToDefault: () =>
        set({
          type: "url",
          data: INITIAL_DATA,
          size: 256,
          bgColor: "#ffffff",
          fgColor: "#000000",
          includeLogo: false,
          logoUrl: null,
          logoWidth: 40,
          logoHeight: 40,
          excavateLogo: true,
          errorCorrectionLevel: "M",

          dotType: "square",
          markerBorderType: "square",
          markerCenterType: "square",
          syncMarkerBorderColorWithForeground: true,
          markerBorderColor: "#000000",
          syncMarkerCenterColorWithForeground: true,
          markerCenterColor: "#000000",

          frameConfig: DEFAULT_FRAME_CONFIG,
          frameText: "SCAN ME",
          frameFontFamily: "sans-serif",
          frameFontId: "",
          syncFrameColorWithForeground: true,
          frameColor: "#000000",
          syncTextColorWithBackground: true,
          frameTextColor: "#ffffff"
        })
    }),
    {
      name: "imify-qr-generator-settings",
      partialize: (state) => {
        const { logoUrl, ...rest } = state
        return rest
      }
    }
  )
)
