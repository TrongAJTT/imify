import type React from "react";
import { create } from "zustand";

export interface ImportProgressOptions {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  totalCount?: number;
}

interface ImportProgressState {
  isOpen: boolean;
  title: React.ReactNode | null;
  subtitle: React.ReactNode | null;
  totalCount: number;
  processedCount: number;
  currentFileName: string | null;

  openImport: (options?: ImportProgressOptions) => void;
  updateImport: (
    processedCount: number,
    total?: number,
    currentFileName?: string,
  ) => void;
  closeImport: () => void;
}

export const useImportProgressStore = create<ImportProgressState>((set) => ({
  isOpen: false,
  title: null,
  subtitle: null,
  totalCount: 0,
  processedCount: 0,
  currentFileName: null,

  openImport: (options?: ImportProgressOptions) => {
    set({
      isOpen: true,
      title: options?.title ?? null,
      subtitle: options?.subtitle ?? null,
      totalCount: options?.totalCount ?? 0,
      processedCount: 0,
      currentFileName: null,
    });
  },

  updateImport: (
    processedCount: number,
    total?: number,
    currentFileName?: string,
  ) => {
    set((state) => ({
      processedCount,
      totalCount: total !== undefined ? total : state.totalCount,
      currentFileName:
        currentFileName !== undefined ? currentFileName : state.currentFileName,
    }));
  },

  closeImport: () => {
    set({
      isOpen: false,
      title: null,
      subtitle: null,
      totalCount: 0,
      processedCount: 0,
      currentFileName: null,
    });
  },
}));

// Helper direct actions
export const openImportProgress = (options?: ImportProgressOptions) =>
  useImportProgressStore.getState().openImport(options);

export const updateImportProgress = (
  processedCount: number,
  total?: number,
  currentFileName?: string,
) =>
  useImportProgressStore
    .getState()
    .updateImport(processedCount, total, currentFileName);

export const closeImportProgress = () =>
  useImportProgressStore.getState().closeImport();
