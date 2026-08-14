import type { Metadata } from "next";

import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = {
  title: "Вход · BetBoard",
  description:
    "Войдите в приватный клуб ставок BetBoard или создайте аккаунт — ставьте виртуальные очки вместе с друзьями.",
};

/**
 * Страница авторизации и регистрации.
 * Один и тот же экран с анимированным переключателем режимов
 * (?mode=login | ?mode=register). Кинематографичная сцена «вход на стадион».
 */
export default function LoginPage() {
  return <AuthScreen />;
}