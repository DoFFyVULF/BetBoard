import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BoardLayoutClient from "@/components/layout/board-layout-client";
import { NotMemberView } from "@/components/board/not-member-view";
import { getBoardBySlug, getMyRole } from "@/lib/data/api-accessors";
import type { Board } from "@/lib/types";

export interface BoardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BoardLayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);

  if (!board) {
    return {
      title: "Доска не найдена",
    };
  }

  return {
    title: board.name,
  };
}

export default async function BoardLayout({
  children,
  params,
}: BoardLayoutProps) {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);

  if (!board) {
    notFound();
  }

  // Если текущий пользователь не состоит в группе (или не авторизован) —
  // содержимое доски для него закрыто: показываем плашку с кнопкой на /my.
  const myRole = await getMyRole(board.id);
  if (myRole === null) {
    return <NotMemberView board={board} />;
  }

  // API response includes owner/members — board type now exposes them as optional.
  return (
    <BoardLayoutClient
      board={
        {
          ...board,
          owner: board.owner ?? undefined,
          members: board.members ?? [],
        } as Board
      }
      slug={slug}
    >
      {children}
    </BoardLayoutClient>
  );
}