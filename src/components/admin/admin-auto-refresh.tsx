"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const POLL_MS = 5000;

/**
 * Keeps the admin panel in sync with the database.
 *
 * Polls a lightweight, cached "revision" endpoint every 5s and only calls
 * `router.refresh()` when the revision actually changed — so new orders,
 * product edits and inventory changes appear within a few seconds without
 * hammering MySQL (idle polls hit Next's data cache, not the DB).
 *
 * Polling pauses while the tab is hidden and resumes (with an immediate poll)
 * when it becomes visible again. A manual Refresh button is always available.
 */
export function AdminAutoRefresh() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [visible, setVisible] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const revisionRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  const poll = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/admin/revision", {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!res.ok) return;

      const data: { revision?: string } = await res.json();
      if (typeof data.revision !== "string" || !mountedRef.current) return;

      if (revisionRef.current === null) {
        revisionRef.current = data.revision;
      } else if (revisionRef.current !== data.revision) {
        revisionRef.current = data.revision;
        refresh();
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      // Aborted or network errors are expected; ignore and retry next tick.
    }
  }, [refresh]);

  useEffect(() => {
    mountedRef.current = true;

    const schedule = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        if (!mountedRef.current) return;
        if (document.visibilityState === "visible") await poll();
        schedule();
      }, POLL_MS);
    };

    const onVisibility = () => {
      const isVisible = document.visibilityState === "visible";
      setVisible(isVisible);
      if (isVisible) void poll();
    };

    onVisibility();
    schedule();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [poll]);

  return (
    <div className="flex items-center gap-2 text-xs text-muted">
      <span className="hidden items-center gap-1.5 sm:flex" aria-live="polite">
        <span
          className={`h-2 w-2 rounded-full ${visible ? "animate-pulse bg-success" : "bg-muted"}`}
          aria-hidden
        />
        {visible ? "Live" : "Paused"}
        {lastUpdated ? <span className="text-muted/80">· {lastUpdated}</span> : null}
        {isPending ? <span className="text-muted/80">· updating…</span> : null}
      </span>
      <button
        type="button"
        onClick={refresh}
        disabled={isPending}
        className="rounded-pill border border-hairline bg-warm-white px-2.5 py-1 font-medium text-ink transition-colors hover:bg-soft-beige disabled:opacity-60"
      >
        Refresh
      </button>
    </div>
  );
}
