import { MessageCircle } from "lucide-react";

interface WhatsAppProofButtonProps {
  href: string;
}

export function WhatsAppProofButton({ href }: WhatsAppProofButtonProps) {
  return (
    <a
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)] transition duration-[var(--motion-normal)] ease-[var(--ease-standard)] hover:bg-[var(--color-primary-hover)]"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      Send proof on WhatsApp
    </a>
  );
}
