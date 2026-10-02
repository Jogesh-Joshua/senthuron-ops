"use client";

import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { AuthUser, useAuth } from "./AuthProvider";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { safeReturnPath } from "@/lib/safe-redirect";
import { usePathname, useSearchParams } from "next/navigation";

type Mode = "welcome" | "signin" | "signup";

interface AuthModalProps {
  initialMode: Mode;
  reason?: string;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
}

export function AuthModal({ initialMode, reason, onClose, onSuccess }: AuthModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<Mode>(initialMode);
  
  const [trackHeight, setTrackHeight] = useState<number | "auto">("auto");
  const trackRef = useRef<HTMLDivElement>(null);
  
  const { googleEnabled } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const modeIndex = mode === "welcome" ? 0 : mode === "signin" ? 1 : 2;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  const handleCancel = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onClose();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    const { data, error } = await authClient.signIn.email({
      email,
      password,
    });
    if (error) {
      setErrorMsg("Incorrect email or password.");
      setLoading(false);
    } else if (data) {
      toast.success(`Signed in as ${data.user.name}`);
      onSuccess(data.user as AuthUser);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name,
    });
    if (error) {
      if (error.code === "USER_ALREADY_EXISTS") {
        setErrorMsg("An account with this email already exists. Sign in instead.");
      } else {
        setErrorMsg(error.message || "Sign up failed.");
      }
      setLoading(false);
    } else if (data) {
      toast.success("Account created");
      onSuccess(data.user as AuthUser);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setErrorMsg(null);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: safeReturnPath(currentPath),
      errorCallbackURL: `${pathname}?auth_error=google`,
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  useLayoutEffect(() => {
    if (!trackRef.current) return;
    const activePanel = trackRef.current.children[modeIndex] as HTMLElement;
    if (activePanel) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setTrackHeight(entry.target.scrollHeight);
        }
      });
      observer.observe(activePanel);
      return () => observer.disconnect();
    }
  }, [modeIndex]);

  return (
    <dialog
      ref={dialogRef}
      className="auth-dialog"
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      <div className="auth-dialog-header">
        <h2 className="auth-dialog-title">
          {mode === "welcome" ? "Senthuron Ops" : mode === "signin" ? "Sign In" : "Create Account"}
        </h2>
        <button className="auth-dialog-close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="auth-track-viewport" style={{ height: trackHeight !== "auto" ? `${trackHeight}px` : "auto" }}>
        <div 
          className="auth-track" 
          ref={trackRef}
          style={{ transform: `translateX(-${modeIndex * 100}%)` }}
        >
          {/* Welcome Panel */}
          <div className="auth-panel" inert={mode !== "welcome"} aria-hidden={mode !== "welcome"}>
            {reason && (
              <div className="mb-6 p-4 bg-[var(--color-sunken)] border-l-2 border-[var(--color-brand)] rounded text-[var(--color-ink-2)] text-sm">
                {reason}
              </div>
            )}
            {errorMsg && (
              <div className="mb-6 p-4 bg-[#fef2f2] border-l-2 border-[#ef4444] rounded text-[#b91c1c] text-sm" role="alert">
                {errorMsg}
              </div>
            )}
            <p className="mb-8 text-[var(--color-ink-3)] text-sm leading-relaxed">
              Log in to your Senthuron Ops dashboard to manage enquiries, team assignments, and business intelligence.
            </p>
            <div className="flex flex-col gap-3">
              <button className="btn-primary w-full" onClick={() => setMode("signin")}>
                Sign In
              </button>
              <button className="btn-secondary w-full" onClick={() => setMode("signup")}>
                Create Account
              </button>
            </div>
          </div>

          {/* Sign In Panel */}
          <div className="auth-panel" inert={mode !== "signin"} aria-hidden={mode !== "signin"}>
            <form onSubmit={handleSignIn}>
              {errorMsg && (
                <div className="mb-6 p-4 bg-[#fef2f2] border-l-2 border-[#ef4444] rounded text-[#b91c1c] text-sm" role="alert">
                  {errorMsg}
                </div>
              )}
              <div className="mb-4">
                <label className="field-label">Email</label>
                <input type="email" className="input-field w-full" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
              </div>
              <div className="mb-6 relative">
                <label className="field-label">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} className="input-field w-full pr-10" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-primary w-full mb-3" disabled={loading}>
                {loading ? "Signing In..." : "Sign In"}
              </button>
              {googleEnabled && (
                <button type="button" className="auth-provider-btn mb-6" onClick={handleGoogle} disabled={loading}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v8M8 12h8"></path></svg>
                  Continue with Google
                </button>
              )}
              <div className="text-center">
                <button type="button" className="text-[var(--color-ink-3)] hover:text-[var(--color-ink)] text-sm underline" onClick={() => setMode("signup")}>
                  Create an account
                </button>
              </div>
            </form>
          </div>

          {/* Sign Up Panel */}
          <div className="auth-panel" inert={mode !== "signup"} aria-hidden={mode !== "signup"}>
            <form onSubmit={handleSignUp}>
              {errorMsg && (
                <div className="mb-6 p-4 bg-[#fef2f2] border-l-2 border-[#ef4444] rounded text-[#b91c1c] text-sm" role="alert">
                  {errorMsg}
                </div>
              )}
              <div className="mb-4">
                <label className="field-label">Full Name</label>
                <input type="text" className="input-field w-full" value={name} onChange={e => setName(e.target.value)} required disabled={loading} />
              </div>
              <div className="mb-4">
                <label className="field-label">Email</label>
                <input type="email" className="input-field w-full" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
              </div>
              <div className="mb-4 relative">
                <label className="field-label">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} className="input-field w-full pr-10" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="mb-6 relative">
                <label className="field-label">Confirm Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} className="input-field w-full pr-10" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required disabled={loading} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-primary w-full mb-3" disabled={loading}>
                {loading ? "Creating..." : "Create Account"}
              </button>
              {googleEnabled && (
                <button type="button" className="auth-provider-btn mb-6" onClick={handleGoogle} disabled={loading}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v8M8 12h8"></path></svg>
                  Sign up with Google
                </button>
              )}
              <div className="text-center">
                <button type="button" className="text-[var(--color-ink-3)] hover:text-[var(--color-ink)] text-sm underline" onClick={() => setMode("signin")}>
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </dialog>
  );
}
