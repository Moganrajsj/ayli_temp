import type { ReactNode } from "react";
import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-warm-white">
      <header className="flex items-center justify-center py-6">
        <Logo />
      </header>
      <main className="flex flex-1 items-start justify-center px-5 pb-16 sm:items-center">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}