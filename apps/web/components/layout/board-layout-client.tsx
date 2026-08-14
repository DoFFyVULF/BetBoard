"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { AppShell } from "@/components/layout/app-shell";
import { BoardNav } from "@/components/layout/board-nav";
import { UserChip } from "@/components/layout/user-chip";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { Reveal } from "@/components/motion/reveal";
import { formatPoints } from "@/lib/format";
import type { AvatarColor } from "@/lib/types";

interface BoardLayoutClientProps {
  children: React.ReactNode;
  board: {
    id: string;
    name: string;
    description: string | null;
    currencyName: string;
    timezone: string;
    inviteCode: string;
    owner?: { id: string; name: string; avatar: string } | null;
    members?: Array<{ user: { id: string; name: string; avatar: string } }>;
  };
  slug: string;
}

export default function BoardLayoutClient({ children, board, slug }: BoardLayoutClientProps) {
  const [user, setUser] = useState<{ id: string; name: string; avatar: string; email: string | null } | null>(null);
  const [wallet, setWallet] = useState<{ available: number; locked: number; total: number } | null>(null);
  const [season, setSeason] = useState<{ id: string; name: string; startingBalance: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setError(null);

        // Fetch user, season, wallet in parallel
        const [authRes, seasonsRes] = await Promise.all([
          api.auth.me(),
          api.seasons.list(board.id),
        ]);

        if (!mounted) return;

        const user = authRes;
        setUser(user);

        const activeSeason = seasonsRes?.find((s: any) => s.status === "active") || null;
        if (activeSeason) {
          setSeason(activeSeason);
          try {
            const walletRes = await api.wallet.getSummary(activeSeason.id, user.id);
            setWallet({
              available: walletRes.available ?? walletRes.balance ?? activeSeason.startingBalance,
              locked: walletRes.locked ?? 0,
              total: walletRes.total ?? walletRes.balance ?? activeSeason.startingBalance,
            });
          } catch {
            setWallet({
              available: activeSeason.startingBalance,
              locked: 0,
              total: activeSeason.startingBalance,
            });
          }
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Ошибка загрузки");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => { mounted = false; };
  }, [board.id]);

  if (loading) {
    // Skeleton for top bar
    return (
      <AppShell
        topBarRight={
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 animate-pulse" />
            <div className="h-6 w-24 bg-surface-2 rounded animate-pulse" />
          </div>
        }
      >
        <div className="relative pt-5 pb-6">
          <Reveal className="mb-2 flex flex-col gap-1">
            <div className="eyebrow w-fit">Доска</div>
            <h1 className="font-display text-lg font-bold tracking-tight text-fg">{board.name}</h1>
            <p className="text-sm text-fg-2">{board.description}</p>
          </Reveal>
          <BoardNav />
        </div>
        <div className="relative">{children}</div>
      </AppShell>
    );
  }

  if (error || !user) {
    return (
      <AppShell>
        <div className="relative pt-5 pb-6">
          <Reveal className="mb-2 flex flex-col gap-1">
            <div className="eyebrow w-fit">Доска</div>
            <h1 className="font-display text-lg font-bold tracking-tight text-fg">{board.name}</h1>
            <p className="text-sm text-fg-2">{board.description}</p>
          </Reveal>
          <BoardNav />
        </div>
        <div className="relative">{children}</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      topBarRight={
        <ProfileMenu
          trigger={
            <UserChip
              name={user.name}
              avatar={user.avatar as AvatarColor}
              subtitle={wallet ? `${formatPoints(wallet.available)} очков` : undefined}
              href={`/b/${slug}/oracle`}
            />
          }
        />
      }
    >
      <div className="relative pt-5 pb-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-44 w-[min(680px,90vw)] -translate-x-1/2 rounded-full bg-volt-tint blur-3xl"
        />

        <Reveal className="mb-2 flex flex-col gap-1">
          <div className="eyebrow w-fit">Доска</div>
          <h1 className="font-display text-lg font-bold tracking-tight text-fg">
            {board.name}
          </h1>
          <p className="text-sm text-fg-2">{board.description}</p>
        </Reveal>

        <BoardNav />
      </div>

      <div className="relative">{children}</div>
    </AppShell>
  );
}