"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  CalendarDays,
  Layers,
  LayoutDashboard,
  ScanEye,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/cn";

export interface BoardNavProps {
  slug?: string;
}

const NAV_ITEMS: { label: string; key: string; icon: typeof Trophy; exact: boolean }[] = [
  {
    label: "Дашборд",
    key: "",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "События",
    key: "/events",
    icon: CalendarDays,
    exact: false,
  },
  {
    label: "Лидерборд",
    key: "/leaderboard",
    icon: Trophy,
    exact: false,
  },
  {
    label: "Оракул",
    key: "/oracle",
    icon: ScanEye,
    exact: false,
  },
  {
    label: "Кошелёк",
    key: "/wallet",
    icon: Wallet,
    exact: false,
  },
  {
    label: "Сезоны",
    key: "/seasons",
    icon: Layers,
    exact: false,
  },
  {
    label: "Группа",
    key: "/group",
    icon: Users,
    exact: false,
  },
];

/** Горизонтальная навигация по разделам доски. */
export function BoardNav({ slug }: BoardNavProps) {
  const pathname = usePathname();
  const params = useParams<{ slug?: string }>();
  const activeSlug = slug ?? (params?.slug as string) ?? "board";
  const baseHref = `/b/${activeSlug}`;

  return (
    <nav aria-label="Разделы доски" className="mt-4">
      <ul className="flex items-center gap-1 overflow-x-auto pb-2">
        {NAV_ITEMS.map((item) => {
          const href = `${baseHref}${item.key}`;
          const active = item.exact
            ? pathname === href
            : pathname.startsWith(href);
          const Icon = item.icon;

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold transition-all duration-300",
                  active
                    ? "bg-volt-tint text-fg shadow-[0_0_20px_rgba(215,255,62,0.08)]"
                    : "text-fg-2 hover:bg-neutral-tint/70 hover:text-fg",
                )}
              >
                <Icon
                  aria-hidden
                  className={cn(
                    "h-4 w-4 transition-all duration-300",
                    active ? "text-volt" : "group-hover:scale-110 group-hover:text-volt/70",
                  )}
                />
                {item.label}

                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-volt shadow-[0_0_10px_rgba(215,255,62,0.9)]"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}