import Link from "next/link";
import { NotFoundContent } from "@/components/ui/not-found-content";

export default function RootNotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-hairline/60 bg-warm-white/96 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4 lg:px-6">
          <Link
            href="/"
            className="font-display text-2xl font-bold tracking-tight text-ink"
          >
            AYLI<span className="text-ayli-peach">.</span>
          </Link>
        </div>
      </header>
      <main className="flex flex-1 flex-col justify-center">
        <NotFoundContent />
      </main>
    </div>
  );
}