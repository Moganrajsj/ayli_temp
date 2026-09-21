import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountBreadcrumb } from "@/components/account/account-breadcrumb";
import { ProfileForm } from "@/components/account/profile-form";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const session = await auth();
  const { updated } = await searchParams;

  const freshUser = await prisma.user.findUnique({
    where: { id: session?.user?.id ?? "" },
    select: { name: true, email: true, phone: true },
  });

  const name = freshUser?.name ?? session?.user?.name ?? "";
  const email = freshUser?.email ?? session?.user?.email ?? "";

  return (
    <div>
      <AccountBreadcrumb page="Profile" />
      <h1 className="mb-1 font-display text-2xl font-semibold tracking-tight text-ink">
        Profile
      </h1>
      <p className="mb-6 text-sm text-muted">Your personal details and contact info.</p>

      {updated === "1" ? (
        <p
          className="mb-4 rounded-card bg-success/10 px-4 py-2.5 text-sm font-medium text-[#3C9B72]"
          role="status"
        >
          Your profile was updated.
        </p>
      ) : null}

      <ProfileForm name={name} email={email} phone={freshUser?.phone ?? ""} />
    </div>
  );
}