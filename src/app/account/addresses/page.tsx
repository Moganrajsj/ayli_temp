import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/ui/icons";
import { AccountBreadcrumb } from "@/components/account/account-breadcrumb";
import { AddressForm, type AddressFormValues } from "@/components/account/address-form";
import { deleteAddress, setDefaultAddress } from "@/actions/account.action";

export const metadata: Metadata = {
  title: "Saved addresses",
};

export default async function AddressesPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; edit?: string; created?: string; updated?: string; deleted?: string; default?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  const addresses = await prisma.address.findMany({
    where: { userId: session?.user?.id ?? "" },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  const editing = params.edit ? addresses.find((a) => a.id === params.edit) : undefined;
  const showForm = params.new === "1" || Boolean(editing);

  const statusBanners: Array<[string, string]> = [];
  if (params.created) statusBanners.push(["created", "Address added."]);
  if (params.updated) statusBanners.push(["updated", "Address updated."]);
  if (params.deleted) statusBanners.push(["deleted", "Address removed."]);
  if (params.default) statusBanners.push(["default", "Default address changed."]);

  const editDefaults: AddressFormValues | undefined = editing
    ? {
        id: editing.id,
        name: editing.name,
        phone: editing.phone,
        line1: editing.line1,
        line2: editing.line2 ?? "",
        city: editing.city,
        state: editing.state,
        pincode: editing.pincode,
        country: editing.country,
        isDefault: editing.isDefault,
      }
    : undefined;

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <AccountBreadcrumb page="Saved addresses" />
          <h1 className="mb-1 font-display text-2xl font-semibold tracking-tight text-ink">
            Saved addresses
          </h1>
          <p className="text-sm text-muted">
            {addresses.length}
            {addresses.length === 1 ? " address" : " addresses"} on file.
          </p>
        </div>
        {!showForm ? (
          <Link
            href="/account/addresses?new=1"
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-pill bg-ayli-blue px-5 text-[15px] font-medium text-white shadow-soft transition-colors hover:bg-[#1ba9bc]"
          >
            <Icon name="plus" className="h-4 w-4" />
            Add
          </Link>
        ) : null}
      </div>

      {statusBanners.map(([key, text]) => (
        <p
          key={key}
          className="mb-4 rounded-card bg-success/10 px-4 py-2.5 text-sm font-medium text-[#3C9B72]"
          role="status"
        >
          {text}
        </p>
      ))}

      {showForm ? (
        <div className="mb-6">
          <AddressForm defaults={editDefaults} onCancelHref="/account/addresses" />
        </div>
      ) : null}

      {addresses.length === 0 && !showForm ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-hairline bg-warm-white px-6 py-14 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-soft-beige text-ayli-blue">
            <Icon name="map-pin" className="h-7 w-7" />
          </span>
          <p className="font-display text-lg font-medium text-ink">No saved addresses yet</p>
          <p className="max-w-xs text-sm text-muted">
            Add an address to breeze through checkout next time.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="rounded-card border border-hairline bg-warm-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-base font-medium text-ink">
                    {address.name}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">+91 {address.phone}</p>
                </div>
                {address.isDefault ? (
                  <span className="shrink-0 rounded-pill bg-ayli-peach/15 px-2.5 py-1 text-xs font-semibold text-[#B85C38]">
                    Default
                  </span>
                ) : null}
              </div>

              <p className="mt-3 text-sm leading-relaxed text-ink">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
                <br />
                {address.city}, {address.state} — {address.pincode}
                <br />
                {address.country}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-hairline/70 pt-3">
                <Link
                  href={`/account/addresses?edit=${address.id}`}
                  className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-soft-beige"
                >
                  <Icon name="edit" className="h-4 w-4" />
                  Edit
                </Link>

                {!address.isDefault ? (
                  <form action={setDefaultAddress}>
                    <input type="hidden" name="id" value={address.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-medium text-ayli-blue transition-colors hover:bg-soft-beige"
                    >
                      <Icon name="star" className="h-4 w-4" />
                      Make default
                    </button>
                  </form>
                ) : null}

                <form action={deleteAddress}>
                  <input type="hidden" name="id" value={address.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-medium text-[#D95C5C] transition-colors hover:bg-[#D95C5C]/10"
                  >
                    <Icon name="trash" className="h-4 w-4" />
                    Remove
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}