import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { FloatingWhatsApp } from "@/components/whatsapp/floating-whatsapp";
import { BackButton } from "@/components/layout/back-button";
import { PageContainer } from "@/components/layout/page-container";
import { SplashScreen } from "@/components/layout/splash-screen";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SplashScreen />
      <Header />
      <main id="main-content" className="flex-1">
        <PageContainer className="pt-4">
          <BackButton />
        </PageContainer>
        {children}
      </main>
      <Footer />
      <BottomNav />
      <FloatingWhatsApp />
    </>
  );
}
