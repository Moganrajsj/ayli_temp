"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/field";
import { SubmitButton } from "./submit-button";
import { signInWithCredentials } from "@/actions/auth.action";

export function SignInForm({
  callbackUrl,
  submitLabel = "Sign in",
}: {
  callbackUrl: string;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(signInWithCredentials, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <Input
        label="Email"
        type="email"
        name="email"
        placeholder="you@example.com"
        autoComplete="email"
        required
      />

      <Input
        label="Password"
        type="password"
        name="password"
        placeholder="Enter your password"
        autoComplete="current-password"
        required
        minLength={8}
      />

      {state && !state.ok ? (
        <p className="text-sm text-[#D95C5C]" role="alert">
          {state.message}
        </p>
      ) : null}

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}