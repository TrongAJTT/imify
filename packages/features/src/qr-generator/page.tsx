"use client"

import React, { type ReactNode } from "react"

interface SharedQrGeneratorPageProps {
  renderWorkspace: () => ReactNode
}

export function SharedQrGeneratorPage({
  renderWorkspace
}: SharedQrGeneratorPageProps) {
  return <>{renderWorkspace()}</>
}
