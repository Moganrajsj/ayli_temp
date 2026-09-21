"use client";

import { type ReactNode, type CSSProperties } from "react";
import { useOnScreen } from "@/hooks/use-on-screen";

/* ─────────────────────────────────────────────
   <FadeIn>
   IntersectionObserver-driven fade+slide up.
   Respects prefers-reduced-motion via CSS.
   ───────────────────────────────────────────── */

export function FadeIn({
  children,
  className = "",
  delay = 0,
  style,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  style?: CSSProperties;
}) {
  const { ref, visible } = useOnScreen<HTMLDivElement>();

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(12px)",
        transition: `opacity 0.5s var(--ease-out-soft) ${delay}ms, transform 0.5s var(--ease-out-soft) ${delay}ms`,
        willChange: "opacity, transform",
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   <StaggerChildren>
   Wraps a list container. Each direct child is
   assigned --stagger-index (1-based) via CSS
   custom property for CSS-driven stagger delays.
   ───────────────────────────────────────────── */

export function StaggerChildren({
  children,
  className = "",
  delayBetween = 60,
  baseDelay = 0,
}: {
  children: ReactNode;
  className?: string;
  delayBetween?: number;
  baseDelay?: number;
}) {
  const { ref, visible } = useOnScreen<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={className}
      style={
        {
          "--stagger-count":
            typeof children === "object" && Array.isArray(children)
              ? children.length
              : 1,
        } as CSSProperties
      }
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div
              key={i}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "none" : "translateY(10px)",
                transition: `opacity 0.45s var(--ease-out-soft) ${baseDelay + i * delayBetween}ms, transform 0.45s var(--ease-out-soft) ${baseDelay + i * delayBetween}ms`,
                willChange: "opacity, transform",
              }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   <AnimateOnMount>
   Plays an animation class once when the element
   enters the viewport. Useful for hero sections.
   ───────────────────────────────────────────── */

export function AnimateOnMount({
  children,
  animation = "animate-fade-up",
  className = "",
  delay = 0,
  style,
}: {
  children: ReactNode;
  animation?: string;
  className?: string;
  delay?: number;
  style?: CSSProperties;
}) {
  const { ref, visible } = useOnScreen<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`${visible ? animation : "opacity-0"} ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
