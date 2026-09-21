import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { FloatingWhatsApp } from "@/components/whatsapp/floating-whatsapp";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
      <BottomNav />
      <FloatingWhatsApp />
    </>
  );
}