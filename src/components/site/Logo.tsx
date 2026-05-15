import logo from "@/assets/logo-flow-harmony.png";
import { cn } from "@/lib/utils";

type LogoVariant = "auto" | "dark" | "light" | "onGradient";

interface LogoProps {
  /**
   * - `auto`: adapts to the surrounding section. Uses CSS `mix-blend-mode`
   *   so the mark stays legible on both light and dark backgrounds —
   *   ideal when you don't know the exact background (e.g. content over imagery).
   * - `dark`: original dark mark, for clean light backgrounds.
   * - `light`: inverted (white) mark, for solid dark backgrounds.
   * - `onGradient`: dark mark wrapped in a soft frosted pill so it stays
   *   readable on top of vivid gradients or busy photography.
   */
  variant?: LogoVariant;
  className?: string;
  imgClassName?: string;
  alt?: string;
}

const variantImg: Record<LogoVariant, string> = {
  auto: "mix-blend-difference invert",
  dark: "",
  light: "brightness-0 invert",
  onGradient: "",
};

export function Logo({
  variant = "dark",
  className,
  imgClassName,
  alt = "Flow & Harmony",
}: LogoProps) {
  const img = (
    <img
      src={logo}
      alt={alt}
      className={cn(
        "h-full w-auto select-none transition-[filter] duration-300",
        variantImg[variant],
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
