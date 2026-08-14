"use client";

import { useRef, useState, type ReactNode } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { api, clearAuthToken } from "@/lib/api/client";
import { cn } from "@/lib/cn";

export interface ProfileMenuProps {
  /** Собранный кликабельный чип профиля (серверная часть). */
  trigger: ReactNode;
}

/**
 * Выпадающее меню профиля с плавной анимацией раскрытия.
 * Использует CSS grid-rows для height-auto анимации без JS.
 */
export function ProfileMenu({ trigger }: ProfileMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const closeMenu = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  const handleLogout = async () => {
    setPending(true);
    try {
      await api.auth.me();
      clearAuthToken();
    } catch {
      clearAuthToken();
    }
    router.push("/");
  };

  return (
    <div
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
      onFocus={openMenu}
      onBlur={closeMenu}
    >
      {trigger}

      {/* 
        Анимированный контейнер: 
        - grid + grid-rows-[0fr] → grid-rows-[1fr] для плавного height: auto
        - opacity + translate-y для дополнительного эффекта появления
        - pointer-events-none когда закрыто, чтобы не перехватывать клики
      */}
      <div
        role="menu"
        aria-label="Меню профиля"
        aria-hidden={!open}
        className={cn(
          "absolute inset-x-0 top-[calc(100%+6px)] z-50 w-full origin-top-right transition-all duration-200 ease-out",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0",
        )}
      >
        {/* Внутренняя обертка для grid-анимации высоты */}
        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-200 ease-out",
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            <div className="terminal-panel card-interactive p-1 shadow-xl shadow-black/20">
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                disabled={pending}
                tabIndex={open ? 0 : -1}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-all duration-150",
                  "text-fg-2 hover:bg-loss-tint hover:text-loss",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-loss/50",
                  "disabled:opacity-50",
                )}
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>{pending ? "Выходим…" : "Выйти"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}