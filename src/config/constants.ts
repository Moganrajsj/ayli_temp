export const APP_NAME = "AYLI";
export const APP_TAGLINE = "Your everyday, elevated.";

export const BRAND_COLOURS = {
  blue: "#5B7FD4",
  peach: "#FF8FAA",
  warmWhite: "#FFFCFD",
  softBeige: "#F9F0F2",
  darkText: "#2A1820",
  mutedText: "#7A5563",
  lightBorder: "#EEDCE4",
  success: "#3C9B72",
  error: "#C0506A",
} as const;

/**
 * Reads a NEXT_PUBLIC_ value with a developer-friendly fallback when the
 * variable is not configured. Prefer setting the real value in the
 * deployment (Vercel → Project → Environment Variables); the fallback keeps
 * the build from failing when the variable is temporarily unset.
 */
function requireConfig(value: string | undefined, key: string, fallback: string): string {
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    console.warn(
      `[config] Environment variable "${key}" is not set; using fallback "${fallback}". ` +
        `Set "${key}" in your deployment (Vercel → Project → Environment Variables).`
    );
  }
  return fallback;
}

export const WHATSAPP_NUMBER = requireConfig(
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  "NEXT_PUBLIC_WHATSAPP_NUMBER",
  "919999999999"
);

export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const SITE_URL = requireConfig(
  process.env.NEXT_PUBLIC_APP_URL,
  "NEXT_PUBLIC_APP_URL",
  "http://localhost:4000"
);