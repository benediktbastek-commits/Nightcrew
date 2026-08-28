'use client';

import Link from 'next/link';
import { signOut } from '@/app/actions';

function Header({ title, back }: { title: string; back?: string }) {
  return (
    <header className="header">
      {back && <Link href={back} className="back-button">←</Link>}
      <div>
        <p className="eyebrow">FR · 28 AUG 2026</p>
        <h1>{title}</h1>
      </div>
      <form action={signOut}>
        <button type="submit" className="avatar" title="Abmelden">BB</button>
      </form>
    </header>
  );
}

export function Screen({ title, back, children }: { title: string; back?: string; children: React.ReactNode }) {
  return (
    <>
      <Header title={title} back={back} />
      <main className="content">{children}</main>
    </>
  );
}
