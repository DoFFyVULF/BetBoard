import type { Category } from "@/lib/types";
import { categoryLabel } from "@/lib/types";

const COLORS: Record<Category, string> = {
  board: "bg-cat-board/12 text-cat-board ring-cat-board/30",
  sport: "bg-cat-sport/12 text-cat-sport ring-cat-sport/30",
  movie: "bg-cat-movie/12 text-cat-movie ring-cat-movie/30",
  food: "bg-cat-food/12 text-cat-food ring-cat-food/30",
  travel: "bg-cat-travel/12 text-cat-travel ring-cat-travel/30",
  chaos: "bg-cat-chaos/12 text-cat-chaos ring-cat-chaos/30",
  meta: "bg-cat-meta/12 text-cat-meta ring-cat-meta/30",
  games: "bg-cat-games/12 text-cat-games ring-cat-games/30",
};

export interface CategoryBadgeProps {
  category: Category;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset transition-all duration-300 hover:scale-105 ${COLORS[category]} ${className ?? ""}`}
    >
      <span aria-hidden className="h-1 w-1 rounded-full bg-current" />
      {categoryLabel(category)}
    </span>
  );
}