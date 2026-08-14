"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, LogIn, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserChip } from "@/components/layout/user-chip";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { getAuthToken } from "@/lib/api/client";
import type { AvatarColor } from "@/lib/types";

export function LandingAuthNav() {
  const pathname = usePathname();
  const [status, setStatus] = useState<"loading" | "guest" | "user">("loading");
  const [user, setUser] = useState<{ name: string; avatar: string } | null>(null);

  const showBoardCta = pathname !== "/my";

  useEffect(() => {
    let mounted = true;

    if (!getAuthToken()) {
      setStatus("guest");
      return;
    }

    let cancelled = false;

    import("@/lib/api/client").then(async ({ api }) => {
      try {
        const me = await api.auth.me();
        if (mounted && !cancelled) {
          setUser({
            name: me?.name ?? "Игрок",
            avatar: me?.avatar ?? "slate",
          });
          setStatus("user");
        }
      } catch {
        if (mounted && !cancelled) setStatus("guest");
      }
    });

    return () => {
      mounted = false;
      cancelled = true;
    };
  }, []);

  /* ─── Скелетон: точно повторяет геометрию реального UI ─── */
  if (status === "loading") {
    return (
      <div className="flex items-center gap-2.5" aria-busy="true">
        <div className="h-8 w-[148px] animate-pulse rounded-full bg-surface-2 sm:w-[168px]" />
        {showBoardCta && (
          <div className="hidden h-8 w-[104px] animate-pulse rounded-lg bg-surface-2 sm:block" />
        )}
      </div>
    );
  }

  /* ─── Гость ─── */
  if (status === "guest") {
    return (
      <div className="animate-fade-in">
        <Button asChild size="sm" variant="ghost" className="btn-ghost-glow gap-1.5">
          <Link href="/login">
            <LogIn className="h-3.5 w-3.5" aria-hidden />
            Войти
          </Link>
        </Button>
      </div>
    );
  }

  /* ─── Авторизован: каскадная анимация появления ─── */
  return (
    <div className="flex items-center gap-2.5">
      {/* Чип появляется первым */}
      <div className="animate-fade-up">
        <ProfileMenu
          trigger={
            <UserChip
              name={user?.name ?? "Игрок"}
              avatar={(user?.avatar ?? "slate") as AvatarColor}
            />
          }
        />
      </div>

      {showBoardCta && (
        <>
          {/* Разделитель появляется с задержкой */}
          <span
            aria-hidden
            className="animate-fade-in delay-75 hidden h-4 w-px bg-hairline opacity-0 sm:block"
          />

          {/* Кнопка появляется последней */}
          <div className="animate-fade-up delay-150 hidden opacity-0 sm:block">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="btn-ghost-glow group gap-1.5"
            >
              <Link href="/my">
                <Users className="h-3.5 w-3.5" aria-hidden />
                <span>На доску</span>
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}