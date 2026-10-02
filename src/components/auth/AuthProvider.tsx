"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { AuthModal } from "./AuthModal";
import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type OpenAuthParams = {
  reason?: string;
  mode?: "welcome" | "signin" | "signup";
};

type AuthContextType = {
  user: AuthUser | null;
  openAuth: (params?: OpenAuthParams) => void;
  signOut: () => void;
  googleEnabled: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ 
  children, 
  initialUser = null,
  googleEnabled = false
}: { 
  children: ReactNode; 
  initialUser?: AuthUser | null;
  googleEnabled?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: session } = authClient.useSession();
  const user = session?.user ? { id: session.user.id, name: session.user.name, email: session.user.email } : initialUser;
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"welcome" | "signin" | "signup">("welcome");
  const [modalReason, setModalReason] = useState<string | undefined>();

  const openAuth = (params?: OpenAuthParams) => {
    setModalMode(params?.mode || "welcome");
    setModalReason(params?.reason);
    setModalOpen(true);
  };

  const signOut = async () => {
    await authClient.signOut();
    router.refresh();
  };

  useEffect(() => {
    const error = searchParams.get("auth_error");
    if (error === "google") {
      setModalMode("signin");
      setModalReason("Google sign-in didn't complete. Please try again.");
      setModalOpen(true);
      // Remove query param without reloading page
      router.replace(pathname);
    }
  }, [searchParams, pathname, router]);

  const value = {
    user,
    openAuth,
    signOut,
    googleEnabled,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {isModalOpen && (
        <AuthModal
          initialMode={modalMode}
          reason={modalReason}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            router.refresh();
          }}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
