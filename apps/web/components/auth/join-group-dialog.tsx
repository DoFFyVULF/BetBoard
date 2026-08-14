"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { KeyRound, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";

export interface JoinGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Вызывается после успешного вступления, чтобы обновить список групп. */
  onJoined?: () => void;
}

/**
 * Диалог вступления в группу по инвайт-коду.
 * Код бывает в двух видах: человеческий «BB-PYAT-7F3K» или UUID, генерируемый
 * бекендом для новых групп. Бекенд ищет его точечно (регистро-зависимо),
 * поэтому код передаём без изменений. После вступления открываются ставки.
 */
export function JoinGroupDialog({ open, onOpenChange, onJoined }: JoinGroupDialogProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const clean = code.trim();
    if (!clean) {
      setError("Введите инвайт-код");
      return;
    }

    setPending(true);
    try {
      const member = await api.boards.joinByCode(clean);
      // API возвращает GroupMember include user — boardId не годится для slug-перехода,
      // поэтому после успеха идём в «Мои группы», где список уже обновится.
      setSuccess("Вы вступили в группу!");
      setTimeout(() => {
        onOpenChange(false);
        router.push("/my");
        router.refresh();
        onJoined?.();
      }, 600);
    } catch (err: any) {
      setError(err.message || "Не удалось вступить по коду");
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Вступить по коду"
      description="Попросите код у владельца группы (например «BB-PYAT-7F3K») и вступите, чтобы делать ставки."
      size="sm"
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Инвайт-код" htmlFor="jg-code" required>
          <Input
            id="jg-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Например, BB-PYAT-7F3K"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={60}
            autoFocus
            className="tnum font-mono tracking-wider"
          />
        </Field>

        {error && (
          <p role="alert" className="rounded-lg border border-loss/30 bg-loss-tint px-3 py-2 text-[13px] text-loss">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="rounded-lg border border-win/30 bg-win-tint px-3 py-2 text-[13px] text-win">
            {success}
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
                Вступаем…
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" aria-hidden />
                Вступить
              </>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}