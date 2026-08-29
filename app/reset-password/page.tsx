'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
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
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setErrorMessage(error.message);
      setStatus('error');
      return;
    }
    setStatus('done');
    setTimeout(() => {
      router.push('/');
      router.refresh();
    }, 1200);
  }

  return (
    <div className="stage">
      <div className="app">
        <div className="auth-screen">
          <div>
            <p className="eyebrow">NIGHTCREW</p>
            <h1>NEUES PASSWORT</h1>
          </div>
          {status === 'done' ? (
            <p className="muted">GESPEICHERT — WEITER ZUR ÜBERSICHT …</p>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <input
                type="password"
                required
                placeholder="Neues Passwort (mind. 8 Zeichen)"
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
                {status === 'loading' ? 'SPEICHERE …' : 'PASSWORT SPEICHERN'}
              </button>
              {status === 'error' && <p className="error-text">{errorMessage}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
