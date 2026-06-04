import React from "react"

interface IconProps {
  className?: string
}

// Dot Pattern Icons
export const DotSquareIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <rect x="4" y="4" width="6" height="6" />
    <rect x="14" y="4" width="6" height="6" />
    <rect x="4" y="14" width="6" height="6" />
    <rect x="14" y="14" width="6" height="6" />
  </svg>
)

export const DotDotsIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="7" cy="7" r="3.5" />
    <circle cx="17" cy="7" r="3.5" />
    <circle cx="7" cy="17" r="3.5" />
    <circle cx="17" cy="17" r="3.5" />
  </svg>
)

export const DotRoundedIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <rect x="4" y="4" width="6" height="6" rx="1.5" />
    <rect x="14" y="4" width="6" height="6" rx="1.5" />
    <rect x="4" y="14" width="6" height="6" rx="1.5" />
    <rect x="14" y="14" width="6" height="6" rx="1.5" />
  </svg>
)

export const DotExtraRoundedIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <rect x="4" y="4" width="6" height="6" rx="3" />
    <rect x="14" y="4" width="6" height="6" rx="3" />
    <rect x="4" y="14" width="6" height="6" rx="3" />
    <rect x="14" y="14" width="6" height="6" rx="3" />
  </svg>
)

export const DotClassyIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M4,10 A6,6 0 0 1 10,4 L10,10 Z" />
    <path d="M14,10 A6,6 0 0 1 20,4 L20,10 Z" />
    <path d="M4,20 A6,6 0 0 1 10,14 L10,20 Z" />
    <path d="M14,20 A6,6 0 0 1 20,14 L20,20 Z" />
  </svg>
)

export const DotClassyRoundedIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M4,10 C4,6 6,4 10,4 L10,10 Z" />
    <path d="M14,10 C14,6 16,4 20,4 L20,10 Z" />
    <path d="M4,20 C4,16 6,14 10,14 L10,20 Z" />
    <path d="M14,20 C14,16 16,14 20,14 L20,20 Z" />
  </svg>
)

// Marker Border Icons
export const MarkerBorderSquareIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className}>
    <rect x="5" y="5" width="14" height="14" />
  </svg>
)

export const MarkerBorderDotIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className}>
    <circle cx="12" cy="12" r="8" />
  </svg>
)

export const MarkerBorderExtraRoundedIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className}>
    <rect x="5" y="5" width="14" height="14" rx="4" />
  </svg>
)

// Marker Center Icons
export const MarkerCenterSquareIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <rect x="7" y="7" width="10" height="10" />
  </svg>
)

export const MarkerCenterDotIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="12" cy="12" r="5" />
  </svg>
)
