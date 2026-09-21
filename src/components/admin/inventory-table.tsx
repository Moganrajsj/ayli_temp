"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateVariantStockAction } from "@/actions/admin.action";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";

export interface InventoryRow {
  variantId: string;
  productName: string;
  slug: string;
  colour: string;
  size: string;
  sku: string;
  stock: number;
  threshold: number;
}

interface InventoryTableProps {
  rows: InventoryRow[];
}

export function InventoryTable({ rows }: InventoryTableProps) {
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ id: string; type: "ok" | "error"; msg: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onChange(variantId: string, value: string) {
    setEdits((e) => ({ ...e, [variantId]: value }));
  }

  async function saveStock(variantId: string) {
    const raw = edits[variantId];
    const stock = Number(raw);
    if (!Number.isFinite(stock) || stock < 0 || stock > 99999) {
      setFeedback({ id: variantId, type: "error", msg: "Enter a number between 0 and 99999." });
      return;
    }
    const res = await updateVariantStockAction(variantId, Math.floor(stock));
    setFeedback({ id: variantId, type: res.ok ? "ok" : "error", msg: res.message ?? "" });
    if (res.ok) {
      setEdits((e) => {
        const n = { ...e };
        delete n[variantId];
        return n;
      });
      startTransition(() => router.refresh());
    }
  }

  return (
    <div className="overflow-x-auto rounded-card border border-hairline bg-warm-white shadow-soft">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead>
          <tr className="border-b border-hairline text-xs uppercase tracking-widest text-muted">
            <th className="px-4 py-3 font-semibold">Product</th>
            <th className="px-4 py-3 font-semibold">Variant</th>
            <th className="px-4 py-3 font-semibold">SKU</th>
            <th className="px-4 py-3 font-semibold">Stock</th>
            <th className="px-4 py-3 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline/70">
          {rows.map((row) => {
            const current = edits[row.variantId] ?? String(row.stock);
            const isDirty = String(row.stock) !== current.trim();
            const fb = feedback?.id === row.variantId ? feedback : null;
            return (
              <tr
                key={row.variantId}
                className={`transition-colors ${
                  fb?.type === "error" ? "bg-danger/5" : fb?.type === "ok" ? "bg-success/5" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <p className="truncate font-medium text-ink">{row.productName}</p>
                  <p className="text-xs text-muted">/{row.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-ink">{row.colour} · {row.size}</p>
                  <p className="text-xs text-muted">Low ≤ {row.threshold}</p>
                </td>
                <td className="px-4 py-3 text-muted">{row.sku}</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    max="99999"
                    value={current}
                    onChange={(e) => onChange(row.variantId, e.target.value)}
                    aria-label={`Stock for ${row.colour} ${row.size}`}
                    className={`h-10 w-24 rounded-card border px-3 text-sm text-ink focus:outline-none ${
                      isDirty ? "border-ayli-blue" : "border-hairline"
                    }`}
                  />
                  {fb ? (
                    <p className={`mt-1 text-xs ${fb.type === "ok" ? "text-success" : "text-danger"}`}>
                      {fb.msg}
                    </p>
                  ) : isDirty ? (
                    <p className="mt-1 text-xs text-muted">Unsaved</p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    isLoading={pending}
                    disabled={!isDirty}
                    onClick={() => saveStock(row.variantId)}
                    className={!isDirty ? "opacity-40" : ""}
                  >
                    <Icon name="check" className="h-4 w-4" />
                    Save
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted">No variants with inventory.</p>
      ) : null}
    </div>
  );
}