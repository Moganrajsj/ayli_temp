// PhonePe redirect callback page.
// After a customer completes (or abandons) payment on PhonePe's hosted page,
// PhonePe redirects them here with ?txnId=<merchantTransactionId>.
//
// This Server Component:
//   1. Reads txnId from the URL search params (searchParams is a Promise in Next 16).
//   2. Calls verifyAndConfirmOrder({ txnId }) which hits PhonePe's status API.
//   3. Redirects to /order/<orderNumber> on success, or back to /checkout with an
//      error query param on failure.

import { redirect } from "next/navigation";
import { verifyAndConfirmOrder } from "@/actions/order.action";

export const metadata = {
  title: "Payment Processing",
};

export default async function CheckoutCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { txnId } = await searchParams;

  // Guard: no txnId means this page was hit directly — send to checkout.
  if (!txnId || typeof txnId !== "string") {
    redirect("/checkout");
  }

  const result = await verifyAndConfirmOrder({ txnId });

  if (!result.ok) {
    // Pass the error message back to the checkout page via query param so the
    // CheckoutFlow component can surface it to the user.
    const msg = encodeURIComponent(
      result.message ?? "Payment could not be confirmed. Please try again."
    );
    redirect(`/checkout?paymentError=${msg}`);
  }

  redirect(`/order/${result.orderNumber}`);
}
