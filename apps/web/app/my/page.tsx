import type { Metadata } from "next";
import { MyGroups } from "@/components/auth/my-groups";
import { LandingAuthNav } from "@/components/auth/landing-auth-nav";
import { TopBar } from "@/components/layout/top-bar";
import { Reveal } from "@/components/motion/reveal";
import { LogoMark } from "@/components/brand/logo-mark";

export const metadata: Metadata = {
  title: "Мои группы — BetBoard",
};

export default function MyGroupsPage() {
  return (
    <div className="relative flex min-h-svh flex-col overflow-x-clip bg-bg text-fg">
      <div className="noise" aria-hidden />

      <TopBar>
        <LandingAuthNav />
      </TopBar>

      <main className="relative z-10 flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
          <Reveal className="mb-8">
            <div className="flex items-center gap-3">
              <LogoMark className="h-10 w-10 rounded-xl text-lg" />
              <div>
                <h1 className="font-display text-2xl font-black tracking-tight text-fg">
                  Мои группы
                </h1>
                <p className="mt-1 text-sm text-fg-2">
                  Доски, в которых вы состоите, и приглашения для друзей.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <MyGroups />
          </Reveal>
        </div>
      </main>
    </div>
  );
}