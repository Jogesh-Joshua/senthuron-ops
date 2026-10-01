import type { Metadata } from "next";
import { Newsreader, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// ─── Fonts ────────────────────────────────────────────────────────────────────
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-plex-sans",
  weight: ["400", "500", "600"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  display: "swap",
});

// ─── Metadata ─────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "Senthuron Ops",
    template: "%s · Senthuron Ops",
  },
  description:
    "Enquiry management for Senthuron Tech — track every opportunity from first contact to won or lost.",
  robots: { index: false }, // internal tool; do not index
};

// ─── Root layout ──────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
    >
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
