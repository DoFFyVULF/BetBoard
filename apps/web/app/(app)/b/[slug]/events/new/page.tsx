import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { CreateEventForm } from "@/components/events/create-event-form";
import { Reveal } from "@/components/motion/reveal";
import {
  getActiveSeason,
  getBoardBySlug,
} from "@/lib/data/api-accessors";

export interface NewEventPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: NewEventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);

  return {
    title: board ? `Новое событие — ${board.name}` : "Новое событие",
  };
}

export default async function NewEventPage({ params }: NewEventPageProps) {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);

  if (!board) {
    notFound();
  }

  // Привязываем событие к активному сезону, если он есть.
  const activeSeason = await getActiveSeason(board.id);

  return (
    /* 
      Центрирующий контейнер:
      - flex + items-center: вертикальная центровка (если есть min-h)
      - justify-center: горизонтальная центровка
      - max-w-2xl + mx-auto: ограничение ширины колонки и выравнивание по центру
    */
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center space-y-8 py-6">
      <Reveal className="w-full text-center">
        <PageHeader
          title="Новое событие"
          description="Создайте прогноз для компании. Укажите исходы, срок и модель коэффициентов — остальное сделает платформа."
          className="items-center"
        />
      </Reveal>

      <Reveal delay={80} className="w-full">
        {/* Убрали max-w-2xl отсюда, т.к. родитель уже ограничивает ширину */}
        <CreateEventForm
          boardId={board.id}
          seasonId={activeSeason?.id}
          boardSlug={slug}
          className="w-full"
        />
      </Reveal>

      <Reveal delay={140} className="w-full">
        <div className="rounded-xl border border-hairline bg-surface p-5 text-[13px] leading-relaxed text-fg-3 shadow-sm">
          <span className="mb-1.5 block font-semibold text-fg-2">
            Про паримутуал
          </span>
          Коэффициенты исхода растут по мере ставок: чем меньше очков поставлено
          на исход, тем выше кэф. Пул делится между угадавшими пропорционально —
          без комиссии букмекера.
        </div>
      </Reveal>
    </div>
  );
}