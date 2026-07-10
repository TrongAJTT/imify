"use client"

import React, { useEffect, useState } from "react"
import { RefreshCw, Sparkles, X } from "lucide-react"
import { Button } from "@imify/ui/ui/button"
import { PWA_UPDATE_EVENT } from "./registration"

export function PwaUpdateNotice() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleUpdate = (event: any) => {
      setRegistration(event.detail)
      setIsVisible(true)
    }

    window.addEventListener(PWA_UPDATE_EVENT, handleUpdate)
    return () => window.removeEventListener(PWA_UPDATE_EVENT, handleUpdate)
  }, [])

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" })
    }
    
    // The service worker will skip waiting and the page will reload
    // We listen for the controllerchange event to reload
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload()
    })

    // Fallback reload if controllerchange doesn't fire promptly
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md">
      <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl shadow-2xl border border-white/10 p-4 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
          <Sparkles size={20} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold">New update available!</div>
          <div className="text-xs text-slate-400 truncate">Refresh to get the latest features of Imify.</div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="primary" 
            size="sm" 
            className="h-8 px-3 text-xs gap-1.5"
            onClick={handleUpdate}
          >
            <RefreshCw size={14} />
            Update
          </Button>
          <button 
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white/10 rounded-lg text-slate-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
