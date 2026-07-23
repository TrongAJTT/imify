"use client";

import React, { useState } from "react";
import type { Metadata } from "next";
import { CollageMakerWorkspace } from "@imify/features/collage-maker/workspace";
import { useWorkspaceSidebar } from "@/components/layout/workspace-layout";

export default function CollageMakerPage() {
  const [sidebarNode, setSidebarNode] = useState<React.ReactNode>(null);
  useWorkspaceSidebar(sidebarNode, "Ghép ảnh nhanh (Collage Maker)");

  return <CollageMakerWorkspace onSidebarChange={setSidebarNode} />;
}
