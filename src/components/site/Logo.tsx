import logo from "@/assets/logo-flow-harmony.png";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

type LogoVariant = "auto" | "dark" | "light" | "onGradient";

interface LogoProps {
  /**
   * - `auto`: adapts to the surrounding section. Reads the CSS variable
   *   `--logo-filter` from the nearest ancestor that defines it (e.g.
   *   `.section-light`, `.section-dark`, `.section-gradient`). Falls back
   *   to the dark mark.
   * - `dark`: original dark mark, for clean light backgrounds.
   * - `light`: inverted white mark, for solid dark backgrounds.
   * - `onGradient`: dark mark wrapped in a soft frosted pill so it stays
   *   readable on top of vivid gradients or busy photography.
   */
  variant?: LogoVariant;
  className?: string;
  imgClassName?: string;
  alt?: string;
}

export function Logo({
  variant = "auto",
  className,
  imgClassName,
  alt = "Flow & Harmony",
}: LogoProps) {
  const filterClass =
    variant === "light"
      ? "[filter:brightness(0)_invert(1)]"
      : variant === "auto"
        ? "[filter:var(--logo-filter,none)]"
        : "";

  const dropShadow =
    variant === "auto"
      ? ({ "--logo-shadow": "drop-shadow(0 1px 2px rgb(0 0 0 / 0.15))" } as CSSProperties)
      : undefined;

  const img = (
    <img
      src={logo}
      alt={alt}
      style={dropShadow}
      className={cn(
        "h-full w-auto select-none transition-[filter] duration-300",
        filterClass,
        imgClassName,
      )}
      draggable={false}
    />
  );

  if (variant === "onGradient") {
    return (
      <div
        className={cn(
          "inline-flex h-12 items-center rounded-full bg-cream/85 px-4 backdrop-blur-md ring-1 ring-ink/5 shadow-sm",
          className,
        )}
      >
        {img}
      </div>
    );
  }

  return <div className={cn("inline-flex h-12 items-center", className)}>{img}</div>;
}

export default Logo;
