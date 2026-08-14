import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/avatar";
import type { AvatarColor } from "@/lib/types";

export interface UserChipProps {
  name: string;
  avatar: AvatarColor;
  /** Подпись под именем: сезонный баланс, титул. */
  subtitle?: ReactNode;
  href?: string;
  className?: string;
}

/**
 * Чип текущего игрока в шапке: аватар, имя, опциональная подпись.
 * Если передан href — это ссылка на профиль.
 * Группа (`group`) для координации ховера с родительским ProfileMenu.
 */
export function UserChip({
  name,
  avatar,
  subtitle,
  href,
  className,
}: UserChipProps) {
  const inner = (
    <>
      <Avatar name={name} color={avatar} size="sm" className="shrink-0" />

      {/* Текстовая часть: скрыта на мобильных, видна на sm+ */}
      <span className="hidden min-w-0 flex-col items-start text-left sm:flex">
        <span className="truncate text-[13px] font-medium leading-tight text-fg transition-colors duration-200 group-hover:text-volt">
          {name}
        </span>

        {subtitle && (
          <span className="tnum truncate font-mono text-[11px] leading-tight text-fg-3">
            {subtitle}
          </span>
        )}
      </span>

      {/* Шеврон: плавный поворот при ховере группы */}
      <ChevronDown
        aria-hidden
        className="hidden h-3.5 w-3.5 shrink-0 text-fg-3 transition-transform duration-200 ease-out group-hover:rotate-180 group-hover:text-volt sm:block"
      />
    </>
  );

  const cls = cn(
    "group inline-flex max-w-[200px] items-center gap-2 rounded-full border border-hairline-strong bg-surface py-1 pl-1 pr-2.5 transition-all duration-200 ease-out",
    "hover:border-volt/30 hover:bg-surface-2 hover:shadow-[0_0_20px_rgba(215,255,62,0.06)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt/40 focus-visible:ring-offset-1 focus-visible:ring-offset-bg",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }

  return <div className={cls}>{inner}</div>;
}