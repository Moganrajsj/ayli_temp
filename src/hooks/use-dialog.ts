"use client";

import { useCallback, useEffect, type KeyboardEvent as ReactKeyboardEvent } from "react";

export function useDialog(open: boolean, onClose: () => void) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      root.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleKeyDown]);

  return {
    onKeyDown: (event: ReactKeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
  };
}