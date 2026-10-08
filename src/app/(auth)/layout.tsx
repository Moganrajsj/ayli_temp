import type { ReactNode } from "react";
import { Logo } from "@/components/layout/logo";
import { BackButton } from "@/components/layout/back-button";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-warm-white">
      <header className="flex items-center justify-center py-6">
        <Logo />
      </header>
      <main className="flex flex-1 items-start justify-center px-5 pb-16 sm:items-center">
        <div className="w-full max-w-sm">
          <BackButton className="mb-5" />
          {children}
        </div>
      </main>
    </div>
  );
}
