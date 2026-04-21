import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

interface ButtonClassOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconOnly?: boolean;
}

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-ink text-cream hover:bg-earth",
  secondary:
    "bg-transparent text-ink border border-surface-border hover:bg-surface-hover hover:border-ink",
  ghost: "bg-transparent text-ink/60 hover:text-ink hover:bg-surface",
};

const SIZE: Record<ButtonSize, string> = {
  xs: "px-2 py-1 text-detail",
  sm: "px-3 py-1.5 text-label",
  md: "px-6 py-2.5 text-label",
  lg: "px-6 py-3.5 text-label",
};

const ICON_ONLY_SIZE: Record<ButtonSize, string> = {
  xs: "w-6 h-6",
  sm: "w-7 h-7",
  md: "w-8 h-8",
  lg: "w-10 h-10",
};

export function buttonClasses(options: ButtonClassOptions = {}): string {
  const { variant = "primary", size = "md", fullWidth = false, iconOnly = false } = options;
  return [
    BASE,
    VARIANT[variant],
    iconOnly ? `${ICON_ONLY_SIZE[size]} p-0` : SIZE[size],
    fullWidth ? "w-full" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconOnly?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  iconOnly = false,
  loading = false,
  loadingLabel,
  className = "",
  disabled,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  const composed = [
    buttonClasses({ variant, size, fullWidth, iconOnly }),
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={composed}
      {...rest}
    >
      {loading ? <Spinner /> : null}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}

function Spinner() {
  return (
    <span
      className="w-3.5 h-3.5 border-2 border-current/40 border-t-current rounded-full animate-spin"
      aria-hidden="true"
    />
  );
}
