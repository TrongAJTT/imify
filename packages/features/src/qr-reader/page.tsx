"use client"

import React, { type ReactNode } from "react"

interface SharedQrReaderPageProps {
  renderWorkspace: () => ReactNode
}

export function SharedQrReaderPage({
  renderWorkspace
}: SharedQrReaderPageProps) {
  return <>{renderWorkspace()}</>
}
