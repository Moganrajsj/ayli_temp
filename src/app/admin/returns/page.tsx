import type { Metadata } from "next";
import { getAdminReturnRequests } from "@/actions/admin-returns.action";
import { AdminReturnList } from "@/components/admin/admin-return-list";

export const metadata: Metadata = {
  title: "Returns & Refunds | Admin",
};

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminReturnsPage({ searchParams }: PageProps) {
  const { status } = await searchParams;
  const requests = await getAdminReturnRequests(status);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Returns & Refunds
          </h1>
          <p className="mt-1 text-sm text-muted">
            Review customer return requests, inspect unboxing video proof, approve/reject, and process refunds.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <AdminReturnList initialRequests={requests} currentFilter={status || "ALL"} />
      </div>
    </div>
  );
}
