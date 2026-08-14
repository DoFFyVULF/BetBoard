"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" };

/** true на клиенте, false при SSR — без сайд-эффектов. */
function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: DialogProps) {
  const isClient = useIsClient();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const onChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onChangeRef.current = onOpenChange;
  });

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onChangeRef.current(false);
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    const prevActive = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prevActive?.focus();
    };
  }, [open]);

  if (!isClient || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center animate-fade-in">
      {/* Затемнение */}
      <div
        aria-hidden
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={() => onChangeRef.current(false)}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          "relative w-full rounded-2xl border border-hairline-strong bg-surface shadow-[0_32px_80px_rgba(0,0,0,0.56)] outline-none animate-fade-up terminal-panel",
          sizes[size],
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-hairline px-6 pb-4 pt-5">
          {title ? (
            <h2 id={titleId} className="text-base font-semibold text-fg">
              {title}
            </h2>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={() => onChangeRef.current(false)}
            aria-label="Закрыть"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-3 transition-all duration-300 hover:bg-neutral-tint hover:text-fg hover:rotate-90"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="px-6 py-5">
          {description && (
            <p className="mb-4 text-sm leading-relaxed text-fg-2">
              {description}
            </p>
          )}
          {children}
        </div>

        {footer && (
          <div className="flex justify-end gap-2 border-t border-hairline px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}