'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut } from '@/app/actions';

export function ProfileMenu({ avatarUrl, initials }: { avatarUrl: string | null; initials: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="avatar"
        title="Profil"
        onClick={() => setOpen(true)}
        style={avatarUrl ? { backgroundImage: `url(${avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        {!avatarUrl && initials}
      </button>

      {open && (
        <div className="sheet-backdrop" onClick={() => setOpen(false)}>
          <div className="sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <h2 className="sheet-title">PROFIL</h2>
            <div>
              <Link href="/settings" className="menu-sheet-item" onClick={() => setOpen(false)}>PROFIL BEARBEITEN</Link>
              <Link href="/settings/display" className="menu-sheet-item" onClick={() => setOpen(false)}>ANZEIGEEINSTELLUNGEN</Link>
            </div>
            <div style={{ borderTop: '1px solid rgba(230,230,230,.08)', margin: '10px 0' }} />
            <form action={signOut}>
              <button type="submit" className="menu-sheet-item" style={{ width: '100%', textAlign: 'left', background: 'none', border: 0, cursor: 'pointer', font: 'inherit', color: 'inherit' }}>
                ABMELDEN
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
