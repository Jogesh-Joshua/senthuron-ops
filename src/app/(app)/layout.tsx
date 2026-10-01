// src/app/(app)/layout.tsx
// App shell: desktop sidebar + mobile nav + main content area.

import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      {/* Desktop sidebar — hidden below lg breakpoint via CSS */}
      <Sidebar />

      {/* Mobile top bar + bottom tab bar — hidden at lg+ via CSS */}
      <MobileNav />

      {/* Main content */}
      <main id="main-content" className="app-main">
        {children}
      </main>
    </div>
  );
}
