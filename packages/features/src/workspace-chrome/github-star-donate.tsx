"use client";

import React, { useEffect, useState } from "react";
import { Github, Heart, Star } from "lucide-react";
import { IMIFY_LINKS } from "@imify/core";
import { Tooltip } from "../shared/tooltip";

const GITHUB_STARS_CACHE_KEY = "imify-github-stars-cache";
const CACHE_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours

interface StarsCache {
  count: string;
  timestamp: number;
}

export function useGithubStars() {
  const [stars, setStars] = useState<string>("-");

  useEffect(() => {
    let active = true;

    const getCachedStars = (): string | null => {
      if (typeof window === "undefined") return null;
      try {
        const raw = localStorage.getItem(GITHUB_STARS_CACHE_KEY);
        if (!raw) return null;
        const cache = JSON.parse(raw) as StarsCache;
        const now = Date.now();
        if (now - cache.timestamp < CACHE_DURATION_MS) {
          return cache.count;
        }
      } catch (e) {
        console.error("Failed to read github stars cache:", e);
      }
      return null;
    };

    const setCachedStars = (count: string) => {
      if (typeof window === "undefined") return;
      try {
        const cache: StarsCache = {
          count,
          timestamp: Date.now(),
        };
        localStorage.setItem(GITHUB_STARS_CACHE_KEY, JSON.stringify(cache));
      } catch (e) {
        console.error("Failed to write github stars cache:", e);
      }
    };

    const cached = getCachedStars();
    if (cached) {
      setStars(cached);
      return;
    }

    fetch("https://api.github.com/repos/TrongAJTT/imify")
      .then((res) => {
        if (!res.ok) throw new Error("API Limit or Network Error");
        return res.json();
      })
      .then((data) => {
        if (active && typeof data.stargazers_count === "number") {
          const targetStars = data.stargazers_count;
          const targetStarsStr = targetStars.toLocaleString();

          setCachedStars(targetStarsStr);

          const duration = 2000; // 2 seconds
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            if (!active) return;

            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentStars = Math.floor(easeProgress * targetStars);

            setStars(currentStars.toLocaleString());

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        }
      })
      .catch(() => {
        if (active) {
          setStars("-");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return stars;
}

interface GithubStarDonateProps {
  onOpenDonate: () => void;
}

export function GithubStarDonate({ onOpenDonate }: GithubStarDonateProps) {
  const stars = useGithubStars();

  return (
    <div className="inline-flex items-center h-9 rounded-xl border border-slate-300 bg-slate-50/50 p-0.5 hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700 transition-colors select-none">
      {/* GitHub Stars */}
      <Tooltip content="Star us on GitHub">
        <a
          href={IMIFY_LINKS.repository}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 h-full pl-3 pr-2.5 rounded-l-full text-[11px] font-bold text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
        >
          <Github
            size={14}
            className="shrink-0 text-slate-400 dark:text-slate-400"
          />
          <span className="tabular-nums min-w-[8px] text-center font-bold">
            {stars}
          </span>
          <Star
            size={13}
            className="text-amber-400 dark:text-amber-500 fill-amber-400 dark:fill-amber-500 shrink-0"
          />
        </a>
      </Tooltip>

      {/* Vertical Divider */}
      <div className="w-px h-4 bg-slate-300 dark:bg-slate-800 self-center shrink-0" />

      {/* Donate Button */}
      <Tooltip content="Support the dev">
        <button
          type="button"
          onClick={onOpenDonate}
          className="flex items-center justify-center w-9 h-full rounded-r-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-rose-500 dark:hover:text-rose-400 transition-colors group"
        >
          <Heart
            size={14}
            className="fill-rose-400 stroke-rose-400 dark:fill-rose-600 dark:stroke-rose-600 group-hover:scale-125 transition-transform duration-200"
          />
        </button>
      </Tooltip>
    </div>
  );
}
