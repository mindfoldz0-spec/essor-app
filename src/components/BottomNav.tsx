"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styled from "styled-components";
import { useLanguage } from "@/lib/languageContext";
import { useStoredRole, useUserProfile } from "@/lib/userProfile";

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
    { href: "/", label: t.nav.home, icon: <svg viewBox="0 0 104 100" fill="none"><path d="M100.5 40.75V96.5H66V68.5V65H62.5H43H39.5V68.5V96.5H3.5V40.75L52 4.375L100.5 40.75Z" stroke="currentColor" strokeWidth={7} strokeLinejoin="round"/></svg> },
    isBuyer
      ? { href: "/search", label: t.nav.search, icon: <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth={1.8}/><path d="M15.5 15.5L19 19" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"/></svg> }
      : { href: "/orders", label: t.nav.orders, icon: <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth={1.8}/><path d="M3 7l3-3h12l3 3" stroke="currentColor" strokeWidth={1.8}/></svg> },
    { href: "/profile", label: t.nav.profile, icon: <svg viewBox="0 0 104 100" fill="none"><rect x="21.5" y="3.5" width={60} height={60} rx={30} stroke="currentColor" strokeWidth={7}/></svg> },
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
