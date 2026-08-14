import Link from "next/link";
import type { CSSProperties } from "react";
import {
  Activity,
  ArrowRight,
  Blocks,
  Crown,
  LineChart,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";

import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogoMark } from "@/components/brand/logo-mark";
import { Reveal } from "@/components/motion/reveal";
import { LandingAuthNav } from "@/components/auth/landing-auth-nav";
import { MyGroups } from "@/components/auth/my-groups";

const FEATURES = [
  {
    icon: Blocks,
    title: "Паримутуальный пул",
    text: "Коэффициенты растут от ставок компании. Пул целиком уходит тем, кто угадал — без «маржи» букмекера.",
  },
  {
    icon: Wallet,
    title: "Сезонные очки",
    text: "Каждый сезон все стартуют с равным балансом. Ставки блокируют очки до результата — никакой инфляции.",
  },
  {
    icon: Trophy,
    title: "Лидерборд и титулы",
    text: "Место в таблице, титулы вроде «Оракула настолок» и достижения за серии и аутсайдеров.",
  },
  {
    icon: Sparkles,
    title: "Любые события",
    text: "Настолки, кино, спорт, еда, хаос. Ставьте на то, что реально происходит в вашей компании.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Соберите доску",
    text: "Пригласите друзей по инвайт-коду. Каждый получает стартовый баланс.",
  },
  {
    n: "02",
    title: "Предложите событие",
    text: "Настолка, фильм или спор. Укажите исходы и срок приёма ставок.",
  },
  {
    n: "03",
    title: "Ставьте очки",
    text: "Пулы и коэффициенты пересчитываются в реальном времени.",
  },
  {
    n: "04",
    title: "Фиксируйте результат",
    text: "Победители делят пул, оракулы получают скор, сезон завершается.",
  },
];

const ODDS_DEMO = [
  { label: "Аня", pool: 100, odds: "×3.60", width: 28 },
  { label: "Богдан", pool: 150, odds: "×2.40", width: 42 },
  { label: "Вика", pool: 50, odds: "×7.20", width: 14 },
  { label: "Гоша", pool: 60, odds: "×6.00", width: 16 },
];

const TICKER = [
  { label: "Кто выиграет Azul?", odds: "×2.40" },
  { label: "Закажем ли пиццу после 22:00?", odds: "×1.65" },
  { label: "Победят синие в футболе", odds: "×2.10" },
  { label: "Кто последним придёт на квиз", odds: "×4.20" },
  { label: "Выберем «Нечто» на кино-вечер", odds: "×3.10" },
  { label: "Богдан снова станет оракулом недели", odds: "×1.90" },
];

const TICKER_ITEMS = [...TICKER, ...TICKER];

