import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PageContainer } from "@/components/layout/page-container";
import { FloatingWhatsApp } from "@/components/whatsapp/floating-whatsapp";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/account");

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 bg-soft-beige/40">
        <PageContainer className="py-8 lg:py-14">{children}</PageContainer>
      </main>
      <Footer />
      <BottomNav />
      <FloatingWhatsApp />
    </>
  );
}