import { NextResponse } from "next/server";
import { serializePreview, type CartLineInput } from "@/lib/cart";

interface PreviewRequestItem {
  variantId?: unknown;
  quantity?: unknown;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const incoming = Array.isArray((body as Record<string, unknown>)?.items)
    ? ((body as { items: unknown[] }).items as PreviewRequestItem[]).slice(0, 50)
    : [];

  const inputs: CartLineInput[] = [];
  const seen = new Set<string>();

  for (const item of incoming) {
    const variantId = typeof item?.variantId === "string" ? item.variantId : "";
    const quantity = Number(item?.quantity);
    if (!variantId || !Number.isFinite(quantity) || quantity < 1) continue;
    if (seen.has(variantId)) continue;
    seen.add(variantId);
    inputs.push({ variantId, quantity: Math.floor(quantity) });
  }

  const cart = await serializePreview(inputs);
  return NextResponse.json(cart);
}