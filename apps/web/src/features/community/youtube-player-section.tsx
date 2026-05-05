"use client"

import React, { useRef, useState } from "react"
import ReactPlayer from "react-player"
import { IMIFY_LINKS } from "@imify/core"
import { Heading, BodyText } from "@imify/ui/ui/typography"
import { cn } from "@imify/ui/ui/utils"
import { Play } from "lucide-react"

const MILESTONES = [
  { id: "single", label: "Single Processor", seconds: 0 },
  { id: "batch", label: "Batch Processor", seconds: 8 },
  { id: "splitter", label: "Image Splitter", seconds: 21 },
  { id: "splicing", label: "Image Splicing", seconds: 41 },
  { id: "filling", label: "Image Filling", seconds: 51 },
  { id: "pattern", label: "Pattern Generator", seconds: 85 },
  { id: "diffchecker", label: "Diff Checker", seconds: 119 },
  { id: "inspector", label: "Image Inspector", seconds: 151 },
]

export function YoutubePlayerSection() {
  const playerRef = useRef<any>(null)
  const [playing, setPlaying] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleSeek = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime = seconds
      setPlaying(true)
    }
  }

  if (!isMounted) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-12 space-y-8">
        <div className="text-center space-y-3">
          <Heading className="text-3xl md:text-4xl">See Imify in Action</Heading>
          <BodyText className="mx-auto max-w-2xl text-slate-500 text-lg">
            Watch a brief showcase of all features available in Imify v2.1.
          </BodyText>
        </div>
        <div className="aspect-video w-full rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 space-y-8">
      <div className="text-center space-y-3">
        <Heading className="text-3xl md:text-4xl">See Imify in Action</Heading>
        <BodyText className="mx-auto max-w-2xl text-slate-500 text-lg">
          Watch a brief showcase of all features available in Imify v2.1.
        </BodyText>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {MILESTONES.map((milestone) => (
          <button
            key={milestone.id}
            onClick={() => handleSeek(milestone.seconds)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all",
              "bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-blue-900/40 dark:hover:text-blue-400",
              "border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
            )}
          >
            <Play size={12} fill="currentColor" />
            {milestone.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 md:p-4">
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900 shadow-inner relative group pointer-events-none">
          <ReactPlayer
            ref={playerRef}
            src={IMIFY_LINKS.videoDemo}
            width="100%"
            height="100%"
            playing={playing}
            muted={true}
            loop={true}
            controls={false}
            config={{
              youtube: {
                // @ts-ignore
                playerVars: {
                  autoplay: 1,
                  modestbranding: 1,
                  rel: 0,
                  controls: 0,
                  disablekb: 1,
                  iv_load_policy: 3,
                  enablejsapi: 1,
                  origin: typeof window !== 'undefined' ? window.location.origin : undefined
                } as any
              }
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
        </div>
      </div>
    </section>
  )
}
