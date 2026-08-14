"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Lock,
  LogIn,
  Sparkles,
  User,
  UserPlus,
} from "lucide-react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api, setAuthToken } from "@/lib/api/client";

export type AuthMode = "login" | "register";

export interface AuthFormProps {
  mode: AuthMode;
  boardName: string;
}

/**
 * Карточка входа/регистрации.
 * Переключатель режимов со скользящей пилюлей, поля логина и пароля с тумблером
 * видимости, демо-подсказка. Вызывает server actions login/register.
 */
export function AuthForm({ mode, boardName }: AuthFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");

  const isLogin = mode === "login";
  const verb = isLogin ? "войти" : "создать аккаунт";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setShake(false);
    setPending(true);

    let res: any = null;
    try {
      if (isLogin) {
        res = await api.auth.login({ login: loginValue, password });
      } else {
        res = await api.auth.register({ name, login: loginValue, password });
      }
    } catch (err: any) {
      setError(err.message || "Ошибка авторизации");
      setShake(true);
      setPending(false);
      return;
    }

    // API returns { user, accessToken } on success, no `ok` field
    if (res?.accessToken) {
      setAuthToken(res.accessToken);
      setSuccess(isLogin ? "Вход выполнен! Перенаправляем…" : "Аккаунт создан! Перенаправляем…");
      setPending(false);
      // Small delay to show success message before redirect
      setTimeout(() => router.push("/my"), 600);
      return;
    }

    // Fallback: if response has error-like shape
    if (res && !res.accessToken) {
      setError(res.message || res.error || "Ошибка авторизации");
      setShake(true);
    }
    setPending(false);
  };

  const switchMode = (next: AuthMode) => {
    setError(null);
    setSuccess(null);
    setShake(false);
    router.replace(`/login?mode=${next}`);
  };

  return (
    <div className="terminal-panel card-interactive relative w-full overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-volt/10 blur-3xl"
      />

      <div className="relative p-6 sm:p-8">
        {/* Переключатель режимов */}
        <div className="auth-tabs" data-mode={mode} role="tablist" aria-label="Выбор режима">
          <span aria-hidden className="auth-tab-pill" />
          <button
            type="button"
            role="tab"
            aria-selected={isLogin}
            aria-controls="auth-panel"
            onClick={() => mode !== "login" && switchMode("login")}
            className={cn(
              "relative z-10 flex h-10 items-center justify-center gap-2 rounded-full text-[13px] font-semibold transition-colors duration-300",
              isLogin ? "text-volt-ink" : "text-fg-2 hover:text-fg",
            )}
          >
            <LogIn className="h-4 w-4" aria-hidden />
            Вход
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isLogin}
            aria-controls="auth-panel"
            onClick={() => mode !== "register" && switchMode("register")}
            className={cn(
              "relative z-10 flex h-10 items-center justify-center gap-2 rounded-full text-[13px] font-semibold transition-colors duration-300",
              isLogin ? "text-fg-2 hover:text-fg" : "text-volt-ink",
            )}
          >
            <UserPlus className="h-4 w-4" aria-hidden />
            Регистрация
          </button>
        </div>

        {/* Контент формы — пересоздаётся при смене режима для перехода-анимации */}
        <form
          key={mode}
          onSubmit={submit}
          noValidate
          role="tabpanel"
          id="auth-panel"
          aria-label={isLogin ? "Форма входа" : "Форма регистрации"}
          className={cn("auth-swap mt-7 space-y-4", shake && "auth-shake")}
          onAnimationEnd={(e) => {
            if (e.animationName === "auth-shake") setShake(false);
          }}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-fg">
                {isLogin ? (
                  <KeyRound className="h-4 w-4 text-volt" aria-hidden />
                ) : (
                  <Sparkles className="h-4 w-4 text-volt" aria-hidden />
                )}
                {isLogin ? "С возвращением" : "Новый игрок"}
              </div>
              {!isLogin && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-volt-ring bg-volt-tint px-2 py-0.5 text-[11px] font-semibold text-volt">
                  <span className="live-dot" aria-hidden />
                  старт 1000 очков
                </span>
              )}
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-fg-3">
              {isLogin
                ? `Войдите, чтобы открыть доску «${boardName}» и занять место в рейтинге оракулов.`
                : "Вступите в доску, получите стартовый баланс и ставьте очки с первого дня сезона."}
            </p>
          </div>

          {!isLogin && (
            <Field label="Имя" htmlFor="auth-name" required>
              <Input
                id="auth-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Как вас зовут"
                autoComplete="name"
                maxLength={32}
                className="transition-all duration-300 focus:bg-surface-3"
              />
            </Field>
          )}

          <Field label={isLogin ? "Логин или имя" : "Логин"} htmlFor="auth-login" required>
            <Input
              id="auth-login"
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
              placeholder={isLogin ? "vika или Вика" : "например, vika"}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              maxLength={60}
              className="transition-all duration-300 focus:bg-surface-3"
            />
          </Field>

          <Field label="Пароль" htmlFor="auth-password" required>
            <div className="relative">
              <Input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isLogin ? "current-password" : "new-password"}
                maxLength={128}
                className="pr-11 transition-all duration-300 focus:bg-surface-3"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-fg-3 transition-colors duration-300 hover:bg-surface-3 hover:text-fg"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
          </Field>

          {error && (
            <p
              role="alert"
              className="animate-fade-in flex items-start gap-2 rounded-lg border border-loss/30 bg-loss-tint px-3 py-2 text-[13px] text-loss"
            >
              <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {error}
            </p>
          )}

          {success && (
            <p
              role="status"
              className="animate-fade-in flex items-center gap-2 rounded-lg border border-win/30 bg-win-tint px-3 py-2 text-[13px] text-win"
            >
              <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {success}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="auth-sheen btn-primary-glow group w-full"
            disabled={pending}
          >
            {pending ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                {isLogin ? "Входим…" : "Создаём…"}
              </>
            ) : (
              <>
                {verb === "войти" ? "Войти на доску" : "Создать аккаунт"}
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </>
            )}
          </Button>

          
        </form>
      </div>
    </div>
  );
}