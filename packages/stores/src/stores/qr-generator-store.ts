import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { QrType, QrDataMap } from "@imify/features/qr-generator/types"

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
          errorCorrectionLevel: "M"
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
