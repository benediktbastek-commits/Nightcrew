'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus('loading');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorMessage(error.message === 'Invalid login credentials' ? 'E-Mail oder Passwort falsch.' : error.message);
      setStatus('error');
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <div className="stage">
      <div className="app">
        <div className="auth-screen">
          <div>
            <p className="eyebrow">NIGHTCREW</p>
            <h1>ANMELDEN</h1>
          </div>
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
              placeholder="Passwort"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field"
            />
            <button type="submit" className="button solid-button" disabled={status === 'loading'}>
              {status === 'loading' ? 'PRÜFE …' : 'ANMELDEN'}
            </button>
            {status === 'error' && <p className="error-text">{errorMessage}</p>}
          </form>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <Link href="/forgot-password" className="edit-link">PASSWORT VERGESSEN?</Link>
            <Link href="/signup" className="edit-link">REGISTRIEREN</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
