import Link from "next/link";
import { cn } from "@/lib/cn";
import { Wordmark } from "@/components/brand/wordmark";

export interface TopBarProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Верхняя полоса приложения: слева бренд, справа — переданный контент
 * (обычно аватар текущего игрока и меню). Используется внутри AppShell.
 */
export function TopBar({ className, children }: TopBarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-hairline bg-bg/90 backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="BetBoard — на главную"
          className="group shrink-0 transition-all duration-300 hover:scale-105"
        >
          <Wordmark />
        </Link>

        {children}
      </div>

      {/* Beam line */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-volt/40 to-transparent"
      />
    </header>
  );
}