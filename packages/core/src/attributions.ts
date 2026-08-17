/**
 * This file is for attribution purposes only.
 * IMPORTANT NOTE: After editing the file, make sure to run the "pnpm sync:credit" command to automatically update the CREDIT.md file.
 */

export interface AttributionItem {
  name: string
  author: string
  license: string
  url: string
  image?: string
}

export interface AttributionCategory {
  id: string
  label: string
  items: AttributionItem[]
}

// Source of truth for open-source acknowledgements grouped by category.
export const ATTRIBUTION_CATEGORIES: AttributionCategory[] = [
  {
    id: "core",
    label: "Core Frameworks",
    items: [
      { name: "React", author: "Meta Platforms, Inc. and contributors", license: "MIT", url: "https://react.dev/" },
      { name: "Plasmo", author: "Plasmo Corp.", license: "MIT", url: "https://docs.plasmo.com/" },
      { name: "Tailwind CSS", author: "Tailwind Labs, Inc.", license: "MIT", url: "https://tailwindcss.com/" },
      { name: "Lucide React", author: "Eric Fennis and Lucide contributors", license: "ISC", url: "https://lucide.dev/" },
      { name: "Radix UI", author: "Modulz Inc. and Radix UI contributors", license: "MIT", url: "https://www.radix-ui.com/" },
      { name: "Zustand", author: "Paul Henschel and Poimandres contributors", license: "MIT", url: "https://github.com/pmndrs/zustand" },
      { name: "Konva", author: "Anton Lavrenov", license: "MIT", url: "https://github.com/konvajs/konva" },
      { name: "React Konva", author: "Anton Lavrenov", license: "MIT", url: "https://github.com/konvajs/react-konva" }
    ]
  },
  {
    id: "utilities",
    label: "Utilities & Libraries",
    items: [
      { name: "dnd-kit", author: "Claudéric Demers", license: "MIT", url: "https://dndkit.com/" },
      { name: "react-colorful", author: "Vlad Shilov and contributors", license: "MIT", url: "https://github.com/omgovich/react-colorful" },
      { name: "markdown-to-jsx", author: "Quantizor and contributors", license: "MIT", url: "https://github.com/quantizor/markdown-to-jsx" },
      { name: "idb", author: "Jake Archibald", license: "ISC", url: "https://github.com/jakearchibald/idb" },
      { name: "pdf-lib", author: "Andrew Dillon", license: "MIT", url: "https://pdf-lib.js.org/" },
      { name: "UPNG.js", author: "Ivan Kutskir", license: "MIT", url: "https://github.com/photopea/UPNG.js" },
      { name: "image-q", author: "Igor Bezkrovnyi", license: "MIT", url: "https://github.com/ibezkrovnyi/image-quantization" },
      { name: "UTIF.js", author: "Ivan Kutskir", license: "MIT", url: "https://github.com/photopea/UTIF.js" },
      { name: "fflate", author: "Arjun Barrett (101arrowz)", license: "MIT", url: "https://github.com/101arrowz/fflate" },
      { name: "@jsquash/avif, @jsquash/jxl, @jsquash/webp, @jsquash/oxipng, @jsquash/jpeg & @jsquash/resize", author: "Jamie Sinclair and jSquash contributors", license: "Apache-2.0", url: "https://github.com/jamsinclair/jSquash" },
      { name: "clsx", author: "Luke Edwards", license: "MIT", url: "https://github.com/lukeed/clsx" },
      { name: "tailwind-merge", author: "Danylo and contributors", license: "MIT", url: "https://github.com/dcastil/tailwind-merge" },
      { name: "perfect-freehand", author: "Steveruizok", license: "MIT", url: "https://github.com/steveruizok/perfect-freehand" },
      { name: "react-player", author: "Pete Cook", license: "MIT", url: "https://github.com/cookpete/react-player" },
      { name: "youtube-video-element", author: "Mux, Inc.", license: "MIT", url: "https://github.com/muxinc/youtube-video-element" },
      { name: "ag-psd", author: "Kirill Zolotarev", license: "MIT", url: "https://github.com/Agamnentzar/ag-psd" },
      { name: "woff2-encoder", author: "Google and contributors (port by itskyedo)", license: "MIT", url: "https://github.com/itskyedo/woff2-encoder" },
      { name: "jsQR", author: "Linus Unnebäck", license: "Apache-2.0", url: "https://github.com/cozmo/jsQR" },
      { name: "QR Code Styling", author: "Denys Kozak", license: "MIT", url: "https://github.com/kozakdenys/qr-code-styling" },
      { name: "ONNX Runtime Web", author: "Microsoft Corporation", license: "MIT", url: "https://github.com/microsoft/onnxruntime" },
      { name: "i18next", author: "Jan Mühlemann and i18next contributors", license: "MIT", url: "https://www.i18next.com/" },
      { name: "react-i18next", author: "Jan Mühlemann and i18next contributors", license: "MIT", url: "https://react.i18next.com/" },
      { name: "pdfjs-dist (PDF.js)", author: "Mozilla and individual contributors", license: "Apache-2.0", url: "https://github.com/mozilla/pdf.js" }
    ]
  },
  {
    id: "ai-models",
    label: "AI Models & Engines",
    items: [
      { name: "Transformers.js", author: "Hugging Face and contributors", license: "Apache-2.0", url: "https://github.com/huggingface/transformers.js" },
      { name: "BiRefNet", author: "ZhengPeng7 and contributors", license: "MIT", url: "https://huggingface.co/ZhengPeng7/BiRefNet" },
      { name: "ORMBG", author: "ONNX Community and contributors", license: "MIT", url: "https://huggingface.co/onnx-community/ormbg-ONNX" },
      { name: "MODNet", author: "ONNX Community and contributors", license: "Apache-2.0", url: "https://huggingface.co/onnx-community/modnet-webnn" },
      { name: "Selfie Segmenter", author: "Google and ONNX Community", license: "Apache-2.0", url: "https://huggingface.co/onnx-community/mediapipe_selfie_segmentation" },
      { name: "Swin2SR", author: "Marcos Conde and mv-lab", license: "Apache-2.0", url: "https://github.com/mv-lab/swin2sr" },
      { name: "APISR", author: "Kiteretsu77 and contributors", license: "Apache-2.0", url: "https://github.com/Kiteretsu77/APISR" }
    ]
  },
  {
    id: "fonts",
    label: "Google Fonts Library",
    items: [
      { name: "Roboto", author: "Google", license: "Apache-2.0", url: "https://fonts.google.com/specimen/Roboto" },
      { name: "Open Sans", author: "Steve Matteson", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Open+Sans" },
      { name: "Montserrat", author: "Julieta Ulanovsky", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Montserrat" },
      { name: "Lato", author: "Łukasz Dziedzic", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Lato" },
      { name: "Poppins", author: "Indian Type Foundry", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Poppins" },
      { name: "Inter", author: "Rasmus Andersson", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Inter" },
      { name: "Oswald", author: "Vernon Adams", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Oswald" },
      { name: "Raleway", author: "Matt McInerney", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Raleway" },
      { name: "Nunito", author: "Vernon Adams", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Nunito" },
      { name: "Merriweather", author: "Sorkin Type", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Merriweather" },
      { name: "Playfair Display", author: "Claus Eggers Sørensen", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Playfair+Display" },
      { name: "Ubuntu", author: "Canonical Ltd", license: "Ubuntu-Font-License-1.0", url: "https://fonts.google.com/specimen/Ubuntu" },
      { name: "Source Sans 3", author: "Adobe", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Source+Sans+3" },
      { name: "Bebas Neue", author: "Ryoichi Tsunekawa", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Bebas+Neue" },
      { name: "Dancing Script", author: "Pablo Impallari", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Dancing+Script" },
      { name: "Pacifico", author: "Vernon Adams", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Pacifico" },
      { name: "Abril Fatface", author: "TypeTogether", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Abril+Fatface" },
      { name: "Lobster", author: "Impallari Type", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Lobster" },
      { name: "Quicksand", author: "Andrew Paglinawan", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Quicksand" },
      { name: "Comfortaa", author: "Johan Aakerlund", license: "OFL-1.1", url: "https://fonts.google.com/specimen/Comfortaa" }
    ]
  },
  {
    id: "media",
    label: "Media & Illustrations",
    items: [
      {
        name: "QR Generator Illustration",
        author: "vectorjuice",
        license: "Freepik License",
        url: "https://www.freepik.com/free-vector/barcode-reading-app-qrcode-reader-epayment-transaction-application-qr-code-scanner-qr-generator-online-qr-code-payment-concept-pinkish-coral-bluevector-isolated-illustration_11667310.htm",
        image: "/assets/images/illustrations/qr-generator.svg"
      },
      {
        name: "QR Reader Illustration",
        author: "freepik",
        license: "Freepik License",
        url: "https://www.freepik.com/free-vector/smartphone-scanning-qr-code-illustration_9543267.htm",
        image: "/assets/images/illustrations/qr-reader.svg"
      },
      {
        name: "SEO Scanner Illustration",
        author: "jcomp",
        license: "Freepik License",
        url: "https://www.freepik.com/free-vector/work-office-computer-man-woman-business-character-marketing-online-employee-technology-business-man-cartoon-co-working-flat-design-freelance_13744794.htm",
        image: "/assets/images/illustrations/seo-audit.svg"
      },
      {
        name: "Background Remover Demo Image",
        author: "Wellington Ferreira",
        license: "Unsplash License",
        url: "https://unsplash.com/photos/a-man-with-a-goatee-smiles-at-the-camera-72TE8cWKXRY",
        image: "/assets/features/preview-background_remover-1.webp"
      }
    ]
  }
]
