"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/field";
import { SubmitButton } from "./submit-button";
import { registerUser } from "@/actions/auth.action";

export function SignUpForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction] = useActionState(registerUser, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <Input
        label="Full name"
        type="text"
        name="name"
        placeholder="Your name"
        autoComplete="name"
        required
      />

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
        placeholder="Min. 8 characters"
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={128}
      />

      <Input
        label="Confirm password"
        type="password"
        name="confirmPassword"
        placeholder="Re-enter password"
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={128}
      />

      {state && !state.ok ? (
        <p className="text-sm text-[#D95C5C]" role="alert">
          {state.message}
        </p>
      ) : null}

      <SubmitButton>Create account</SubmitButton>
    </form>
  );
}