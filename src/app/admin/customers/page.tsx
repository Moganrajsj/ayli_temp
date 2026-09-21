import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Icon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Customers",
  description: "Customer list and basic details.",
};

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();

  const where = q
    ? {
        role: "CUSTOMER" as const,
        OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }],
      }
    : { role: "CUSTOMER" as const };

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Customers</h1>
      <p className="mt-1 text-sm text-muted">{users.length} registered customer{users.length === 1 ? "" : "s"}</p>

      <form method="get" className="mt-5 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Search</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Name, email or phone…"
            className="h-11 w-72 max-w-full rounded-card border border-hairline bg-warm-white px-4 text-[15px] text-ink placeholder:text-muted/70 focus:border-ayli-blue focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="flex h-11 items-center gap-2 rounded-pill bg-ink px-5 text-sm font-medium text-warm-white transition-colors hover:bg-black"
        >
          <Icon name="search" className="h-4 w-4" />
          Search
        </button>
      </form>

      <div className="mt-5 overflow-x-auto rounded-card border border-hairline bg-warm-white shadow-soft">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-xs uppercase tracking-widest text-muted">
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Orders</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline/70">
            {users.map((u) => {
              return (
                <tr key={u.id} className="transition-colors hover:bg-soft-beige/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-soft-beige text-sm font-semibold text-muted">
                        {u.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.image} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          (u.name ?? u.email ?? "?").charAt(0).toUpperCase()
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{u.name ?? "—"}</p>
                        <p className="truncate text-xs text-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{u.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{u._count.orders}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(u.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {users.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">No customers found.</p>
        ) : null}
      </div>
    </div>
  );
}