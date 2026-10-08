"use client";

import { useState } from "react";
import Link from "next/link";
import { formatINR, formatDate } from "@/lib/utils";
import {
  updateReturnStatusAction,
  processReturnRefundAction,
} from "@/actions/admin-returns.action";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";

interface ReturnItemRecord {
  id: string;
  quantity: number;
  orderItem: {
    name: string;
    colour: string;
    size: string;
    price: number | string | { toNumber?: () => number };
  };
}

export interface AdminReturnRequestRecord {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  comments: string | null;
  videoUrl: string | null;
  status: string;
  createdAt: Date | string;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
  order: {
    id: string;
    orderNumber: string;
    total: number | string | { toNumber?: () => number };
    paymentStatus: string;
    paymentId: string | null;
  };
  items: ReturnItemRecord[];
}

interface AdminReturnListProps {
  initialRequests: AdminReturnRequestRecord[];
  currentFilter: string;
}

export function AdminReturnList({ initialRequests, currentFilter }: AdminReturnListProps) {
  const { toast } = useToast();
  const [requests, setRequests] = useState(initialRequests);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filterOptions = ["ALL", "PENDING", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED"];

  const handleStatusUpdate = async (id: string, status: "APPROVED" | "REJECTED" | "RECEIVED") => {
    setPendingId(id);
    const res = await updateReturnStatusAction(id, status);
    setPendingId(null);
    if (res.ok) {
      toast(res.message ?? "Status updated", "success");
      setRequests((list) =>
        list.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } else {
      toast(res.message ?? "Update failed", "error");
    }
  };

  const handleRefund = async (id: string) => {
    if (!confirm("Are you sure you want to restore stock and issue a refund to the customer?")) return;
    setPendingId(id);
    const res = await processReturnRefundAction(id);
    setPendingId(null);
    if (res.ok) {
      toast(res.message ?? "Refund processed successfully", "success");
      setRequests((list) =>
        list.map((r) => (r.id === id ? { ...r, status: "REFUNDED" } : r))
      );
    } else {
      toast(res.message ?? "Refund failed", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 border-b border-hairline pb-3">
        {filterOptions.map((status) => (
          <Link
            key={status}
            href={`/admin/returns${status === "ALL" ? "" : `?status=${status}`}`}
            className={`rounded-pill px-3 py-1 text-xs font-semibold transition-colors ${
              currentFilter === status
                ? "bg-ayli-blue text-white"
                : "bg-warm-white text-ink border border-hairline hover:bg-soft-beige"
            }`}
          >
            {status}
          </Link>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="rounded-card border border-dashed border-hairline bg-warm-white p-12 text-center text-muted">
          No return requests found.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map((req) => {
            const isPending = pendingId === req.id;
            return (
              <div
                key={req.id}
                className="rounded-card border border-hairline bg-warm-white p-5 shadow-soft"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline/70 pb-3">
                  <div>
                    <span className="font-display text-base font-semibold text-ink">
                      Return #{req.id.slice(0, 8)}
                    </span>
                    <span className="ml-2 text-xs text-muted">
                      Order #{req.order.orderNumber}
                    </span>
                    <p className="mt-0.5 text-xs text-muted">
                      Requested on {formatDate(req.createdAt)} by {req.user.name ?? req.user.email} (+91 {req.user.phone ?? "N/A"})
                    </p>
                  </div>
                  <span
                    className={`rounded-pill px-2.5 py-1 text-xs font-semibold ${
                      req.status === "REFUNDED"
                        ? "bg-success/10 text-success"
                        : req.status === "REJECTED"
                          ? "bg-danger/10 text-danger"
                          : req.status === "APPROVED"
                            ? "bg-ayli-blue/10 text-ayli-blue"
                            : "bg-soft-beige text-ink"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">Return Details</p>
                    <p className="mt-1 text-sm font-medium text-ink">Reason: {req.reason}</p>
                    {req.comments ? (
                      <p className="mt-1 text-xs text-muted">Comments: &quot;{req.comments}&quot;</p>
                    ) : null}

                    {req.videoUrl ? (
                      <div className="mt-3">
                        <a
                          href={req.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-card bg-ayli-blue/10 px-3 py-1.5 text-xs font-semibold text-ayli-blue hover:bg-ayli-blue/20"
                        >
                          <Icon name="sparkles" className="h-3.5 w-3.5" />
                          View Unboxing Video Proof
                        </a>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-muted italic">No unboxing video uploaded.</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">Returned Items</p>
                    <ul className="mt-1 divide-y divide-hairline/50">
                      {req.items.map((item) => (
                        <li key={item.id} className="py-1 text-xs text-ink">
                          {item.orderItem.name} ({item.orderItem.colour}, {item.orderItem.size}) × {item.quantity} — {formatINR(Number(item.orderItem.price) * item.quantity)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Admin actions */}
                <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-hairline/70 pt-3">
                  {req.status === "PENDING" ? (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isPending}
                        onClick={() => handleStatusUpdate(req.id, "REJECTED")}
                      >
                        Reject Request
                      </Button>
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleStatusUpdate(req.id, "APPROVED")}
                      >
                        Approve Request
                      </Button>
                    </>
                  ) : null}

                  {req.status === "APPROVED" ? (
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleStatusUpdate(req.id, "RECEIVED")}
                    >
                      Mark Item Received
                    </Button>
                  ) : null}

                  {req.status === "RECEIVED" || (req.status === "APPROVED" && req.order.paymentStatus === "PAID") ? (
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleRefund(req.id)}
                      className="bg-success text-white hover:bg-success/90"
                    >
                      Process Refund & Restore Stock
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
