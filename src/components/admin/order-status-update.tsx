"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatusAction, updateOrderTrackingAction, updateOrderNotesAction } from "@/actions/admin.action";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";

const VALID_STATUSES = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

interface OrderStatusUpdateProps {
  orderId: string;
  currentStatus: string;
  trackingNumber: string | null;
  notes: string | null;
}

export function OrderStatusUpdate({ orderId, currentStatus, trackingNumber, notes }: OrderStatusUpdateProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function changeStatus(newStatus: string) {
    if (newStatus === currentStatus) return;
    const res = await updateOrderStatusAction(orderId, newStatus);
    if (res.ok) {
      setMessage({ type: "ok", text: res.message ?? "Status updated." });
      startTransition(() => router.refresh());
    } else {
      setMessage({ type: "error", text: res.message ?? "Could not update." });
    }
  }

  async function saveTracking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await updateOrderTrackingAction(orderId, String(fd.get("trackingNumber") ?? ""));
    setMessage({ type: res.ok ? "ok" : "error", text: res.message ?? "" });
    if (res.ok) startTransition(() => router.refresh());
  }

  async function saveNotes(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await updateOrderNotesAction(orderId, String(fd.get("notes") ?? ""));
    setMessage({ type: res.ok ? "ok" : "error", text: res.message ?? "" });
    if (res.ok) startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col gap-5">
      {message ? (
        <div
          role={message.type === "error" ? "alert" : "status"}
          className={`rounded-card border px-4 py-3 text-sm ${
            message.type === "ok"
              ? "border-success/30 bg-success/5 text-success"
              : "border-danger/30 bg-danger/5 text-danger"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <section className="rounded-card border border-hairline bg-warm-white p-5 shadow-soft">
        <h2 className="mb-3 font-display text-base font-semibold tracking-tight text-ink">Update status</h2>
        <p className="mb-4 text-sm text-muted">
          Current status: <OrderStatusBadge status={currentStatus} />
        </p>
        <div className="flex flex-wrap gap-2">
          {VALID_STATUSES.map((s) => {
            const isCurrent = s === currentStatus;
            return (
              <Button
                key={s}
                type="button"
                variant={isCurrent ? "primary" : "secondary"}
                size="sm"
                isLoading={isPending && !isCurrent}
                disabled={isCurrent || isPending}
                onClick={() => changeStatus(s)}
                className={isCurrent ? "bg-ayli-blue text-white opacity-70 cursor-default hover:bg-ayli-blue" : ""}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </Button>
            );
          })}
        </div>
      </section>

      <section className="rounded-card border border-hairline bg-warm-white p-5 shadow-soft">
        <h2 className="mb-3 font-display text-base font-semibold tracking-tight text-ink">Tracking</h2>
        <form onSubmit={saveTracking} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            label="Tracking number"
            name="trackingNumber"
            defaultValue={trackingNumber ?? ""}
            placeholder="e.g. DTDC-12345678"
            className="sm:max-w-sm"
          />
          <Button type="submit" variant="secondary" size="sm" isLoading={isPending}>
            Save
          </Button>
        </form>
      </section>

      <section className="rounded-card border border-hairline bg-warm-white p-5 shadow-soft">
        <h2 className="mb-3 font-display text-base font-semibold tracking-tight text-ink">Internal notes</h2>
        <form ref={formRef} onSubmit={saveNotes} className="flex flex-col gap-3">
          <Textarea name="notes" rows={3} defaultValue={notes ?? ""} placeholder="Private notes about this order…" />
          <div>
            <Button type="submit" variant="secondary" size="sm" isLoading={isPending}>
              Save notes
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}