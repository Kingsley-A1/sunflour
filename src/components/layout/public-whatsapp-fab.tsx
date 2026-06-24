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
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-[var(--layer-toast)] inline-flex min-h-12 min-w-12 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-success)] px-4 text-[var(--color-text-inverse)] shadow-[var(--shadow-floating)] transition duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)] hover:brightness-95 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] md:bottom-6"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <span className="flex items-center gap-2">
        <WhatsAppIcon className="h-5 w-5" />
        <span className="hidden text-sm font-semibold sm:inline">WhatsApp</span>
      </span>
    </a>
  );
}
