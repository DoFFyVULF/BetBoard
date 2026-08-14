"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import {
  ArrowLeft,
  Crown,
  LineChart,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

import { cn } from "@/lib/cn";
import { Wordmark } from "@/components/brand/wordmark";
import { LogoMark } from "@/components/brand/logo-mark";
import { Button } from "@/components/ui/button";
import { AuthForm, type AuthMode } from "@/components/auth/auth-form";

/** Плавающие чипы-кэфы вокруг карточки (декор, глубина-2). */
const CHIPS = [
  { label: "LIVE", odds: "×2.40", top: "18%", left: "6%", dur: "9s", delay: "0s", dx: "12px" },
  { label: "ПУЛ 360", odds: "×1.65", top: "12%", left: "auto", right: "8%", dur: "11s", delay: "0.6s", dx: "-14px" },
  { label: "×6.00", odds: "АУТСАЙДЕР", top: "58%", left: "4%", dur: "13s", delay: "1.2s", dx: "18px" },
  { label: "STATUS: OPEN", odds: "×3.10", top: "70%", left: "auto", right: "5%", dur: "10s", delay: "0.3s", dx: "-12px" },
  { label: "×4.20", odds: "КИНО", top: "34%", left: "auto", right: "3%", dur: "12s", delay: "1.8s", dx: "-18px" },
  { label: "СЕЗОН-2026", odds: "×1.90", top: "84%", left: "10%", dur: "11s", delay: "2s", dx: "10px" },
];

const TICKER = [
  "Кто выиграет «Каркассон»?",
  "Закажем ли пиццу после 22:00?",
  "Кто последним придёт на встречу?",
  "Возьмём «Интерстеллар» на вечер?",
  "Богдан снова оракул недели?",
].map((label, i) => ({
  label,
  odds: ["×2.40", "×1.65", "×4.20", "×1.60", "×1.90"][i],
}));
const TICKER_ITEMS = [...TICKER, ...TICKER];

const PERKS = [
  { icon: ShieldCheck, text: "Честный пул — без маржи букмекера" },
  { icon: Users, text: "Ставьте очки с друзьями на всё, что реально случается" },
  { icon: Trophy, text: "Рейтинг, титулы и скор оракула каждый сезон" },
];

/** Демо-панель live-пула (маркетинг, левая колонка). */
const ODDS_DEMO = [
  { label: "Аня", pool: 100, odds: "×3.60", width: 28 },
  { label: "Богдан", pool: 150, odds: "×2.40", width: 42 },
  { label: "Вика", pool: 50, odds: "×7.20", width: 14 },
  { label: "Гоша", pool: 60, odds: "×6.00", width: 16 },
];

