import type { Metadata } from "next"
import "./globals.css"
import { AppProviders } from "./app-providers"
import { WebFooter } from "@/components/layout/web-footer"
import { WebHeader } from "@/components/layout/web-header"
import { WorkspaceLayout } from "@/components/layout/workspace-layout"

export const metadata: Metadata = {
  title: "Imify Web",
  description: "Web workspace for Imify image tools."
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
          <WebHeader />
          <WorkspaceLayout>{children}</WorkspaceLayout>
          <WebFooter />
        </AppProviders>
      </body>
    </html>
  )
}
