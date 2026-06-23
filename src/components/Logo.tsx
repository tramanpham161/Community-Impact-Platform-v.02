import React from "react";

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function Logo({ className = "", size = "md" }: LogoProps) {
  // Map size to dimensions
  const dims = {
    sm: { width: 45, height: 30 },
    md: { width: 60, height: 40 },
    lg: { width: 90, height: 60 },
  }[size];

  return (
    <svg
      width={dims.width}
      height={dims.height}
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none ${className}`}
      aria-label="AHA Logo"
    >
      {/* Top Row Blocks */}
      <rect x={0} y={0} width={40} height={40} fill="#2BB7BA" />
      <rect x={40} y={0} width={40} height={40} fill="#FFFFFF" />
      <rect x={80} y={0} width={40} height={40} fill="#3AB03A" />

      {/* Bottom Row Blocks */}
      <rect x={0} y={40} width={40} height={40} fill="#FF9900" />
      <rect x={40} y={40} width={40} height={40} fill="#FFFFFF" />
      <rect x={80} y={40} width={40} height={40} fill="#969696" />

      {/* Styled Inner Elements (Stroke in Charcoal) */}
      {/* Top Middle Circle Head */}
      <circle
        cx={60}
        cy={20}
        r={13}
        stroke="#1A2521"
        strokeWidth={4.5}
        strokeLinecap="round"
      />

      {/* Continuous Horizontal Bar across the bottom row */}
      <line
        x1={6}
        y1={66}
        x2={114}
        y2={66}
        stroke="#1A2521"
        strokeWidth={4.5}
        strokeLinecap="round"
      />

      {/* Bottom Left "A" Shapes */}
      {/* Left diagonal leg */}
      <line
        x1={6}
        y1={76}
        x2={40}
        y2={40}
        stroke="#1A2521"
        strokeWidth={4.5}
        strokeLinecap="round"
      />
      {/* Right vertical leg (col-1 border) */}
      <line
        x1={40}
        y1={40}
        x2={40}
        y2={76}
        stroke="#1A2521"
        strokeWidth={4.5}
        strokeLinecap="round"
      />

      {/* Bottom Middle "H" Lines */}
      {/* Left vertical H leg */}
      <line
        x1={46}
        y1={40}
        x2={46}
        y2={76}
        stroke="#1A2521"
        strokeWidth={4.5}
        strokeLinecap="round"
      />
      {/* Right vertical H leg */}
      <line
        x1={74}
        y1={40}
        x2={74}
        y2={76}
        stroke="#1A2521"
        strokeWidth={4.5}
        strokeLinecap="round"
      />

      {/* Bottom Right "A" Shapes */}
      {/* Left vertical shape */}
      <line
        x1={80}
        y1={40}
        x2={80}
        y2={76}
        stroke="#1A2521"
        strokeWidth={4.5}
        strokeLinecap="round"
      />
      {/* Right diagonal leg */}
      <line
        x1={80}
        y1={40}
        x2={114}
        y2={76}
        stroke="#1A2521"
        strokeWidth={4.5}
        strokeLinecap="round"
      />
    </svg>
  );
}
