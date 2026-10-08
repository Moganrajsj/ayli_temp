"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProductAction } from "@/actions/admin.action";
import { Icon } from "@/components/ui/icons";

interface DeleteProductButtonProps {
  productId: string;
  productName: string;
}

export function DeleteProductButton({ productId, productName }: DeleteProductButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${productName}"?\n\nIf this product has order history it will be hidden from the storefront instead of permanently deleted.`)) {
      return;
    }
    setPending(true);
    try {
      await deleteProductAction(productId);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      aria-label={`Delete ${productName}`}
      className="inline-flex items-center gap-1 rounded-pill px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
    >
      {pending ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-danger border-t-transparent" />
      ) : (
        <Icon name="trash" className="h-3.5 w-3.5" />
      )}
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
