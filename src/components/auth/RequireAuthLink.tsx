"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

interface RequireAuthLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
  style?: React.CSSProperties;
}

export function RequireAuthLink({ href, className, children, style, "aria-label": ariaLabel }: RequireAuthLinkProps) {
  const { user, openAuth } = useAuth();

  if (!user) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          openAuth({ mode: "signin" });
        }}
        className={className}
        style={style}
        aria-label={ariaLabel}
      >
        {children}
      </button>
    );
  }

  return (
    <Link href={href} className={className} style={style} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
