import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/layout/logo";
import { adminSignOutAction } from "@/actions/admin-auth.action";
import { Icon } from "@/components/ui/icons";

const ADMIN_SIGNIN_PATH = "/admin/login";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const pathname = (await headers()).get("x-pathname") ?? "/admin";

  // The admin login page renders standalone — no admin chrome or outer wrappers
  if (pathname.startsWith(ADMIN_SIGNIN_PATH)) {
    if (session?.user?.role === "ADMIN") redirect("/admin");
    if (session?.user?.id) redirect("/account");
    return <>{children}</>;
  }

  if (!session?.user?.id) redirect(`${ADMIN_SIGNIN_PATH}?callbackUrl=/admin`);
  if (session.user.role !== "ADMIN") redirect("/account");

  return (
    <div className="min-h-dvh bg-soft-beige/40">
      <header className="sticky top-0 z-30 border-b border-hairline bg-warm-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" aria-label="Admin home">
              <Logo />
            </Link>
            <span className="hidden rounded-pill bg-ayli-blue/10 px-3 py-1 text-xs font-semibold text-ayli-blue sm:inline">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-pill px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-soft-beige"
            >
              <Icon name="arrow-right" className="h-4 w-4 rotate-180" />
              <span className="hidden sm:inline">View store</span>
            </Link>
            <form action={adminSignOutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-pill px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-soft-beige"
              >
                <Icon name="logout" className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-24 rounded-card border border-hairline bg-warm-white p-3 shadow-soft">
            <AdminNav />
          </div>
        </aside>
        <main id="main-content" className="min-w-0 flex-1">
          {children}
        </main>
      </div>

      {/* Mobile admin nav */}
      <nav
        aria-label="Mobile admin navigation"
        className="sticky bottom-0 z-30 border-t border-hairline bg-warm-white/95 backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto max-w-7xl px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
          <AdminNav orientation="horizontal" />
        </div>
      </nav>
    </div>
  );
}