function AuthScreenInner() {
  const router = useRouter();
  const params = useSearchParams();
  const mode: AuthMode = params.get("mode") === "register" ? "register" : "login";

  const boardName = "Пятница";

  return (
    <div className="relative flex min-h-svh flex-col overflow-x-clip bg-bg text-fg">
      <div className="noise" aria-hidden />
      <div className="hero-glow" aria-hidden />
      <div className="bg-grid" aria-hidden />

      {/* Атмосферные блобсы */}
      <div
        aria-hidden
        className="animate-float pointer-events-none absolute left-[8%] top-[22%] h-72 w-72 rounded-full bg-volt/8 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[10%] right-[6%] h-80 w-80 rounded-full bg-info/8 blur-3xl"
        style={{ animation: "glow-pulse 8s ease-in-out infinite" }}
      />

      {/* Сканирующий луч */}
      <div className="auth-scan" aria-hidden />

      {/* Плавающие чипы (скрыты на мобильных) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[2] hidden md:block">
        {CHIPS.map((c, i) => (
          <span
            key={i}
            className="auth-chip"
            style={
              {
                top: c.top,
                left: c.left,
                right: c.right,
                "--dur": c.dur,
                "--delay": c.delay,
                "--dx": c.dx,
              } as React.CSSProperties
            }
          >
            <b>{c.odds}</b>
            {c.label}
          </span>
        ))}
      </div>

      {/* Мини-шапка */}
      <header className="relative z-10 mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="BetBoard — на главную" className="transition-all duration-300 hover:scale-105">
          <Wordmark />
        </Link>
        <Button asChild variant="ghost" size="sm" className="btn-ghost-glow">
          <Link href="/">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            На главную
          </Link>
        </Button>
      </header>

      {/* Сцена */}
      <main className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-4">
        {/* Левая колонка — копирайтинг (desktop) */}
        <section className="hidden lg:block">
          <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-volt-ring bg-surface px-3 py-1 text-xs font-medium text-fg-2">
            <span className="live-dot" aria-hidden />
            Приватный клуб ставок
          </div>

          <h1
            className="animate-fade-up font-display text-5xl font-black leading-[1.02] tracking-tight text-fg"
            style={{ animationDelay: "90ms" }}
          >
            Ставки на друзей.
            <br />
            <span className="auth-title-glow">Без денег.</span>
          </h1>

          <p
            className="animate-fade-up mt-6 max-w-md text-[15px] leading-relaxed text-fg-2"
            style={{ animationDelay: "170ms" }}
          >
            BetBoard превращает дружеские споры в игровой сезон: коэффициенты, честные пулы,
            рейтинг оракулов и титулы. Только репутация — никаких реальных денег.
          </p>

          <ul className="animate-fade-up mt-8 space-y-3" style={{ animationDelay: "250ms" }}>
            {PERKS.map((p) => {
              const Icon = p.icon;
              return (
                <li key={p.text} className="flex items-start gap-3 text-sm text-fg-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-volt-ring bg-volt-tint text-volt">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  {p.text}
                </li>
              );
            })}
          </ul>

          {/* Мини live-пул */}
          <div
            className="animate-fade-up mt-10 max-w-sm"
            style={{ animationDelay: "330ms" }}
          >
            <div className="terminal-panel card-interactive p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="live-chip">
                    <span className="live-dot" aria-hidden />
                    Live пул
                  </div>
                  <p className="mt-2 text-[11px] text-fg-3">Кто выиграет «Каркассон»?</p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline-strong bg-surface-2 text-volt">
                  <LineChart className="h-4 w-4" aria-hidden />
                </span>
              </div>

              <div className="space-y-3">
                {ODDS_DEMO.map((row, index) => (
                  <div key={row.label} className="odds-row">
                    <div className="flex items-center justify-between gap-4 text-xs">
                      <span className="text-fg-2">{row.label}</span>
                      <span className="tnum font-mono font-bold text-volt">{row.odds}</span>
                    </div>
                    <div className="odds-bar mt-1.5">
                      <span
                        className="odds-fill"
                        style={
                          {
                            "--w": `${row.width}%`,
                            transitionDelay: `${index * 100}ms`,
                          } as React.CSSProperties
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Правая колонка — карточка входа */}
        <section className="animate-fade-up mx-auto w-full max-w-[440px]" style={{ animationDelay: "120ms" }}>
          <div className="mb-6 flex items-center justify-center lg:hidden">
            <LogoMark className="h-10 w-10 rounded-xl text-lg" />
          </div>
          <AuthForm mode={mode} boardName={boardName} />
        </section>
      </main>

      {/* Бегущая строка коэффициентов */}
      <div className="ticker relative z-10 border-y border-hairline bg-surface">
        <div className="ticker-track px-4">
          {TICKER_ITEMS.map((item, index) => (
            <span key={`${item.label}-${index}`} className="ticker-item">
              <span className="text-fg-2">{item.label}</span>
              <span className="tnum font-mono font-bold text-volt">{item.odds}</span>
            </span>
          ))}
        </div>
      </div>

      <footer className="relative z-10 border-t border-hairline">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-center gap-2 px-4 py-5 text-xs text-fg-3">
          <Crown className="h-3 w-3" aria-hidden />
          BetBoard · виртуальные ставки для друзей · без реальных денег
        </div>
      </footer>
    </div>
  );
}

/** Страница входа/регистрации (useSearchParams требует Suspense). */
export function AuthScreen() {
  return (
    <Suspense fallback={null}>
      <AuthScreenInner />
    </Suspense>
  );
}