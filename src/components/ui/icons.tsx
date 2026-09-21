import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

/* Hand-rolled stroke icon set — no icon dependency,
   full control over the AYLI line-weight aesthetic. */

const STROKE_WIDTH = 1.5;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  solid?: boolean;
  className?: string;
}

export type IconName =
  | "home"
  | "compass"
  | "heart"
  | "bag"
  | "menu"
  | "search"
  | "x"
  | "chevron-right"
  | "chevron-down"
  | "chevron-left"
  | "plus"
  | "minus"
  | "user"
  | "arrow-right"
  | "star"
  | "box"
  | "sparkles"
  | "truck"
  | "shield"
  | "whatsapp"
  | "briefcase"
  | "map-pin"
  | "edit"
  | "trash"
  | "logout"
  | "sliders"
  | "check";

function Paths({ name, solid }: { name: IconName; solid: boolean }) {
  switch (name) {
    case "home":
      return (
        <>
          <path d="m3 11 9-8 9 8" />
          <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
        </>
      );
    case "compass":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path
            d="m15.5 8.5-2 5-5 2 2-5z"
            className={solid ? "fill-current" : undefined}
          />
        </>
      );
    case "heart":
      return solid ? (
        <path
          fill="currentColor"
          stroke="none"
          d="M12 20.2s-6.9-4.4-9.1-8.3C1.1 8.7 2.7 5.2 5.9 5.2c1.6 0 3 .8 3.9 2.1l.6.8.6-.8c.9-1.3 2.3-2.1 3.9-2.1 3.2 0 4.8 3.5 3 6.7-2.2 3.9-9.9 8.3-9.9 8.3z"
        />
      ) : (
        <path d="M12 20s-6.9-4.4-9.1-8.3C1.2 8.8 2.8 5.2 5.9 5.2c1.6 0 3 .8 3.9 2.2L12 10l2.2-2.6c.9-1.4 2.3-2.2 3.9-2.2 3.1 0 4.7 3.6 3 6.5C18.9 15.6 12 20 12 20z" />
      );
    case "bag":
      return (
        <>
          <path d="M6 8h12l-1.1 12.1a1 1 0 0 1-1 .9H8.1a1 1 0 0 1-1-.9.75 0 0 1 0-.2L6 8z" />
          <path d="M9 7V6a3 3 0 0 1 6 0v1" />
        </>
      );
    case "menu":
      return (
        <>
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </>
      );
    case "search":
      return (
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="m16.5 16.5 4 4" />
        </>
      );
    case "x":
      return (
        <>
          <path d="m6 6 12 12" />
          <path d="m18 6-12 12" />
        </>
      );
    case "chevron-right":
      return <path d="m9 6 6 6-6 6" />;
    case "chevron-down":
      return <path d="m6 9 6 6 6-6" />;
    case "chevron-left":
      return <path d="m15 6-6 6 6 6" />;
    case "sliders":
      return (
        <>
          <path d="M4 8h10" />
          <path d="M18 8h2" />
          <circle cx="16" cy="8" r="2" />
          <path d="M4 16h2" />
          <path d="M10 16h10" />
          <circle cx="8" cy="16" r="2" />
        </>
      );
    case "check":
      return <path d="m4.5 12.5 5 5 10-11" />;
    case "plus":
      return (
        <>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </>
      );
    case "minus":
      return <path d="M5 12h14" />;
    case "user":
      return (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-3.8 3.6-6 8-6s8 2.2 8 6" />
        </>
      );
    case "arrow-right":
      return (
        <>
          <path d="M4 12h16" />
          <path d="m14 6 6 6-6 6" />
        </>
      );
    case "star":
      return solid ? (
        <path
          fill="currentColor"
          stroke="none"
          d="m12 2.5 2.6 5.6 6.1.8-4.5 4.3 1.1 6-5.3-2.9L6.7 19.2l1.1-6L3.3 8.9l6.1-.8z"
        />
      ) : (
        <path d="m12 3 2.6 5.3 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8z" />
      );
    case "box":
      return (
        <>
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3z" />
          <path d="M12 12 20 7.5" />
          <path d="M12 12v9" />
          <path d="m12 12-8-4.5" />
        </>
      );
    case "sparkles":
      return (
        <>
          <path d="m12 4 1.7 4.8L18.5 10l-4.8 1.7L12 16.5l-1.7-4.8L5.5 10l4.8-1.2L12 4z" />
          <path d="M18.5 15.5 19.3 18l2.2.7-2.2.7-.8 2.5-.8-2.5-2.2-.7 2.2-.7z" />
        </>
      );
    case "truck":
      return (
        <>
          <path d="M3 6h11v10H3z" />
          <path d="M14 9h4l3 3v4h-7" />
          <circle cx="7" cy="18" r="1.8" />
          <circle cx="17.5" cy="18" r="1.8" />
        </>
      );
    case "shield":
      return (
        <path d="M12 3l7 2.8V12c0 4.6-3 8.2-7 9-4-.8-7-4.4-7-9V5.8L12 3z" />
      );
    case "whatsapp":
      return solid ? (
        <path
          fill="currentColor"
          stroke="none"
          d="M12 2a10 10 0 0 0-8.5 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.4 14.1c-.2.7-1.3 1.3-1.8 1.4-.6.1-1.4.1-2.3-.2-.6-.2-1.4-.4-2.3-1-1.4-1-2.5-2.2-3.3-3.6-.5-.9-1-1.9-1.1-2.8 0-.7.2-1.4.7-1.9.2-.3.6-.5.9-.4h.5c.2 0 .5-.1.8.6.3.7.8 1.7.9 1.8.1.1.1.3 0 .5l-.3.5-.4.5c-.2.2-.3.4-.1.7.4.6.9 1.3 1.6 1.8.7.5 1.2.8 1.4.9.2.1.4 0 .6-.1.5-.6 1-1.2 1.5-1.7.2-.3.4-.3.7-.2l2 1c.2.1.4.3.4.5 0 .1 0 1-.2 1.6z"
        />
      ) : (
        <>
          <path d="M12 3a9 9 0 0 0-7.7 13.6L3.5 20.5l4-1.2A9 9 0 1 0 12 3z" />
          <path d="M9 7c-.5-.2-.8.4-1 .8-.2.6-.2 1.2.2 1.9.6 1.3 1.6 2.4 2.9 3.2.9.6 1.6.9 2.2 1 .5.1.9-.1 1-.6l.8.8.5 0 .3-1.4-.7-.3-1.7-.8" />
        </>
      );
    case "briefcase":
      return (
        <>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          <path d="M3 12h18" />
        </>
      );
    case "map-pin":
      return (
        <>
          <path d="M12 21s-7-5.8-7-11a7 7 0 0 1 14 0c0 5.2-7 11-7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </>
      );
    case "edit":
      return (
        <>
          <path d="M12 20h9" />
          <path d="M16.5 3.5 20.5 7.5 7 21H3v-4L16.5 3.5z" />
        </>
      );
    case "trash":
      return (
        <>
          <path d="M4 7h16" />
          <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          <path d="M6 7l1 12.2a1 1 0 0 0 1 .8h8a1 1 0 0 0 1-.8L18 7" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </>
      );
    case "logout":
      return (
        <>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5" />
          <path d="M21 12H9" />
        </>
      );
    default:
      return null;
  }
}

export function Icon({ name, solid = false, className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("h-6 w-6 shrink-0", className)}
      {...props}
    >
      <Paths name={name} solid={solid} />
    </svg>
  );
}