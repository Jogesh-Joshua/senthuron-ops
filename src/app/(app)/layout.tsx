// src/app/(app)/layout.tsx
// App shell: desktop sidebar + mobile nav + main content area.

import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { getSessionUser } from "@/lib/auth-guard";
import { env } from "@/lib/env";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  const googleEnabled = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

  return (
    <AuthProvider initialUser={user} googleEnabled={googleEnabled}>
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
    </AuthProvider>
  );
}
