"use client";

import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";

import { api } from "@/lib/api/client";
import type { CommentView } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface CommentSectionProps {
  eventId: string;
  comments: CommentView[];
  currentUserName: string;
  currentUserAvatar: string;
  className?: string;
}

export function CommentSection({
  eventId,
  comments,
  currentUserName,
  currentUserAvatar,
  className,
}: CommentSectionProps) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = text.trim();

    if (!trimmed || pending) return;

    setPending(true);
    setError(null);

    try {
      const res = await api.comments.create(eventId, { text: trimmed });

      if (res.ok) {
        setText("");
      } else {
        setError(res.error || "Ошибка при добавлении комментария");
      }
    } catch (err: any) {
      setError(err.message || "Ошибка при добавлении комментария");
    }

    setPending(false);
  };

  return (
    <section className={className} aria-labelledby="comments-title">
      <h2
        id="comments-title"
        className="mb-3 text-base font-semibold text-fg"
      >
        Обсуждение
        <span className="ml-2 tnum font-mono text-xs font-normal text-fg-3">
          {comments.length}
        </span>
      </h2>

      {/* Форма */}
      <div className="mb-4 space-y-2">
        <div className="flex gap-2.5">
          <Avatar
            name={currentUserName}
            color={currentUserAvatar as never}
            size="sm"
            className="mt-1.5"
          />

          <Textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            placeholder="Напишите прогноз или подкол товарища…"
            rows={2}
            maxLength={500}
            aria-label="Комментарий"
            invalid={!!error}
            className="transition-all duration-300 focus:bg-surface-3"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">до 500 символов</span>

          <Button
            size="sm"
            className="btn-primary-glow group"
            disabled={!text.trim() || pending}
            onClick={submit}
          >
            {pending ? "Отправляем…" : "Отправить"}

            <Send
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Button>
        </div>

        {error && (
          <p role="alert" className="text-xs text-loss">
            {error}
          </p>
        )}
      </div>

      {/* Список */}
      {comments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-hairline-strong py-8 text-center">
          <MessageCircle className="h-5 w-5 text-fg-3" aria-hidden />

          <p className="text-sm text-fg-2">
            Пока никто не обсуждал. Будьте первым.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {comments.map((c, index) => (
            <li
              key={c.id}
              className="animate-fade-up flex gap-2.5"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <Avatar
                name={c.user.name}
                color={c.user.avatar}
                size="sm"
                className="mt-0.5"
              />

              <div className="min-w-0 flex-1 rounded-xl rounded-tl-sm bg-surface-2 px-3 py-2 transition-all duration-300 hover:bg-surface-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-[13px] font-medium text-fg">
                    {c.user.name}
                  </span>

                  <span className="text-[11px] text-muted">
                    {timeAgo(c.createdAt)}
                  </span>
                </div>

                <p className="mt-0.5 text-sm leading-relaxed text-fg-2">
                  {c.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}