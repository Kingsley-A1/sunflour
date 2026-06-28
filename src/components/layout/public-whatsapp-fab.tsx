import { WhatsAppIcon } from "@/components/ui/brand-icons";

interface PublicWhatsAppFabProps {
  businessName: string;
  href: string | null;
}

export function PublicWhatsAppFab({
  businessName,
  href,
}: PublicWhatsAppFabProps) {
  if (!href) {
    return null;
  }

  return (
    <a
      aria-label={`Message ${businessName} on WhatsApp`}
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-[var(--layer-toast)] inline-flex h-14 w-14 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-success)] text-[var(--color-text-inverse)] shadow-[var(--shadow-floating)] transition duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)] hover:brightness-95 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] md:bottom-6"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <WhatsAppIcon className="h-6 w-6" />
    </a>
  );
}
