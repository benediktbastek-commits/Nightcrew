'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: 'ÜBERBLICK' },
  { href: '/bookings', label: 'BOOKINGS' },
  { href: '/content', label: 'CONTENT' },
  { href: '/releases', label: 'RELEASES' },
  { href: '/analytics', label: 'ZAHLEN' },
  { href: '/claude', label: 'CLAUDE' },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="tabs">
      {tabs.map((tab) => {
        const selected = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
        return (
          <Link href={tab.href} className={selected ? 'selected' : ''} key={tab.href}>
            <i />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
