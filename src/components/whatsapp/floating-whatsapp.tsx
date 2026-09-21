"use client";

import { whatsappUrl } from "@/config/constants";
import { Icon } from "@/components/ui/icons";

export function FloatingWhatsApp() {
  return (
    <a
      href={whatsappUrl("Hi AYLI, I need help finding something")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-20 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-float transition-transform hover:scale-105 active:scale-95 sm:bottom-8 sm:h-14 sm:w-14"
    >
      <Icon name="whatsapp" solid className="h-7 w-7" />
    </a>
  );
}