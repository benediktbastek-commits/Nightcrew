'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type TabItem = { href: string; label: string };

export function TabBarClient({ homeTab, centerTab, menuTabs }: { homeTab: TabItem; centerTab: TabItem; menuTabs: TabItem[] }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isSelected = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const menuActive = menuTabs.some((tab) => isSelected(tab.href));
  const allTabs = [homeTab, ...menuTabs, centerTab];

  return (
    <>
      {/* Volle Liste — nur auf Desktop sichtbar (Sidebar hat genug Platz). */}
      <nav className="tabs tabs-full">
        {allTabs.map((tab) => (
          <Link href={tab.href} className={isSelected(tab.href) ? 'selected' : ''} key={tab.href}>
            <i />
            {tab.label}
          </Link>
        ))}
      </nav>

      {/* Kompakt-Leiste — nur auf Handy: Home, groß & zentriert das KI-Feature, Rest im Menü. */}
      <nav className="tabs tabs-compact">
        <Link href={homeTab.href} className={isSelected(homeTab.href) ? 'selected' : ''}>
          <i />
          {homeTab.label}
        </Link>
        <Link href={centerTab.href} className="tab-center">
          {centerTab.label}
        </Link>
        <button type="button" className={menuActive ? 'selected' : ''} onClick={() => setMenuOpen(true)}>
          <i />
          MENÜ
        </button>
      </nav>

      {menuOpen && (
        <div className="sheet-backdrop" onClick={() => setMenuOpen(false)}>
          <div className="sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <h2 className="sheet-title">Menü</h2>
            <div>
              {menuTabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`menu-sheet-item${isSelected(tab.href) ? ' active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
