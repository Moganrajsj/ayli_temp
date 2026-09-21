"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

export function SubmitButton({
  children,
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      fullWidth
      size="lg"
      variant={variant}
      isLoading={pending}
      className={className}
    >
      {children}
    </Button>
  );
}