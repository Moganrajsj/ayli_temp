"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/field";
import { SubmitButton } from "../auth/submit-button";
import { updateProfile } from "@/actions/account.action";

export function ProfileForm({
  name,
  email,
  phone,
}: {
  name: string;
  email: string;
  phone: string;
}) {
  const [state, formAction] = useActionState(updateProfile, undefined);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      {state && state.ok ? (
        <p
          className="rounded-card bg-success/10 px-4 py-2.5 text-sm font-medium text-[#3C9B72]"
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <Input
        label="Full name"
        type="text"
        name="name"
        defaultValue={name}
        autoComplete="name"
        error={state?.fieldErrors?.name}
        required
      />
      <Input
        label="Email"
        type="email"
        name="email"
        defaultValue={email}
        autoComplete="email"
        error={state?.fieldErrors?.email}
        required
      />
      <Input
        label="Phone (WhatsApp)"
        type="tel"
        name="phone"
        inputMode="numeric"
        defaultValue={phone}
        autoComplete="tel"
        placeholder="10-digit mobile number"
        maxLength={10}
        error={state?.fieldErrors?.phone}
        hint="Used for order updates and delivery coordination."
      />

      {state && !state.ok ? (
        <p className="text-sm text-[#D95C5C]" role="alert">
          {state.message}
        </p>
      ) : null}

      <SubmitButton className="mt-1">Save changes</SubmitButton>
    </form>
  );
}