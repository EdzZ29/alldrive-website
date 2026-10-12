import Image from "next/image";
import logoMark from "@/public/logo-mark.png";
import type { SVGProps } from "react";

export function Logo({ dark = true, className = "" }: { dark?: boolean; className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <Image src={logoMark} alt="" className="h-8 w-auto" preload sizes="48px" />
      <span className="flex flex-col leading-none">
        <span className={`font-display text-lg font-extrabold tracking-tight ${dark ? "text-white" : "text-ink"}`}>
          ALLDRIVE
        </span>
        <span className={`text-[9px] font-semibold uppercase tracking-[0.2em] ${dark ? "text-mute-dark" : "text-mute"}`}>
          Rent a Car Butuan
        </span>
      </span>
    </span>
  );
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.3H8v3h2.6V21h2.9Z" />
    </svg>
  );
}

/** The multicolor Google "G". */
export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/** The multicolor Gmail "M". */
export function GmailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
      <path fill="#4CAF50" d="M45 16.2l-5 2.75-5 4.75V40h7c1.66 0 3-1.34 3-3V16.2z" />
      <path fill="#1E88E5" d="M3 16.2l3.61 1.71L13 23.7V40H6c-1.66 0-3-1.34-3-3V16.2z" />
      <path fill="#E53935" d="M35 11.2 24 19.45 13 11.2 12 17l1 6.7 11 8.25 11-8.25 1-6.7z" />
      <path fill="#C62828" d="M3 12.3v3.9l10 7.5V11.2L9.88 8.86A4.3 4.3 0 0 0 7.3 8C4.92 8 3 9.92 3 12.3z" />
      <path fill="#FBC02D" d="M45 12.3v3.9l-10 7.5V11.2l3.12-2.34A4.3 4.3 0 0 1 40.7 8C43.08 8 45 9.92 45 12.3z" />
    </svg>
  );
}

/** WhatsApp logo in its brand green. */
export function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="#25D366" aria-hidden="true" {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

/** Viber-style chat bubble with a phone, in Viber purple. */
export function ViberIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#7360F2"
        d="M12 1.5c-5.6 0-9.5 3.4-9.5 9 0 3.2 1.3 5.6 3.5 7v4l3.8-2.6c.7.1 1.4.2 2.2.2 5.6 0 9.5-3.5 9.5-8.6s-3.9-9-9.5-9Z"
      />
      <path
        fill="#fff"
        d="M9.2 6.6c.3 0 .5.1.7.4l1 1.6c.2.3.1.7-.1 1l-.5.5c-.2.2-.2.4-.1.6.6 1.2 1.5 2.1 2.7 2.7.2.1.4.1.6-.1l.5-.5c.3-.3.7-.3 1-.1l1.6 1c.3.2.4.6.3.9-.3.9-1.2 1.6-2.2 1.5-3.3-.4-6.3-3.4-6.7-6.7-.1-1 .6-1.9 1.5-2.2l-.3-.6Z"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeLinecap="round"
        strokeWidth="1.1"
        d="M13 5.6a4.6 4.6 0 0 1 4.1 4.1M13 7.6a2.6 2.6 0 0 1 2.1 2.1"
      />
    </svg>
  );
}

export function MessengerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2.5C6.6 2.5 2.5 6.4 2.5 11.6c0 2.7 1.1 5.1 3 6.7v3.2l3-1.7c1.1.3 2.2.5 3.5.5 5.4 0 9.5-3.9 9.5-9.1S17.4 2.5 12 2.5Zm1 12.1-2.4-2.6-4.7 2.6 5.2-5.5 2.5 2.6 4.6-2.6-5.2 5.5Z" />
    </svg>
  );
}
