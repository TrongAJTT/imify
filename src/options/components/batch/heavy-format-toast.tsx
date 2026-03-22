import { useEffect, useState } from "react"
import { AlertTriangle, X } from "lucide-react"

interface HeavyFormatToastProps {
  format: string
  duration?: number
  onClose: () => void
}

export function HeavyFormatToast({ format, duration = 6000, onClose }: HeavyFormatToastProps) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)

      if (elapsed >= duration) {
        clearInterval(interval)
        onClose()
      }
    }, 10)

    return () => clearInterval(interval)
  }, [duration, onClose])

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-amber-600 text-white rounded-xl shadow-2xl border border-amber-500/50 overflow-hidden animate-in slide-in-from-right-full duration-300 z-[2147483647]">
      <div className="p-4 relative">
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X size={14} />
        </button>

        <div className="flex items-start gap-3 mt-1">
          <div className="bg-white/20 p-2 rounded-full shrink-0">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div className="pr-4">
            <p className="font-bold text-[14px] leading-tight mb-1">{format} encoding is very heavy</p>
            <p className="text-[12px] text-amber-50 leading-relaxed">
              If you're on a low-spec PC, please lower the Concurrency to 1 or 2 to prevent your browser from freezing!
            </p>
          </div>
        </div>
      </div>
      
      {/* Countdown Progress Bar */}
      <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full origin-left">
        <div 
          className="h-full bg-white/60 transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
