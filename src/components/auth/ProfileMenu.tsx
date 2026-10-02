"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AuthUser, useAuth } from "./AuthProvider";

interface ProfileMenuProps {
  user: AuthUser;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}

export function ProfileMenu({ user, anchorRef, onClose }: ProfileMenuProps) {
  const { signOut } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [flipClass, setFlipClass] = useState("");

  useLayoutEffect(() => {
    const updatePosition = () => {
      if (!anchorRef.current || !menuRef.current) return;
      const anchorRect = anchorRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      
      let top = anchorRect.top - menuRect.height - 8;
      let left = anchorRect.left;
      let isFlipped = false;

      // Flip below if not enough space above
      if (top < 8) {
        top = anchorRect.bottom + 8;
        isFlipped = true;
      }
      
      // Clamp left
      if (left + menuRect.width > window.innerWidth - 8) {
        left = window.innerWidth - menuRect.width - 8;
      }
      if (left < 8) left = 8;

      setStyle({
        top: `${top}px`,
        left: `${left}px`,
      });
      setFlipClass(isFlipped ? "flip-down" : "");
    };

    updatePosition();
    
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, { capture: true, passive: true });
    
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, { capture: true });
    };
  }, [anchorRef]);

  useLayoutEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [anchorRef, onClose]);

  const handleSignOut = () => {
    signOut();
    onClose();
  };

  if (typeof window === "undefined") return null;

  return createPortal(
    <div ref={menuRef} className={`profile-menu ${flipClass}`} style={style} role="menu">
      <p className="profile-menu-name">{user.name}</p>
      <p className="profile-menu-email">{user.email}</p>
      <div className="profile-menu-divider" />
      <button className="profile-menu-item" onClick={handleSignOut} role="menuitem">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        Sign out
      </button>
    </div>,
    document.body
  );
}
