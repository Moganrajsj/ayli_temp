import { Sheet, type SheetProps } from "@/components/ui/sheet";

/** Centered dialog (desktop) — built on the shared Sheet primitive. */
export function Modal(props: Omit<SheetProps, "position">) {
  return <Sheet {...props} position="center" />;
}