"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { WorkspaceShell } from "./workspace-shell";
import { useWebPageMode } from "@/hooks/use-web-page-mode";

interface WorkspaceSidebarContextValue {
  setRightSidebar: (sidebar: React.ReactNode | null) => void;
  setRightSidebarTitle: (title: string | null) => void;
}

const WorkspaceSidebarContext =
  createContext<WorkspaceSidebarContextValue | null>(null);

export function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { isExtensionPage, isMonolithicPage } = useWebPageMode();
  const [rightSidebar, setRightSidebar] = useState<React.ReactNode | null>(
    null,
  );
  const [rightSidebarTitle, setRightSidebarTitle] = useState<string | null>(
    null,
  );

  const contextValue = useMemo<WorkspaceSidebarContextValue>(
    () => ({
      setRightSidebar,
      setRightSidebarTitle,
    }),
    [],
  );

  return (
    <WorkspaceSidebarContext.Provider value={contextValue}>
      {isMonolithicPage ? (
        <main
          className={`flex w-full flex-1 ${isExtensionPage ? "py-0" : "py-6 md:py-10"} ${isExtensionPage ? "" : "px-0 md:px-6"}`}
        >
          <div
            className={`w-full ${isExtensionPage ? "" : "mx-auto max-w-6xl"}`}
          >
            {children}
          </div>
        </main>
      ) : (
        <WorkspaceShell
          rightSidebar={rightSidebar}
          title={rightSidebarTitle ?? "Configuration"}
        >
          {children}
        </WorkspaceShell>
      )}
    </WorkspaceSidebarContext.Provider>
  );
}

export function useWorkspaceSidebar(
  sidebar: React.ReactNode | null,
  title: string | null = null,
): void {
  const context = useContext(WorkspaceSidebarContext);

  useEffect(() => {
    if (!context) {
      return;
    }
    context.setRightSidebar(sidebar);
    context.setRightSidebarTitle(title);
  }, [context, sidebar, title]);

  useEffect(() => {
    if (!context) {
      return;
    }
    return () => {
      context.setRightSidebar(null);
      context.setRightSidebarTitle(null);
    };
  }, [context]);
}

export function useWorkspaceSidebarContext() {
  return useContext(WorkspaceSidebarContext);
}
