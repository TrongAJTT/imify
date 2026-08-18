import type { Metadata, Viewport } from "next"
import "./globals.css"
import { AppProviders } from "./app-providers"
import { WebFooter } from "@/components/layout/web-footer"
import { WebHeader } from "@/components/layout/web-header"
import { WorkspaceLayout } from "@/components/layout/workspace-layout"
import { PwaRegistration } from "@/components/pwa/registration"
import { ChunkErrorRecovery } from "@/components/pwa/chunk-error-recovery"
import { FEATURE_MEDIA_ASSET_PATHS } from "@imify/features/shared/media-assets"
import { DEFAULT_OG_IMAGE, IMIFY_LINKS } from "@imify/core/links"
import { HOME_SEO_DESCRIPTION } from "./seo-metadata"

export const metadata: Metadata = {
  metadataBase: new URL(IMIFY_LINKS.website),
  title: {
    default: "Imify",
    template: "%s | Imify"
  },
  description: HOME_SEO_DESCRIPTION,
  manifest: "/manifest.json",
  icons: {
    icon: FEATURE_MEDIA_ASSET_PATHS.brand.imifyLogoPng,
    shortcut: FEATURE_MEDIA_ASSET_PATHS.brand.imifyLogoPng,
    apple: FEATURE_MEDIA_ASSET_PATHS.brand.imifyLogoPng
  },
  openGraph: {
    type: "website",
    siteName: "Imify",
    title: "Imify - Privacy-First Image Toolkit",
    description: HOME_SEO_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        alt: "Imify - Fast, Privacy-First Image Processing"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Imify - Privacy-First Image Toolkit",
    description: HOME_SEO_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Imify"
  },
  formatDetection: {
    telephone: false
  }
}

export const viewport: Viewport = {
  themeColor: "#4f46e5"
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AppProviders>
          <ChunkErrorRecovery />
          <PwaRegistration />
          <WebHeader />
          <WorkspaceLayout>{children}</WorkspaceLayout>
          <WebFooter />
        </AppProviders>
      </body>
    </html>
  )
}
