"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styled from "styled-components";
import { useLanguage } from "@/lib/languageContext";
import { useStoredRole, useUserProfile } from "@/lib/userProfile";
import { IconHome, IconSearch, IconProfile, IconBox } from "@/components/icons";

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const profile = useUserProfile();
  // Hydration-safe: useStoredRole() is SSR-stable (null) and syncs from
  // localStorage right after hydration.
  const storedRole = useStoredRole();

  if (pathname?.startsWith("/onboarding")) return null;
  const isBuyer = (profile?.role ?? storedRole ?? "seller") === "buyer";

  const items = [
    { href: "/", label: t.nav.home, icon: <IconHome /> },
    isBuyer
      ? { href: "/search", label: t.nav.search, icon: <IconSearch /> }
      : { href: "/orders", label: t.nav.orders, icon: <IconBox /> },
    { href: "/profile", label: t.nav.profile, icon: <IconProfile /> },
  ];

  return (
    <StyledWrapper>
      <nav className="navigation-card" aria-label="Primary">
        {items.map((it) => {
          const active = it.href === "/" ? pathname === "/" : pathname?.startsWith(it.href);
          return (
            <Link key={it.href} href={it.href} aria-label={it.label} title={it.label} className={`tab ${active ? "active" : ""}`} aria-current={active ? "page" : undefined}>
              <span className="icon">{it.icon}</span>
            </Link>
          );
        })}
      </nav>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 50;
  display: flex; justify-content: center; pointer-events: none;
  .navigation-card {
    pointer-events: auto; display: flex; align-items: center; gap: 18px;
    background: var(--white); padding: 12px 16px; border-radius: 999px;
    border: 2px solid var(--black); box-shadow: 0 12px 32px rgba(0,0,0,0.16);
  }
  .tab {
    display: flex; align-items: center; justify-content: center;
    width: 52px; height: 52px; border-radius: 50%; padding: 13px;
    background: var(--white); color: var(--black); border: 2px solid transparent;
    transition: all 0.22s;
  }
  .tab.active { background: var(--red); color: var(--white); border-color: var(--black); }
  .icon { width: 100%; height: 100%; display: flex; }
  .icon svg { width: 100%; height: 100%; }
`;
