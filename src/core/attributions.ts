export interface AttributionItem {
  name: string
  author: string
  license: string
  url: string
}

// Source of truth for open-source acknowledgements.
export const ATTRIBUTIONS: AttributionItem[] = [
  { name: "React", author: "Meta Platforms, Inc. and contributors", license: "MIT", url: "https://react.dev/" },
  { name: "Plasmo", author: "Plasmo Corp.", license: "MIT", url: "https://docs.plasmo.com/" },
  { name: "Tailwind CSS", author: "Tailwind Labs, Inc.", license: "MIT", url: "https://tailwindcss.com/" },
  { name: "Lucide React", author: "Eric Fennis and Lucide contributors", license: "ISC", url: "https://lucide.dev/" },
  { name: "Radix UI", author: "Modulz Inc. and Radix UI contributors", license: "MIT", url: "https://www.radix-ui.com/" },
  { name: "Zustand", author: "Paul Henschel and Poimandres contributors", license: "MIT", url: "https://github.com/pmndrs/zustand" },
  { name: "dnd-kit", author: "Claudéric Demers", license: "MIT", url: "https://dndkit.com/" },
  { name: "react-colorful", author: "Vlad Shilov and contributors", license: "MIT", url: "https://github.com/omgovich/react-colorful" },
  { name: "idb", author: "Jake Archibald", license: "ISC", url: "https://github.com/jakearchibald/idb" },
  { name: "pdf-lib", author: "Andrew Dillon", license: "MIT", url: "https://pdf-lib.js.org/" },
  { name: "UPNG.js", author: "Ivan Kutskir", license: "MIT", url: "https://github.com/photopea/UPNG.js" },
  { name: "image-q", author: "Igor Bezkrovnyi", license: "MIT", url: "https://github.com/ibezkrovnyi/image-quantization" },
  { name: "UTIF.js", author: "Ivan Kutskir", license: "MIT", url: "https://github.com/photopea/UTIF.js" },
  { name: "fflate", author: "Arjun Barrett (101arrowz)", license: "MIT", url: "https://github.com/101arrowz/fflate" },
  { name: "@jsquash/avif, @jsquash/jxl & @jsquash/oxipng", author: "Jamie Sinclair and jSquash contributors", license: "Apache-2.0", url: "https://github.com/jamsinclair/jSquash" },
  { name: "clsx", author: "Luke Edwards", license: "MIT", url: "https://github.com/lukeed/clsx" },
  { name: "tailwind-merge", author: "Danylo and contributors", license: "MIT", url: "https://github.com/dcastil/tailwind-merge" }
]
