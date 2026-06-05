import React from "react";

interface IconProps {
  className?: string;
}

// Dot Pattern Icons
export const DotSquareIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <rect x="4" y="4" width="6" height="6" />
    <rect x="14" y="4" width="6" height="6" />
    <rect x="4" y="14" width="6" height="6" />
    <rect x="14" y="14" width="6" height="6" />
  </svg>
);

export const DotDotsIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="7" cy="7" r="3.5" />
    <circle cx="17" cy="7" r="3.5" />
    <circle cx="7" cy="17" r="3.5" />
    <circle cx="17" cy="17" r="3.5" />
  </svg>
);

export const DotRoundedIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <rect x="4" y="4" width="6" height="16" rx="1.5" />
    <circle cx="17" cy="7" r="3" />
    <circle cx="17" cy="17" r="3" />
  </svg>
);

export const DotExtraRoundedIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <rect x="4" y="4" width="6" height="16" rx="3" />
    <circle cx="17" cy="7" r="3" />
    <circle cx="17" cy="17" r="3" />
  </svg>
);

export const DotClassyIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M 7 4 L 10 4 L 10 7 A 3 3 0 0 1 7 10 L 4 10 L 4 7 A 3 3 0 0 1 7 4 Z" />
    <path d="M 17 4 L 20 4 L 20 7 A 3 3 0 0 1 17 10 L 14 10 L 14 7 A 3 3 0 0 1 17 4 Z" />
    <path d="M 7 14 L 10 14 L 10 17 A 3 3 0 0 1 7 20 L 4 20 L 4 17 A 3 3 0 0 1 7 14 Z" />
    <path d="M 17 14 L 20 14 L 20 17 A 3 3 0 0 1 17 20 L 14 20 L 14 17 A 3 3 0 0 1 17 14 Z" />
  </svg>
);

export const DotClassyRoundedIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M 7 4 L 10 4 L 10 17 A 3 3 0 0 1 7 20 L 4 20 L 4 7 A 3 3 0 0 1 7 4 Z" />
    <path d="M 17 4 L 20 4 L 20 7 A 3 3 0 0 1 17 10 L 14 10 L 14 7 A 3 3 0 0 1 17 4 Z" />
    <path d="M 17 14 L 20 14 L 20 17 A 3 3 0 0 1 17 20 L 14 20 L 14 17 A 3 3 0 0 1 17 14 Z" />
  </svg>
);

// Marker Border Icons
export const MarkerBorderSquareIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    className={className}
  >
    <rect x="5" y="5" width="14" height="14" />
  </svg>
);

export const MarkerBorderDotIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    className={className}
  >
    <circle cx="12" cy="12" r="8" />
  </svg>
);

export const MarkerBorderExtraRoundedIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    className={className}
  >
    <rect x="5" y="5" width="14" height="14" rx="4" />
  </svg>
);

// Marker Center Icons
export const MarkerCenterSquareIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <rect x="7" y="7" width="10" height="10" />
  </svg>
);

export const MarkerCenterDotIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="12" cy="12" r="5" />
  </svg>
);

// Frame Icons
export const FrameNoneIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    className={className}
  >
    <line x1="4" y1="4" x2="20" y2="20" />
    <line x1="4" y1="20" x2="20" y2="4" />
  </svg>
);

export const FrameBorderIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    className={className}
  >
    <rect x="4" y="4" width="16" height="16" />
    <rect
      x="7"
      y="7"
      width="10"
      height="10"
      fill="currentColor"
      stroke="none"
    />
  </svg>
);

export const FrameBottomIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4 2C2.895 2 2 2.895 2 4V20C2 21.105 2.895 22 4 22H20C21.105 22 22 21.105 22 20V4C22 2.895 21.105 2 20 2H4ZM4 4H20V16H4V4ZM8 18H16V19.5H8V18Z"
    />
    <rect x="6" y="6" width="3" height="3" />
    <rect x="15" y="6" width="3" height="3" />
    <rect x="6" y="11" width="3" height="3" />
  </svg>
);

export const FrameTopIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4 2C2.895 2 2 2.895 2 4V20C2 21.105 2.895 22 4 22H20C21.105 22 22 21.105 22 20V4C22 2.895 21.105 2 20 2H4Z M4 8H20V20H4V8Z M8 4.5H16V6H8V4.5Z"
    />

    <rect x="6" y="10" width="3" height="3" />
    <rect x="15" y="10" width="3" height="3" />
    <rect x="6" y="15" width="3" height="3" />
  </svg>
);

export const FrameTooltipIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4 2C2.895 2 2 2.895 2 4V18C2 19.105 2.895 20 4 20H9.5L12 23L14.5 20H20C21.105 20 22 19.105 22 18V4C22 2.895 21.105 2 20 2H4ZM4 4H20V15H4V4ZM7 16.5H17V18.5H7V16.5Z"
    />

    <rect x="5.5" y="5.5" width="3.5" height="3.5" />
    <rect x="15" y="5.5" width="3.5" height="3.5" />
    <rect x="5.5" y="10" width="3.5" height="3.5" />
  </svg>
);

export const FrameRibbonIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2 2H22V8L19 5.5H5L2 8V2ZM7 3.5H17V4.5H7V3.5Z"
    />

    <rect x="5.5" y="9" width="3.5" height="3.5" />
    <rect x="15" y="9" width="3.5" height="3.5" />
    <rect x="5.5" y="16.5" width="3.5" height="3.5" />

    <rect x="15" y="16.5" width="1.5" height="1.5" />
    <rect x="17" y="18.5" width="1.5" height="1.5" />
  </svg>
);
