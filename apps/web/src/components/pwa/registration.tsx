"use client"

import { useEffect } from "react"

export const PWA_UPDATE_EVENT = "imify:pwa-update-available"

export function PwaRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    const registerServiceWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/"
        })
        console.log("PWA: Service Worker registered with scope:", reg.scope)

        reg.onupdatefound = () => {
          const installingWorker = reg.installing
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === "installed") {
                if (navigator.serviceWorker.controller) {
                  console.log("PWA: New update available, dispatching event.")
                  window.dispatchEvent(new CustomEvent(PWA_UPDATE_EVENT, { detail: reg }))
                } else {
                  console.log("PWA: Content is cached for offline use.")
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("PWA: Service Worker registration failed:", err)
      }
    }

    if (document.readyState === "complete") {
      registerServiceWorker()
    } else {
      window.addEventListener("load", registerServiceWorker)
      return () => window.removeEventListener("load", registerServiceWorker)
    }
  }, [])

  return null
}
