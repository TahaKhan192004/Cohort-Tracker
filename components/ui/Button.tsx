import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  // Terracotta is reserved for CTAs — this is the only filled use of it.
  primary:
    "bg-terracotta text-cream border border-terracotta hover:bg-umber hover:border-umber",
  secondary:
    "bg-transparent text-espresso border border-sand hover:bg-muted-warm",
  ghost: "bg-transparent text-smoke border border-transparent hover:bg-muted-warm hover:text-espresso",
  danger: "bg-transparent text-terracotta border border-sand hover:bg-muted-warm",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-[7px] font-normal transition-colors disabled:opacity-50 disabled:pointer-events-none";

function classes(variant: Variant, size: Size, className?: string) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return <button className={classes(variant, size, className)} {...props} />;
}

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonLinkProps) {
  return <Link className={classes(variant, size, className)} {...props} />;
}
