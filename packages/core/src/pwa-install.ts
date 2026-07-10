"use client";

let deferredPrompt: any = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
  });
}

export function isPwaInstallable(): boolean {
  return deferredPrompt !== null;
}

export async function triggerPwaInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    return false;
  }
  try {
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // We've used the prompt, and can't use it again, discard it
    deferredPrompt = null;
    return outcome === "accepted";
  } catch (err) {
    console.error("Failed to prompt PWA installation:", err);
    return false;
  }
}
