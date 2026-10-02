"use client";
// src/components/layout/MobileNav.tsx
// Mobile top bar + bottom tab bar. Client because it reads pathname.

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AuthControl } from "../auth/AuthControl";
import { RequireAuthLink } from "../auth/RequireAuthLink";

export function MobileNav() {
  const pathname = usePathname();

  const isDashboard = pathname === "/";
  const isEnquiries = pathname.startsWith("/enquiries") && pathname !== "/enquiries/new";
  const isNew = pathname === "/enquiries/new" || pathname.endsWith("/edit");

  // Hide bottom tab bar on focused task pages
  const hideTabBar = pathname === "/enquiries/new" || pathname.endsWith("/edit");

  return (
    <>
      {/* Top bar */}
      <header className="mobile-topbar" aria-label="App header">
        <Link href="/" className="mobile-wordmark" aria-label="Senthuron Ops — Dashboard">
          <Image src="/logo.svg" alt="Senthuron Logo" width={24} height={24} style={{ width: "auto", height: "auto" }} priority aria-hidden="true" />
          <span className="mobile-wordmark-text">Senthuron Ops</span>
        </Link>
        <div className="flex items-center gap-3">
          <RequireAuthLink href="/enquiries/new" className="btn-secondary btn-sm" aria-label="Create new enquiry">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span className="mobile-new-label">New</span>
          </RequireAuthLink>
          <AuthControl />
        </div>
      </header>

      {/* Bottom tab bar */}
      {!hideTabBar && (
        <nav className="mobile-tabbar" aria-label="Main navigation">
          <Link
            href="/"
            className={`mobile-tab ${isDashboard ? "mobile-tab--active" : ""}`}
            aria-current={isDashboard ? "page" : undefined}
            aria-label="Dashboard"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            <span>Dashboard</span>
          </Link>

          <Link
            href="/enquiries"
            className={`mobile-tab ${isEnquiries ? "mobile-tab--active" : ""}`}
            aria-current={isEnquiries ? "page" : undefined}
            aria-label="Enquiries"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
            </svg>
            <span>Enquiries</span>
          </Link>

          <RequireAuthLink
            href="/enquiries/new"
            className={`mobile-tab ${isNew ? "mobile-tab--active" : ""}`}
            aria-label="New enquiry"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            <span>New</span>
          </RequireAuthLink>
        </nav>
      )}
    </>
  );
}
