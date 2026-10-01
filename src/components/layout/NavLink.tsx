"use client";
// src/components/layout/NavLink.tsx
// Active-aware navigation link. Client component because it reads pathname.

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  exact?: boolean;
}

export function NavLink({
  href,
  children,
  className = "",
  activeClassName = "",
  exact = false,
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`${className} ${isActive ? activeClassName : ""}`.trim()}
    >
      {children}
    </Link>
  );
}
