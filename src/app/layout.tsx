import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

// ─── Metadata ─────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "Senthuron Ops",
    template: "%s · Senthuron Ops",
  },
  description:
    "Enquiry management for Senthuron Tech — track every opportunity from first contact to won or lost.",
  robots: { index: false }, // internal tool; do not index
  icons: {
    icon: "/favicon.svg",
  },
};

// ─── Root layout ──────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Skip-to-content link for keyboard and assistive tech users */}
        <a
          href="#main-content"
          className="skip-link"
        >
          Skip to content
        </a>

        {children}

        {/* Global toast provider (Sonner) */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-plex-sans)",
            },
          }}
        />
      </body>
    </html>
  );
}
