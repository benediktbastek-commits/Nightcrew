'use client';

import { useState } from 'react';

export function DeleteAccountButton({ action }: { action: () => void }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button type="button" className="button" onClick={() => setConfirming(true)}>
        ACCOUNT LÖSCHEN
      </button>
    );
  }

  return (
    <div className="auth-form">
      <p className="error-text">
        Das löscht deinen Account, dein Profil und alle deine Daten dauerhaft — das kann
        nicht rückgängig gemacht werden. Willst du wirklich fortfahren?
      </p>
      <div className="button-row">
        <button type="button" className="button" onClick={() => setConfirming(false)}>ABBRECHEN</button>
        <form action={action} style={{ flex: 1 }}>
          <button type="submit" className="button solid-button" style={{ width: '100%' }}>JA, ENDGÜLTIG LÖSCHEN</button>
        </form>
      </div>
    </div>
  );
}
