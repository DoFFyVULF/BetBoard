import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { notFound } from "next/navigation";

import { Card, CardBody } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/cn";
import {
  getActiveSeason,
  getBoardBySlug,
  getCurrentUser,
  getWalletFor,
  getWalletLedger,
} from "@/lib/data/api-accessors";
import {
  formatDateTime,
  formatPoints,
  formatSignedPoints,
  LEDGER_LABEL,
} from "@/lib/format";
import type { LedgerType } from "@/lib/types";

export interface WalletPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: WalletPageProps): Promise<Metadata> {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);

  return {
    title: board ? `Кошелёк — ${board.name}` : "Кошелёк",
  };
}

const SIGN: Partial<Record<LedgerType, 1 | -1>> = {
  season_start: 1,
  bet_lock: -1,
  payout: 1,
  refund: 1,
  bet_unlock: 1,
  adjustment: 1,
};

export default async function WalletPage({ params }: WalletPageProps) {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);

  if (!board) {
    notFound();
  }

  const user = await getCurrentUser();
  const season = await getActiveSeason(board.id);

  if (!season) {
    return (
      <PageHeader
        title="Кошелёк"
        description="Сезон ещё не начался."
      />
    );
  }

  const wallet = await getWalletFor(season.id, user.id);
  const ledger = await getWalletLedger(season.id, user.id);

  return (
    <div className="space-y-5">
      <Reveal>
        <PageHeader
          title="Кошелёк"
          description="Сезонные очки. Ставки блокируют баланс до результата; выплаты приходят после фиксации."
        />
      </Reveal>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="stat-anim" style={{ animationDelay: "60ms" }}>
          <Stat
            label="Доступно"
            value={formatPoints(wallet.available)}
            hint={`${season.name} · сезон`}
          />
        </div>

        <div className="stat-anim" style={{ animationDelay: "120ms" }}>
          <Stat
            label="Заблокировано"
            value={formatPoints(wallet.locked)}
            hint="в активных ставках"
          />
        </div>

        <div className="stat-anim" style={{ animationDelay: "180ms" }}>
          <Stat
            label="Итого"
            value={formatPoints(wallet.total)}
            hint={`старт ${formatPoints(season.startingBalance)}`}
          />
        </div>
      </div>

      <Reveal delay={90}>
        <Card className="card-interactive panel-beam">
          <CardBody className="space-y-1">
            {ledger.length === 0 ? (
              <EmptyState
                icon={<ArrowLeftRight className="h-5 w-5" aria-hidden />}
                title="Операций пока нет"
                description="Как только вы сделаете первую ставку или получите выплату, всё появится здесь."
              />
            ) : (
              <ul className="divide-y divide-hairline/60">
                {ledger.map((l) => {
                  const sign = SIGN[l.type] ?? 1;
                  const positive = sign > 0;

                  return (
                    <li
                      key={l.id}
                      className="list-row flex items-center gap-3 rounded-lg px-2 py-2.5"
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          positive
                            ? "bg-win-tint text-win"
                            : "bg-loss-tint text-loss",
                        )}
                      >
                        <span className="tnum font-mono text-sm font-semibold">
                          {positive ? "+" : "−"}
                        </span>
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-fg">
                          {l.eventTitle ?? LEDGER_LABEL[l.type]}
                        </div>

                        <div className="text-[11px] text-muted">
                          {LEDGER_LABEL[l.type]} · {formatDateTime(l.createdAt)}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end">
                        <span
                          className={cn(
                            "tnum font-mono text-sm font-semibold",
                            positive ? "text-win" : "text-loss",
                          )}
                        >
                          {formatSignedPoints(sign * l.amount)}
                        </span>

                        <span className="tnum font-mono text-[11px] text-fg-3">
                          {formatPoints(l.balanceAfter)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </Reveal>

      <Reveal delay={120}>
        <p className="text-center text-xs text-muted">
          Баланс считается по сезону. История операций доступна в{" "}
          <Link
            href={`/b/${slug}/events`}
            className="text-fg-2 underline-offset-2 transition-colors hover:text-volt hover:underline"
          >
            событиях
          </Link>
          .
        </p>
      </Reveal>
    </div>
  );
}