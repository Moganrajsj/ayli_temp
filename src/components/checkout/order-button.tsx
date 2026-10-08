"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface OrderButtonProps {
  onClick: () => Promise<void | boolean> | void;
  isSubmitting?: boolean;
  disabled?: boolean;
  className?: string;
  defaultText?: string;
  successText?: string;
  fullWidth?: boolean;
}

export function OrderButton({
  onClick,
  isSubmitting = false,
  disabled = false,
  className = "",
  defaultText = "Complete Order",
  successText = "Order Placed",
  fullWidth = false,
}: OrderButtonProps) {
  const [animating, setAnimating] = useState(false);

  async function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (animating || disabled || isSubmitting) return;

    setAnimating(true);
    try {
      const res = await onClick();
      if (res === false) {
        // Revert animation if the order attempt was unsuccessful
        setAnimating(false);
      }
    } catch {
      setAnimating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || animating || isSubmitting}
      className={cn(
        "ayli-order-btn",
        animating && "animate",
        fullWidth && "max-w-none w-full",
        className
      )}
      aria-label={animating ? successText : defaultText}
    >
      <span className="btn-text default">{defaultText}</span>
      <span className="btn-text success">
        {successText}
        <svg viewBox="0 0 12 10" aria-hidden="true">
          <polyline points="1.5 6 4.5 9 10.5 1" />
        </svg>
      </span>
      <div className="box" aria-hidden="true" />
      <div className="truck" aria-hidden="true">
        <div className="back" />
        <div className="front">
          <div className="window" />
        </div>
        <div className="light top" />
        <div className="light bottom" />
      </div>
      <div className="lines" aria-hidden="true" />
    </button>
  );
}
