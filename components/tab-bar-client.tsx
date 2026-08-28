'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function TabBarClient({ tabs }: { tabs: { href: string; label: string }[] }) {
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
