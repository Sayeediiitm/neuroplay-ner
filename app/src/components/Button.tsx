import React, { ButtonHTMLAttributes, PropsWithChildren } from "react";

export interface ButtonProps extends PropsWithChildren, ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variant controls colour scheme */
  variant?: "primary" | "secondary" | "accent";
}

/**
 * Button – tactile, slightly raised, with a depressed state.
 * Uses Tailwind arbitrary values for 3‑D effect.
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  className = "",
  ...rest
}) => {
  const variantStyles: Record<string, string> = {
    primary: "bg-soft-mint text-deep-navy",
    secondary: "bg-lavender text-deep-navy",
    accent: "bg-warm-coral text-deep-navy",
  };

  return (
    <button
      {...rest}
      className={`relative ${variantStyles[variant]} rounded-xl px-5 py-2.5 text-base font-medium
        shadow-[0_4px_6px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_12px_rgba(0,0,0,0.12)] active:translate-y-[2px]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-soft-mint
        transition-all duration-150 ease-out ${className}`}
    >
      {children}
    </button>
  );
};

