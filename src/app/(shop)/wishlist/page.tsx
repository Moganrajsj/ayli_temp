import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getWishlist } from "@/lib/wishlist";
import { PageContainer } from "@/components/layout/page-container";
import { WishlistGrid } from "@/components/wishlist/wishlist-grid";
import { Icon } from "@/components/ui/icons";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Wishlist",
};

export default async function WishlistPage() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return (
      <div className="pt-6">
        <PageContainer>
          <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-hairline bg-warm-white px-6 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-soft-beige text-ayli-blue">
              <Icon name="heart" className="h-7 w-7" />
            </span>
            <p className="font-display text-lg font-medium text-ink">Your AYLI Edit</p>
            <p className="max-w-xs text-sm text-muted">
              Sign in to save the pieces you love and find them here anytime.
            </p>
            <Link
              href="/signin?callbackUrl=/wishlist"
              className={buttonClasses({ className: "mt-2" })}
            >
              Sign in to view your wishlist
            </Link>
          </div>
        </PageContainer>
      </div>
    );
  }

  const entries = await getWishlist(userId);

  return (
    <div className="pt-6">
      <PageContainer>
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Your AYLI Edit
          </h1>
          <p className="mt-1 text-sm text-muted">
            {entries.length} saved piece{entries.length === 1 ? "" : "s"}
          </p>
        </div>
        <WishlistGrid entries={entries} />
      </PageContainer>
    </div>
  );
}