import { create } from "zustand";
import type { ConversionProgressPayload } from "@imify/core/types";
import {
  type ToastPayload,
  mapConversionPayloadToToast,
} from "@imify/core/hooks/use-toast";

interface ToastState {
  toasts: ToastPayload[];
  showToast: (payload: Omit<ToastPayload, "id"> | ToastPayload) => string;
  dismissToast: (id: string) => void;
  showProgressToast: (payload: ConversionProgressPayload) => string;
  clearAllToasts: () => void;
}

const timerMap = new Map<string, ReturnType<typeof setTimeout>>();

function clearToastTimer(id: string) {
  const existing = timerMap.get(id);
  if (existing) {
    clearTimeout(existing);
    timerMap.delete(id);
  }
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  showToast: (payload) => {
    const toastId =
      "id" in payload && payload.id
        ? payload.id
        : `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    clearToastTimer(toastId);

    const fullPayload: ToastPayload = {
      duration: 2000,
      ...payload,
      id: toastId,
    };

    set((state) => {
      const existingIndex = state.toasts.findIndex((t) => t.id === toastId);
      if (existingIndex >= 0) {
        const next = [...state.toasts];
        next[existingIndex] = fullPayload;
        return { toasts: next };
      }
      return { toasts: [...state.toasts, fullPayload] };
    });

    if (fullPayload.duration && fullPayload.duration > 0) {
      const timer = setTimeout(() => {
        get().dismissToast(toastId);
      }, fullPayload.duration);
      timerMap.set(toastId, timer);
    }

    return toastId;
  },

  dismissToast: (id) => {
    clearToastTimer(id);
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  showProgressToast: (payload) => {
    const toastPayload = mapConversionPayloadToToast(payload);
    return get().showToast(toastPayload);
  },

  clearAllToasts: () => {
    timerMap.forEach((t) => clearTimeout(t));
    timerMap.clear();
    set({ toasts: [] });
  },
}));

/**
 * Universal Toast Singleton API
 * Usable anywhere in React components, event listeners, or async utils.
 */
export const toast = {
  show: (payload: Omit<ToastPayload, "id"> | ToastPayload) =>
    useToastStore.getState().showToast(payload),

  success: (title: string, message?: string, duration = 3000) =>
    useToastStore.getState().showToast({
      type: "success",
      title,
      message,
      duration,
    }),

  error: (title: string, message?: string, duration = 15000) =>
    useToastStore.getState().showToast({
      type: "error",
      title,
      message,
      duration,
    }),

  warning: (title: string, message?: string, duration = 4000) =>
    useToastStore.getState().showToast({
      type: "warning",
      title,
      message,
      duration,
    }),

  info: (title: string, message?: string, duration = 2500) =>
    useToastStore.getState().showToast({
      type: "notification",
      title,
      message,
      duration,
    }),

  colorCopied: (hex: string, duration = 2000) =>
    useToastStore.getState().showToast({
      type: "color-chip",
      title: "Color copied",
      chipText: hex,
      duration,
    }),

  copyFailed: (reason?: string, duration = 15000) =>
    useToastStore.getState().showToast({
      type: "error",
      title: "Copy failed",
      message: reason ?? "Clipboard access was denied.",
      duration,
    }),

  progress: (payload: ConversionProgressPayload) =>
    useToastStore.getState().showProgressToast(payload),

  dismiss: (id: string) => useToastStore.getState().dismissToast(id),

  clear: () => useToastStore.getState().clearAllToasts(),
};
