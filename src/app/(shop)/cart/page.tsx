import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getServerCart } from "@/lib/cart";
import { PageContainer } from "@/components/layout/page-container";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Your Bag",
};

export default async function CartPage() {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const initial = userId ? await getServerCart(userId) : undefined;

  return (
    <div className="pt-6">
      <PageContainer>
        <CartView mode={userId ? "user" : "guest"} initial={initial} />
      </PageContainer>
    </div>
  );
}