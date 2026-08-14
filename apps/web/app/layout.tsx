import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Unbounded } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "cyrillic"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "BetBoard — виртуальные ставки для компании друзей",
    template: "%s · BetBoard",
  },
  description:
    "Приватная игровая платформа: прогнозы на дружеские события, сезонные виртуальные очки, рейтинги и репутация оракулов. Без реальных денег.",
  keywords: [
    "BetBoard",
    "ставки",
    "прогнозы",
    "виртуальные очки",
    "дружеские события",
  ],
  openGraph: {
    title: "BetBoard — виртуальные ставки для компании друзей",
    description:
      "Прогнозируй, ставь виртуальные очки, забирай титул оракула. Без реальных денег.",
    type: "website",
    locale: "ru_RU",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${manrope.variable} ${jetbrains.variable} ${unbounded.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
