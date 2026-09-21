import { whatsappUrl } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";

interface WhatsAppButtonProps {
  message?: string;
  variant?: "primary" | "peach" | "secondary";
  className?: string;
  label?: string;
}

export function WhatsAppButton({
  message,
  variant = "primary",
  className,
  label = "Chat on WhatsApp",
}: WhatsAppButtonProps) {
  return (
    <Button href={whatsappUrl(message)} variant={variant} className={className} target="_blank">
      <Icon name="whatsapp" solid className="h-5 w-5" />
      {label}
    </Button>
  );
}