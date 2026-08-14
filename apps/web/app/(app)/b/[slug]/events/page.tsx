import type { Metadata } from "next";
import { CalendarX } from "lucide-react";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { EventFilters } from "@/components/events/event-filters";
import type { EventsTab } from "@/components/events/event-filters";
import { EventCard } from "@/components/events/event-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/motion/reveal";
import type { Category } from "@/lib/types";
import { getBoardBySlug, getEvents, getCurrentUserId } from "@/lib/data/api-accessors";

export interface EventsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; category?: string }>;
}

export async function generateMetadata({
  params,
}: EventsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);

  return {
    title: board ? `События — ${board.name}` : "События",
  };
}

const VALID_TABS: EventsTab[] = ["all", "open", "closed", "resolved"];
const VALID_CATEGORIES = new Set<Category>([
  "board",
  "sport",
  "movie",
  "food",
  "travel",
  "chaos",
  "meta",
  "games",
]);

export default async function EventsPage({
  params,
  searchParams,
}: EventsPageProps) {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);

  if (!board) {
    notFound();
  }

  const qs = await searchParams;
  const tab: EventsTab = VALID_TABS.includes(qs.status as EventsTab)
    ? (qs.status as EventsTab)
    : "all";
  const category =
    qs.category && VALID_CATEGORIES.has(qs.category as Category)
      ? (qs.category as Category)
      : "";

  const currentUserId = await getCurrentUserId();
  const all = await getEvents(board.id, undefined, currentUserId);
  const filtered = all.filter((v) => {
    const byStatus =
      tab === "all"
        ? true
        : tab === "open"
          ? v.effectiveStatus === "open"
          : tab === "closed"
            ? v.effectiveStatus === "closed"
            : v.effectiveStatus === "resolved" ||
              v.effectiveStatus === "canceled";
    const byCategory = !category || v.event.category === category;
    return byStatus && byCategory;
  });

  return (
    <div className="space-y-5">
      <Reveal>
        <PageHeader
          title="События"
          description="Прогнозы компании на ближайшие дни: от настолок до пиццы. Сделайте ставку очками — пул делится между теми, кто угадал."
        />
      </Reveal>

      <Reveal delay={70}>
        <EventFilters boardSlug={slug} tab={tab} category={category} />
      </Reveal>

      {filtered.length === 0 ? (
        <Reveal delay={100}>
          <EmptyState
            icon={<CalendarX className="h-5 w-5 animate-glow" aria-hidden />}
            title="Событий не найдено"
            description="Попробуйте сменить фильтр или создайте своё событие."
          />
        </Reveal>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((v, index) => (
            <Reveal key={v.event.id} delay={index * 80}>
              <EventCard view={v} boardSlug={slug} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}