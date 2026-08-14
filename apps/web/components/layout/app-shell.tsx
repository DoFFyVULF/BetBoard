import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { TopBar } from "@/components/layout/top-bar";

export interface AppShellProps {
  /** Контент справа в шапке — обычно аватар и меню текущего игрока. */
  topBarRight?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Каркас приложения: шапка + основная область. */
export function AppShell({ topBarRight, children, className }: AppShellProps) {
  return (
    <div className="relative flex min-h-svh flex-1 flex-col overflow-x-clip bg-bg">
      <div className="noise" aria-hidden />
      
      <TopBar>{topBarRight}</TopBar>
      
      <main
        className={cn(
          "relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6",
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}