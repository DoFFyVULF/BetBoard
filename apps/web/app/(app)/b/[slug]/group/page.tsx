import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Reveal } from "@/components/motion/reveal";
import { GroupMembers } from "@/components/group/group-members";
import { getBoardBySlug } from "@/lib/data/api-accessors";

export interface GroupPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: GroupPageProps): Promise<Metadata> {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);

  return {
    title: board ? `Группа — ${board.name}` : "Группа",
  };
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);

  if (!board) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <Reveal>
        <PageHeader
          title="Группа"
          description="Участники доски и инвайт-код для приглашения новых оракулов."
        />
      </Reveal>

      <Reveal delay={60}>
        <GroupMembers boardId={board.id} inviteCode={board.inviteCode} />
      </Reveal>
    </div>
  );
}