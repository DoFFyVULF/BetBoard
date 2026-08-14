import { BoardDashboardClient } from "@/components/board/dashboard/board-dashboard-client";

export interface BoardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { slug } = await params;
  return <BoardDashboardClient slug={slug} />;
}