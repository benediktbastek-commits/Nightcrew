'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus('sending');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setErrorMessage(error.message);
      setStatus('error');
    } else {
      setStatus('sent');
    }
  }

  return (
    <div className="stage">
      <div className="app">
        <div className="auth-screen">
          <div>
            <p className="eyebrow">DJ COCKPIT</p>
            <h1>ANMELDEN</h1>
          </div>
          {status === 'sent' ? (
            <p className="muted">LINK GESENDET AN {email.toUpperCase()} — POSTFACH PRÜFEN.</p>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <input
                type="email"
                required
                placeholder="name@domain.de"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="field"
              />
              <button type="submit" className="button solid-button" disabled={status === 'sending'}>
                {status === 'sending' ? 'SENDE …' : 'MAGIC LINK SENDEN'}
              </button>
              {status === 'error' && <p className="error-text">FEHLER: {errorMessage}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
