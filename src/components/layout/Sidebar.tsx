// src/components/layout/Sidebar.tsx
// Desktop sidebar — server component (NavLink handles client pathname read).

import Link from "next/link";
import Image from "next/image";
import { NavLink } from "./NavLink";
import { prisma } from "@/lib/db";
import { OPEN_STATUSES } from "@/lib/constants";

// Fetch open count for the Enquiries nav badge
async function getOpenCount(): Promise<number> {
  try {
    return await prisma.enquiry.count({ where: { status: { in: OPEN_STATUSES } } });
  } catch {
    return 0;
  }
}

export async function Sidebar() {
  const openCount = await getOpenCount();

  return (
    <aside
      className="sidebar"
      aria-label="Main navigation"
    >
      {/* Wordmark */}
      <div className="sidebar-wordmark">
        <Link href="/" className="sidebar-logo" aria-label="Senthuron Ops — go to Dashboard">
          <Image src="/logo.svg" alt="Senthuron Logo" width={24} height={24} style={{ width: "auto", height: "auto" }} priority aria-hidden="true" />
          <span className="sidebar-wordmark-text">
            <span className="sidebar-brand-name">Senthuron</span>
            <span className="sidebar-brand-ops">OPS</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="App sections">
        <NavLink
          href="/"
          exact
          className="sidebar-nav-item"
          activeClassName="sidebar-nav-item--active"
        >
          {/* Dashboard icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          href="/enquiries"
          className="sidebar-nav-item"
          activeClassName="sidebar-nav-item--active"
        >
          {/* Inbox icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
          </svg>
          <span>Enquiries</span>
          {openCount > 0 && (
            <span className="sidebar-count" aria-label={`${openCount} open enquiries`} title="Open enquiries">
              {openCount} open
            </span>
          )}
        </NavLink>
      </nav>

      {/* New enquiry — secondary so the page header primary stands alone */}
      <div className="sidebar-new">
        <Link href="/enquiries/new" className="btn-secondary sidebar-new-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New enquiry
        </Link>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <p className="sidebar-footer-brand">Senthuron Tech</p>
      </div>
    </aside>
  );
}
