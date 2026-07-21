"use client";

import React from "react";
import { PowerOff } from "lucide-react";
import { Button } from "@imify/ui/ui/button";
import { SettingsItemHeader } from "@imify/ui/ui/settings-item-header";
import { SettingsSectionHeader } from "@imify/ui/ui/settings-section-header";

interface AboutDevToolsProps {
  isMobileDialog: boolean;
  onDisableDevMode: () => void;
}

export function AboutDevTools({
  isMobileDialog,
  onDisableDevMode,
}: AboutDevToolsProps) {
  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      {!isMobileDialog && (
        <SettingsSectionHeader
          title="ABOUT DEVELOPER TOOLS"
          description="Welcome to the developer console. Learn about features and toggle settings."
        />
      )}

      <section className="space-y-4">
        <SettingsItemHeader
          title="What is Developer Mode?"
          description="Developer Mode grants access to diagnostics, capabilities mapping, dynamic logs, and custom locale management tools."
        />
        <div className="prose dark:prose-invert text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
          <p>
            This dashboard allows you to explore real-time reactive Zustand
            stores, inspect live stdout/stderr console prints, import/export
            system logs to facilitate debugging, and test localization
            templates.
          </p>
          <p>
            Imify handles all operations locally on your machine, ensuring data
            privacy is preserved while providing these developer monitors.
          </p>
        </div>
      </section>

      <section className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-5">
        <SettingsItemHeader
          title="DISABLE DEVELOPER MODE"
          description="Hide developer tools and disable debug features. Re-enable via the About dialog Easter Egg."
        />
        <Button
          variant="outline"
          className="w-full justify-start gap-2 rounded-lg border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={onDisableDevMode}
        >
          <PowerOff size={14} />
          Disable Developer Mode
        </Button>
      </section>
    </div>
  );
}
