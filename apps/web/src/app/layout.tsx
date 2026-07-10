import type { Metadata, Viewport } from "next"
import "./globals.css"
import { AppProviders } from "./app-providers"
import { WebFooter } from "@/components/layout/web-footer"
import { WebHeader } from "@/components/layout/web-header"
import { WorkspaceLayout } from "@/components/layout/workspace-layout"
import { PwaRegistration } from "@/components/pwa/registration"
import { PwaUpdateNotice } from "@/components/pwa/update-notice"
import { FEATURE_MEDIA_ASSET_PATHS } from "@imify/features/shared/media-assets"
import { WEB_ROUTE_METADATA } from "./seo-metadata"

export const metadata: Metadata = {
  title: {
    default: "Imify",
    template: "%s | Imify"
  },
  description: WEB_ROUTE_METADATA.home.description,
  manifest: "/manifest.json",
  icons: {
    icon: FEATURE_MEDIA_ASSET_PATHS.brand.imifyLogoPng,
    shortcut: FEATURE_MEDIA_ASSET_PATHS.brand.imifyLogoPng,
    apple: FEATURE_MEDIA_ASSET_PATHS.brand.imifyLogoPng
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
          <PwaRegistration />
          <PwaUpdateNotice />
          <WebHeader />
          <WorkspaceLayout>{children}</WorkspaceLayout>
          <WebFooter />
        </AppProviders>
      </body>
    </html>
  )
}
