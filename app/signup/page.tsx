'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      setErrorMessage('Passwort muss mindestens 8 Zeichen haben.');
      setStatus('error');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwörter stimmen nicht überein.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setErrorMessage(error.message === 'User already registered' ? 'Für diese E-Mail existiert schon ein Account.' : error.message);
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
            <h1>REGISTRIEREN</h1>
          </div>
          {status === 'sent' ? (
            <p className="muted">BESTÄTIGUNGSLINK GESENDET AN {email.toUpperCase()} — POSTFACH PRÜFEN.</p>
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
                <input
                  type="password"
                  required
                  placeholder="Passwort (mind. 8 Zeichen)"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="field"
                />
                <input
                  type="password"
                  required
                  placeholder="Passwort wiederholen"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="field"
                />
                <button type="submit" className="button solid-button" disabled={status === 'loading'}>
                  {status === 'loading' ? 'ERSTELLE …' : 'ACCOUNT ERSTELLEN'}
                </button>
                {status === 'error' && <p className="error-text">{errorMessage}</p>}
              </form>
              <Link href="/login" className="edit-link">SCHON EINEN ACCOUNT? ANMELDEN</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
