"use client";

import React, { useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { ProfileMenu } from "./ProfileMenu";

export function AuthControl() {
  const { user, openAuth } = useAuth();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLButtonElement>(null);

  if (!user) {
    return (
      <button className="btn-secondary btn-sm" onClick={() => openAuth({ mode: "welcome" })}>
        Sign in
      </button>
    );
  }

  const initial = Array.from(user.name.trim())[0]?.toUpperCase() || "?";

  return (
    <>
      <button
        ref={avatarRef}
        className="auth-avatar"
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        aria-label={`Account menu, ${user.name}`}
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        {initial}
      </button>
      {isMenuOpen && (
        <ProfileMenu
          user={user}
          anchorRef={avatarRef}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}
