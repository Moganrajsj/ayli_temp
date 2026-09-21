"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/icons";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const KIND_META: Record<ToastKind, { icon: IconName; solid: boolean; classes: string }> = {
  success: { icon: "sparkles", solid: true, classes: "text-success" },
  error: { icon: "x", solid: false, classes: "text-danger" },
  info: { icon: "heart", solid: false, classes: "text-ayli-blue" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = "success") => {
      const id = ++idRef.current;
      setItems((prev) => [...prev.slice(-2), { id, kind, message }]);
      window.setTimeout(() => dismiss(id), 3200);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6"
      >
        {items.map((item) => {
          const meta = KIND_META[item.kind];
          return (
            <div
              key={item.id}
              role="status"
              className="pointer-events-auto flex max-w-md items-center gap-2.5 rounded-pill bg-ink px-4 py-3 text-sm text-warm-white shadow-float animate-toast-in"
            >
              <Icon name={meta.icon} solid={meta.solid} className={cn("h-4 w-4", meta.classes)} />
              <span className="font-medium">{item.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}