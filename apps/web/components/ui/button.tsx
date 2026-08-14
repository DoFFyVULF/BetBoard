import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger"
  | "success";
type Size = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap select-none " +
  "transition-all duration-300 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-volt " +
  "disabled:opacity-45 disabled:pointer-events-none active:scale-[0.97] cursor-pointer";

const variants: Record<Variant, string> = {
  primary:
    "bg-volt text-volt-ink hover:bg-volt-strong hover:shadow-[0_0_32px_rgba(215,255,62,0.35)] shadow-[0_1px_0_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.3)]",
  secondary:
    "bg-surface-3 text-fg hover:bg-elevated border border-hairline-strong",
  outline:
    "border border-hairline-strong text-fg-2 hover:text-fg hover:border-volt/60 hover:shadow-[0_0_24px_rgba(215,255,62,0.1)] bg-transparent",
  ghost:
    "text-fg-2 hover:text-fg hover:bg-neutral-tint bg-transparent",
  danger:
    "bg-loss text-[#1a0b0e] hover:brightness-110 hover:shadow-[0_0_28px_rgba(251,113,133,0.3)]",
  success:
    "bg-win text-[#07170c] hover:brightness-110 hover:shadow-[0_0_28px_rgba(74,222,128,0.3)]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-[10px]",
  lg: "h-12 px-6 text-[15px] rounded-xl",
  icon: "h-9 w-9 rounded-[10px]",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  asChild = false,
  ...props
}: ButtonProps) {
  const cls = cn(base, variants[variant], sizes[size], className);

  if (asChild) {
    return <Slot className={cls} {...props} />;
  }

  return <button className={cls} {...props} />;
}