export default function Home() {
  const boardHref = `/my`;

  return (
    <div className="relative flex min-h-svh flex-col overflow-x-clip bg-bg text-fg">
      <div className="noise" aria-hidden />

      <TopBar>
        <LandingAuthNav />
      </TopBar>

      <main className="relative z-10 flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="hero-glow" aria-hidden />
          <div className="bg-grid" aria-hidden />

          <div className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pb-24 sm:pt-28">
            <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-volt-ring bg-surface px-3 py-1 text-xs font-medium text-fg-2">
                  <span className="live-dot" aria-hidden />
                  Приватные ставки для компании друзей
                </div>

                <h1
                  className="animate-fade-up font-display text-4xl font-black leading-[1.02] tracking-tight text-fg sm:text-6xl"
                  style={{ animationDelay: "90ms" }}
                >
                  Виртуальные очки.
                  <br />
                  <span className="text-volt drop-shadow-[0_0_24px_rgba(215,255,62,0.35)]">
                    Реальные споры.
                  </span>
                </h1>

                <p
                  className="animate-fade-up mt-6 max-w-xl text-lg leading-relaxed text-fg-2"
                  style={{ animationDelay: "170ms" }}
                >
                  BetBoard превращает дружеские споры в игровой сезон: ставьте очки на исход
                  настолок, кино, спорта и пиццы, следите за коэффициентами и зарабатывайте
                  титул оракула. Без реальных денег — только репутация.
                </p>

                <div
                  className="animate-fade-up mt-9 flex flex-wrap items-center gap-3"
                  style={{ animationDelay: "250ms" }}
                >
                  <Button asChild size="lg" className="btn-primary-glow group">
                    <Link href={boardHref}>
                      Открыть доску
                      <ArrowRight
                        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </Link>
                  </Button>

                  <Button asChild size="lg" variant="outline" className="btn-ghost-glow">
                    <Link href="#how-it-works">Как это работает</Link>
                  </Button>
                </div>

                <dl
                  className="animate-fade-up mt-10 grid max-w-lg grid-cols-3 gap-3 text-sm"
                  style={{ animationDelay: "330ms" }}
                >
                  {[
                    ["Без денег", "только очки"],
                    ["Честный пул", "без маржи"],
                    ["Сезоны", "титулы и скор"],
                  ].map(([title, text]) => (
                    <div
                      key={title}
                      className="rounded-xl border border-hairline bg-surface px-3 py-3"
                    >
                      <dt className="text-[13px] font-bold text-fg">{title}</dt>
                      <dd className="mt-1 text-xs leading-relaxed text-fg-3">{text}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <Reveal delay={180}>
                <div className="animate-float">
                  <div className="terminal-panel card-interactive p-6 sm:p-7">
                    <div className="mb-6 flex items-center justify-between gap-4">
                      <div>
                        <div className="live-chip">
                          <span className="live-dot" aria-hidden />
                          Live пул
                        </div>
                        <h2 className="mt-3 text-lg font-bold text-fg">
                          Кто выиграет Каркассон?
                        </h2>
                        <p className="mt-1 text-xs text-fg-3">
                          Приём ставок закроется через 12 минут
                        </p>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-hairline-strong bg-surface-2 text-volt">
                        <Activity className="h-4 w-4" aria-hidden />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {ODDS_DEMO.map((row, index) => (
                        <div key={row.label} className="odds-row">
                          <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-fg-2">{row.label}</span>
                            <span className="flex items-center gap-3">
                              <span className="tnum font-mono text-xs text-fg-3">
                                {row.pool} очков
                              </span>
                              <span className="tnum w-14 text-right font-mono text-sm font-bold text-volt">
                                {row.odds}
                              </span>
                            </span>
                          </div>

                          <div className="odds-bar mt-2">
                            <span
                              className="odds-fill"
                              style={
                                {
                                  "--w": `${row.width}%`,
                                  transitionDelay: `${index * 100}ms`,
                                } as CSSProperties
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-hairline pt-4 text-xs text-fg-3">
                      <span>Общий пул</span>
                      <span className="tnum font-mono font-bold text-fg">360 очков</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>

          {/* Ticker */}
          <div className="ticker relative border-y border-hairline bg-surface">
            <div className="ticker-track px-4">
              {TICKER_ITEMS.map((item, index) => (
                <span key={`${item.label}-${index}`} className="ticker-item">
                  <span className="text-fg-2">{item.label}</span>
                  <span className="tnum font-mono font-bold text-volt">{item.odds}</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Возможности */}
        <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal className="mb-10 max-w-2xl">
            <div className="eyebrow">Почему заходит</div>
            <h2 className="mt-5 font-display text-2xl font-black tracking-tight text-fg sm:text-4xl">
              Не таблица, а сезон
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-fg-2">
              BetBoard делает из обычного спора игру с балансом, коэффициентами, историей и
              репутацией. Всё честно: пул формируется только из ставок вашей компании.
            </p>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <Reveal key={feature.title} delay={index * 90}>
                  <Card className="card-interactive group h-full p-5">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-volt-ring bg-volt-tint text-volt transition-transform duration-500 group-hover:-rotate-2 group-hover:scale-110">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>

                    <h3 className="text-[15px] font-bold text-fg">{feature.title}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-fg-2">{feature.text}</p>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* Как это работает */}
        <section
          id="how-it-works"
          className="relative border-y border-hairline bg-surface"
        >
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <Reveal className="mb-10 max-w-2xl">
              <div className="eyebrow">Механика</div>
              <h2 className="mt-5 font-display text-2xl font-black tracking-tight text-fg sm:text-4xl">
                Как это работает
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-fg-2">
                Четыре шага от идеи до титула оракула.
              </p>
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, index) => (
                <Reveal key={step.n} delay={index * 100}>
                  <div className="step-card card-interactive h-full rounded-2xl border border-hairline bg-surface p-5">
                    <div className="flex items-center gap-4">
                      <span className="tnum font-mono text-xs font-bold text-volt">
                        {step.n}
                      </span>
                      <span className="step-line" aria-hidden />
                    </div>

                    <h3 className="mt-4 text-[15px] font-bold text-fg">{step.title}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-fg-2">{step.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Мои группы / войти */}
        <section
          id="groups"
          className="relative border-y border-hairline bg-surface/40"
        >
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <MyGroups />
          </div>
        </section>

        {/* Механика пула */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <Card className="card-interactive overflow-hidden">
              <div className="grid gap-0 lg:grid-cols-2">
                <div className="p-8 sm:p-10">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-volt-ring bg-volt-tint text-volt">
                    <LineChart className="h-5 w-5" aria-hidden />
                  </div>

                  <div className="eyebrow">Честная математика</div>

                  <h2 className="mt-5 font-display text-2xl font-black tracking-tight text-fg sm:text-3xl">
                    Паримутуальный пул: прозрачно и без букмекера
                  </h2>

                  <p className="mt-4 text-sm leading-relaxed text-fg-2">
                    Коэффициент исхода — это отношение общего пула к пулу исхода. Чем меньше
                    очков поставлено на исход, тем выше коэффициент. Весь пул распределяется
                    между угадавшими пропорционально ставкам.
                  </p>

                  <ul className="mt-6 space-y-3 text-sm text-fg-2">
                    {[
                      "Коэффициенты пересчитываются при каждой ставке",
                      "Очки блокируются на время ставки — потратить их нельзя",
                      "При отмене события все ставки возвращаются целиком",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <ShieldCheck
                          className="mt-0.5 h-4 w-4 shrink-0 text-volt"
                          aria-hidden
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col justify-center gap-4 border-t border-hairline bg-surface-2 p-8 sm:p-10 lg:border-l lg:border-t-0">
                  <div className="rounded-2xl border border-hairline bg-bg p-5">
                    <div className="flex items-center justify-between gap-4 text-xs text-fg-3">
                      <span>Пул на «Кто выиграет Каркассон?»</span>
                      <span className="tnum font-mono font-bold text-fg">360 очков</span>
                    </div>

                    <div className="mt-5 space-y-4">
                      {ODDS_DEMO.map((row, index) => (
                        <div key={row.label} className="odds-row">
                          <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-fg-2">{row.label}</span>
                            <span className="flex items-center gap-3">
                              <span className="tnum font-mono text-xs text-fg-3">
                                {row.pool} очков
                              </span>
                              <span className="tnum w-14 text-right font-mono text-sm font-bold text-volt">
                                {row.odds}
                              </span>
                            </span>
                          </div>

                          <div className="odds-bar mt-2">
                            <span
                              className="odds-fill"
                              style={
                                {
                                  "--w": `${row.width}%`,
                                  transitionDelay: `${index * 110}ms`,
                                } as CSSProperties
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="mt-5 border-t border-hairline pt-4 text-[11px] leading-relaxed text-muted">
                      Победил Богдан — выигравшие делят 360 очков пропорционально ставкам.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </Reveal>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-4 sm:px-6">
          <Reveal>
            <div className="cta-panel relative overflow-hidden rounded-3xl border border-hairline-strong bg-surface p-10 text-center sm:p-16">
              <div className="cta-glow" aria-hidden />

              <LogoMark className="animate-glow mx-auto mb-6 h-12 w-12 rounded-2xl text-lg" />

              <h2 className="mx-auto max-w-xl font-display text-2xl font-black tracking-tight text-fg sm:text-3xl">
                Соберите доску и откройте сезон ставок
              </h2>

              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-fg-2">
                Уже есть доска? Войдите через приглашение или создайте новую для своей компании.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg" className="btn-primary-glow group">
                  <Link href={boardHref}>
                    <Users className="h-4 w-4" aria-hidden />
                    Открыть доску
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="relative z-10 border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-fg-3 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <LogoMark className="h-4 w-4 rounded text-[10px]" />
            <span>BetBoard · виртуальные ставки для друзей</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Crown className="h-3 w-3" aria-hidden />
              без реальных денег
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
