"use client";

import { useActionState } from "react";
import { SubmitButton } from "./submit-button";
import { signInWithGoogle } from "@/actions/auth.action";

export function GoogleButton({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction] = useActionState(signInWithGoogle, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {state && !state.ok ? (
        <p className="text-sm text-[#D95C5C]" role="alert">
          {state.message}
        </p>
      ) : null}
      <SubmitButton variant="secondary">Continue with Google</SubmitButton>
    </form>
  );
}