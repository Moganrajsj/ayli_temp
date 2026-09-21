import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerCart } from "@/lib/cart";
import type { CheckoutAddress } from "@/lib/checkout";
import { PageContainer } from "@/components/layout/page-container";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";

export const metadata: Metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/checkout");

  const { lines, totals } = await getServerCart(session.user.id);
  if (lines.length === 0 || !totals || totals.itemCount <= 0) {
    redirect("/cart");
  }

  const addressRows = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  const addresses: CheckoutAddress[] = addressRows.map((address) => ({
    id: address.id,
    name: address.name,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    country: address.country,
    isDefault: address.isDefault,
  }));

  return (
    <div className="pt-6">
      <PageContainer>
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Checkout
          </h1>
          <p className="mt-1 text-sm text-muted">
            {totals.itemCount} item{totals.itemCount === 1 ? "" : "s"} in your bag
          </p>
        </div>
        <CheckoutFlow addresses={addresses} lines={lines} totals={totals} />
      </PageContainer>
    </div>
  );
}