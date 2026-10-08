import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin Sign In | AYLI",
  description: "Administrator sign in to the AYLI management console.",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  redirect("/admin");
}
