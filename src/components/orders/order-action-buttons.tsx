"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { cancelOrder, verifyAndConfirmOrder } from "@/actions/order.action";
import { createReturnRequest } from "@/actions/return.action";
import { loadRazorpay } from "@/lib/razorpay-checkout";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";

interface OrderActionButtonsProps {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentOrderId: string | null;
  paymentMethod?: string | null;
  total: number;
  customerName: string;
  customerPhone: string;
  items: Array<{ id: string; name: string; colour: string; size: string; quantity: number }>;
}

export function OrderActionButtons({
  orderId,
  orderNumber,
  status,
  paymentStatus,
  paymentOrderId,
  total,
  customerName,
  customerPhone,
  items,
}: OrderActionButtonsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pending, setPending] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Return Form State
  const [selectedItems, setSelectedItems] = useState<string[]>(() => items.map((i) => i.id));
  const [reason, setReason] = useState("Defective/Damaged product");
  const [comments, setComments] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const canCancel = status === "PENDING" || status === "CONFIRMED";
  const canReturn = status === "DELIVERED";
  const canRetryPayment = status === "PENDING" && paymentStatus === "PENDING";

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setPending(true);
    const res = await cancelOrder(orderId);
    setPending(false);
    if (res.ok) {
      toast(res.message ?? "Order cancelled successfully.", "success");
      router.refresh();
    } else {
      toast(res.message ?? "Could not cancel order.", "error");
    }
  };

  const handleRetryPayment = async () => {
    setPending(true);
    try {
      const Razorpay = await loadRazorpay();
      const pubKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!paymentOrderId || !pubKey) {
        toast("Payment gateway credentials not available.", "error");
        setPending(false);
        return;
      }

      new Razorpay({
        key: pubKey,
        amount: Math.round(total * 100),
        currency: "INR",
        name: "AYLI",
        description: `Order ${orderNumber}`,
        order_id: paymentOrderId,
        prefill: {
          name: customerName,
          contact: customerPhone,
        },
        theme: { color: "#22C0D4" },
        notes: { orderId, orderNumber },
        handler: async (response) => {
          const verifyRes = await verifyAndConfirmOrder({
            orderId,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
          if (verifyRes.ok) {
            toast("Payment successful!", "success");
            router.refresh();
          } else {
            toast(verifyRes.message ?? "Payment verification failed.", "error");
          }
        },
      }).open();
    } catch {
      toast("Could not start payment retry window.", "error");
    } finally {
      setPending(false);
    }
  };

  const handleVideoUpload = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      toast("Video file must be 50 MB or smaller.", "error");
      return;
    }
    setUploadingVideo(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload/return-video", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.ok && data.url) {
        setVideoUrl(data.url);
        toast("Unboxing video uploaded successfully!", "success");
      } else {
        toast(data.error ?? "Video upload failed.", "error");
      }
    } catch {
      toast("Could not upload video.", "error");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      toast("Please select a return reason.", "info");
      return;
    }
    setPending(true);
    const res = await createReturnRequest({
      orderId,
      itemIds: selectedItems,
      reason,
      comments,
      videoUrl,
    });
    setPending(false);
    if (res.ok) {
      toast(res.message ?? "Return request submitted!", "success");
      setShowReturnModal(false);
      router.refresh();
    } else {
      toast(res.message ?? "Failed to submit return request.", "error");
    }
  };

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {canRetryPayment ? (
        <Button onClick={handleRetryPayment} disabled={pending} className="bg-[#2e9e6d] text-white">
          <Icon name="credit-card" className="h-4 w-4" />
          Retry Payment Now
        </Button>
      ) : null}

      {canCancel ? (
        <Button variant="secondary" onClick={handleCancel} disabled={pending} className="text-danger hover:bg-danger/10">
          <Icon name="x" className="h-4 w-4" />
          Cancel Order
        </Button>
      ) : null}

      {canReturn ? (
        <Button variant="secondary" onClick={() => setShowReturnModal(true)}>
          <Icon name="refresh" className="h-4 w-4" />
          Request Return / Exchange
        </Button>
      ) : null}

      {/* Return Request Modal */}
      {showReturnModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-card bg-warm-white p-6 shadow-xl animate-pop-in">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="font-display text-lg font-semibold text-ink">Request Return</h3>
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="text-muted hover:text-ink"
              >
                <Icon name="x" className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="mt-4 space-y-4">
              {items.length > 1 ? (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                    Select Items to Return
                  </label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto rounded-card border border-hairline p-2">
                    {items.map((item) => {
                      const isSelected = selectedItems.includes(item.id);
                      return (
                        <label key={item.id} className="flex items-center gap-2 text-xs text-ink cursor-pointer hover:bg-soft-beige/50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              setSelectedItems((prev) =>
                                e.target.checked
                                  ? [...prev, item.id]
                                  : prev.filter((id) => id !== item.id)
                              );
                            }}
                            className="h-3.5 w-3.5 accent-ayli-blue"
                          />
                          <span>
                            {item.name} ({item.colour}, {item.size}) × {item.quantity}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Reason for Return
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-card border border-hairline bg-warm-white p-2.5 text-sm text-ink focus:border-ayli-blue focus:outline-none"
                >
                  <option value="Defective/Damaged product">Defective / Damaged product</option>
                  <option value="Wrong size/fit">Wrong size / fit</option>
                  <option value="Item not as pictured">Item not as pictured</option>
                  <option value="Changed mind">Changed mind</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Comments (Optional)
                </label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Tell us what was wrong with the item..."
                  className="w-full rounded-card border border-hairline bg-warm-white p-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-ayli-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Unboxing Video Proof (Max 50 MB, MP4/WebM)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingVideo}
                    className="rounded-card border border-hairline bg-soft-beige px-3 py-2 text-xs font-medium text-ink hover:border-ayli-blue"
                  >
                    {uploadingVideo ? "Uploading Video..." : videoUrl ? "Change Video" : "Upload Video File"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleVideoUpload(e.target.files[0]);
                    }}
                  />
                  {videoUrl ? (
                    <span className="text-xs text-success font-medium flex items-center gap-1">
                      <Icon name="check" className="h-3.5 w-3.5" /> Video Attached
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-hairline">
                <Button type="button" variant="secondary" onClick={() => setShowReturnModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending || uploadingVideo}>
                  {pending ? "Submitting..." : "Submit Return Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
