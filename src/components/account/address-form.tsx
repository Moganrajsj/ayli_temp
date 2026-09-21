"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Input } from "@/components/ui/field";
import { SubmitButton } from "../auth/submit-button";
import { createAddress, updateAddress } from "@/actions/account.action";
import { cn } from "@/lib/utils";

export interface AddressFormValues {
  id?: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

interface AddressFormProps {
  defaults?: AddressFormValues;
  onCancelHref: string;
}

export function AddressForm({ defaults, onCancelHref }: AddressFormProps) {
  const action = defaults?.id ? updateAddress : createAddress;
  const [state, formAction] = useActionState(action, undefined);
  const isEditing = Boolean(defaults?.id);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-card border border-hairline bg-warm-white p-5">
      {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Full name"
          type="text"
          name="name"
          defaultValue={defaults?.name}
          autoComplete="name"
          error={state?.fieldErrors?.name}
          required
        />
        <Input
          label="Phone"
          type="tel"
          name="phone"
          inputMode="numeric"
          defaultValue={defaults?.phone}
          autoComplete="tel"
          placeholder="10-digit mobile number"
          maxLength={10}
          error={state?.fieldErrors?.phone}
          required
        />
      </div>

      <Input
        label="Address line 1"
        type="text"
        name="line1"
        defaultValue={defaults?.line1}
        autoComplete="address-line1"
        placeholder="House no., building, street"
        error={state?.fieldErrors?.line1}
        required
      />
      <Input
        label="Address line 2 (optional)"
        type="text"
        name="line2"
        defaultValue={defaults?.line2}
        autoComplete="address-line2"
        placeholder="Area, landmark"
        error={state?.fieldErrors?.line2}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="City"
          type="text"
          name="city"
          defaultValue={defaults?.city}
          autoComplete="address-level2"
          error={state?.fieldErrors?.city}
          required
        />
        <Input
          label="State"
          type="text"
          name="state"
          defaultValue={defaults?.state}
          autoComplete="address-level1"
          error={state?.fieldErrors?.state}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Pincode"
          type="text"
          name="pincode"
          inputMode="numeric"
          defaultValue={defaults?.pincode}
          autoComplete="postal-code"
          maxLength={6}
          error={state?.fieldErrors?.pincode}
          required
        />
        <Input
          label="Country"
          type="text"
          name="country"
          defaultValue={defaults?.country ?? "India"}
          autoComplete="country-name"
          error={state?.fieldErrors?.country}
          required
        />
      </div>

      <label className="flex items-center gap-2.5 text-[15px] text-ink">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={defaults?.isDefault ?? false}
          className={cn(
            "h-4.5 w-4.5 rounded-[4px] border border-hairline accent-[#22C0D4]"
          )}
        />
        Set as my default address
      </label>

      {state && !state.ok ? (
        <p className="text-sm text-[#D95C5C]" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="mt-1 flex items-center gap-3">
        <SubmitButton>{isEditing ? "Save address" : "Add address"}</SubmitButton>
        <Link
          href={onCancelHref}
          className="inline-flex h-12 items-center rounded-pill px-5 text-[15px] font-medium text-ink transition-colors hover:bg-soft-beige"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}