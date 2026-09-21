"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toggleWishlist } from "@/actions/wishlist.action";
import { useToast } from "@/components/ui/toast";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface WishlistButtonProps {
  productId: string;
  initiallyWishlisted?: boolean;
  className?: string;
}

export function WishlistButton({
  productId,
  initiallyWishlisted = false,
  className = "",
}: WishlistButtonProps) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [wishlisted, setWishlisted] = useState(initiallyWishlisted);
  const [pending, setPending] = useState(false);
  const [popKey, setPopKey] = useState(0);

  const handleToggle = async () => {
    if (status !== "authenticated") {
      toast("Sign in to save this piece", "info");
      router.push(`/signin?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    setPending(true);
    const result = await toggleWishlist(productId);
    setPending(false);
    if (result.ok) {
      const added = result.added ?? false;
      setWishlisted(added);
      setPopKey((k) => k + 1);
      toast(
        added
          ? "Saved to your wishlist"
          : "Removed from your wishlist",
        "success"
      );
    } else {
      toast(result.message ?? "Could not update your wishlist.", "error");
    }
  };

  return (
    <button
      type="button"
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={wishlisted}
      onClick={handleToggle}
      disabled={pending}
      className={`inline-grid h-11 w-11 place-items-center rounded-full border transition-colors disabled:opacity-50 ${
        wishlisted
          ? "border-ayli-blue/30 bg-ayli-blue/10 text-ayli-blue"
          : "border-hairline bg-warm-white text-muted hover:text-ink"
      } ${className}`}
    >
      <Icon
        key={`${String(wishlisted)}-${popKey}`}
        name="heart"
        solid={wishlisted}
        className={cn(
          "h-5 w-5",
          wishlisted && "animate-heart-pop"
        )}
      />
    </button>
  );
}