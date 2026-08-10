"use client";

import React, { useMemo } from "react";
import { CollageMakerWorkspace } from "@imify/features/collage-maker/workspace";
import { useWorkspaceSidebar } from "@/components/layout/workspace-layout";
import { CollageMakerInfoPanel } from "@imify/features/collage-maker/collage-maker-info-panel";
import { useTranslation } from "@imify/i18n";

export function CollageMakerLandingPage() {
  const { t } = useTranslation("collageMaker");
  const sidebar = useMemo(() => <CollageMakerInfoPanel />, []);
  useWorkspaceSidebar(sidebar, t("showcase.title", { defaultValue: "Ghép ảnh nhanh (Collage Maker)" }));

  return <CollageMakerWorkspace />;
}
