'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus('loading');
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    if (error) {
      setErrorMessage(error.message);
      setStatus('error');
      return;
    }
    setStatus('sent');
  }

  return (
    <div className="stage">
      <div className="app">
        <div className="auth-screen">
          <div>
            <p className="eyebrow">NIGHTCREW</p>
            <h1>PASSWORT VERGESSEN</h1>
            <p className="muted" style={{ marginTop: 8 }}>Wir schicken dir einen Link, mit dem du ein neues Passwort setzen kannst.</p>
          </div>
          {status === 'sent' ? (
            <p className="muted">LINK GESENDET AN {email.toUpperCase()} — POSTFACH PRÜFEN.</p>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="auth-form">
                <input
                  type="email"
                  required
                  placeholder="name@domain.de"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="field"
                />
                <button type="submit" className="button solid-button" disabled={status === 'loading'}>
                  {status === 'loading' ? 'SENDE …' : 'LINK SENDEN'}
                </button>
                {status === 'error' && <p className="error-text">{errorMessage}</p>}
              </form>
              <Link href="/login" className="edit-link">ZURÜCK ZUM LOGIN</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
