import React, { PropsWithChildren } from "react";

export interface CardProps extends PropsWithChildren {
  /** Optional extra classes (e.g. width/height) */
  className?: string;
  /** Accessible label for the card */
  ariaLabel?: string;
}

/**
 * Card – a reusable 3‑D “chunky" container.
 *
 * Design:
 * - Perspective parent gives depth.
 * - Inner surface uses layered shadows + glassmorphism.
 * - Hover/active states simulate a physical object being pressed.
 */
export const Card: React.FC<CardProps> = ({
  className = "",
  ariaLabel,
  children,
}) => {
  return (
    <div
      className={`perspective-[1200px] ${className}`}
      aria-label={ariaLabel}
    >
      <div
        className={`relative rounded-xl bg-white/30 backdrop-blur-md border border-white/40 
          shadow-[0_4px_6px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_12px_rgba(0,0,0,0.12)]
          active:translate-y-[2px] transition-all duration-200 ease-out 
          will-change-transform transform-gpu p-4`}
      >
        {children}
      </div>
    </div>
  );
};

