"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";

export interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Транслитерация русских/латинских символов в slug-формат для /b/{slug}.
 * Бекенд принимает только /^[a-z0-9-]+$/ (CreateBoardDto).
 */
function transliterate(raw: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
    з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
    ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
    я: "ya",
  };

  return raw
    .toLowerCase()
    .split("")
    .map((ch) => {
      if (map[ch] !== undefined) return map[ch];
      if (/[a-z0-9]/.test(ch)) return ch;
      return "-";
    })
    .join("")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Диалог создания новой группы (доски).
 * Адрес slug генерируется автоматически из названия — пользователь вводит
 * только имя. Если адрес уже занят, бекенд верёт ConflictException, и мы
 * показываем понятную ошибку. После создания — переход на страницу группы.
 */
export function CreateGroupDialog({ open, onOpenChange }: CreateGroupDialogProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const generatedSlug = transliterate(name).slice(0, 40);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError("Название должно быть не короче 2 символов");
      return;
    }

    const slug = generatedSlug;
    if (slug.length < 2) {
      setError("По названию не получилось построить адрес — добавьте буквы");
      return;
    }

    setPending(true);
    try {
      const board = await api.boards.create({
        name: trimmedName,
        slug,
        description: description.trim() || undefined,
        currencyName: "очки",
      });
      router.push(`/b/${board.slug}`);
    } catch (err: any) {
      const message = err.message || "Не удалось создать группу";
      // Бекенд: ConflictException('Slug already taken') при занятом адресе.
      setError(/slug|taken|адрес/i.test(message)
        ? "Группа с таким адресом уже существует — измените название"
        : message);
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Создать группу"
      description="Соберите свою компанию: пригласите друзей по инвайт-коду и начните сезон ставок."
      size="md"
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Название" htmlFor="cg-name" required>
          <Input
            id="cg-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например, «Настольный клуб»"
            maxLength={60}
            autoFocus
          />
        </Field>

        {generatedSlug && (
          <p className="flex items-center gap-1.5 text-xs text-fg-3">
            <span>Адрес:</span>
            <code className="tnum rounded bg-surface-2 px-1.5 py-0.5 font-mono text-fg-2">
              /b/{generatedSlug}
            </code>
          </p>
        )}

        <Field label="Описание" htmlFor="cg-desc" hint="Необязательно, до 300 символов">
          <Input
            id="cg-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="О чём эта группа"
            maxLength={300}
          />
        </Field>

        {error && (
          <p role="alert" className="rounded-lg border border-loss/30 bg-loss-tint px-3 py-2 text-[13px] text-loss">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Отмена
          </Button>
          <Button type="submit" className="btn-primary-glow" disabled={pending}>
            {pending ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                Создаём…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" aria-hidden />
                Создать
              </>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}