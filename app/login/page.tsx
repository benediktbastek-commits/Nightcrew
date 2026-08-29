'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const FEATURES = [
  {
    image: '/marketing/screenshot-uberblick.png',
    title: 'ALLES AUF EINEN BLICK',
    text: 'Nächster Gig, offene Aufgaben, Release-Fortschritt — direkt auf der Startseite, ohne Suchen.',
  },
  {
    image: '/marketing/screenshot-kalender.png',
    title: 'EIN KALENDER FÜR ALLES',
    text: 'Gigs, Content-Termine, Deadlines und Rechnungen farblich sortiert an einem Ort.',
  },
  {
    image: '/marketing/screenshot-analytics.png',
    title: 'ANALYTICS OHNE ABTIPPEN',
    text: 'Screenshot rein, Zahlen raus — inklusive Trend im Vergleich zum Vormonat.',
  },
  {
    image: '/marketing/screenshot-releases.png',
    title: 'RELEASES MIT PLAN',
    text: 'Phasen, Tracks und Deadlines im Blick — vom ersten Demo bis zum Release-Tag.',
  },
];

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
        <div className="landing-screen">
          <div className="landing-hero">
            <p className="eyebrow" style={{ textAlign: 'center' }}>NIGHTCREW</p>
            <h1>Dein Business hinter den Decks — an einem Ort.</h1>
            <p>
              Für DJs, Producer und Eventfotograf:innen: Bookings, Content, Releases, Finanzen und
              Tour-Logistik planen, ohne zehn Apps und Excel-Tabellen. Plus ein Marktplatz, der dich
              mit Fotograf:innen und Videograf:innen für deinen nächsten Gig zusammenbringt.
            </p>
            <a href="#anmelden" className="button solid-button landing-cta">JETZT STARTEN</a>
          </div>

          {FEATURES.map((feature) => (
            <div className="landing-feature" key={feature.title}>
              <div className="landing-shot">
                <img src={feature.image} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
              </div>
              <h2>{feature.title}</h2>
              <p>{feature.text}</p>
            </div>
          ))}

          <div className="landing-divider" />

          <div id="anmelden" className="landing-footer">
            <div>
              <p className="eyebrow">NIGHTCREW</p>
              <h1 style={{ fontSize: 20 }}>ANMELDEN</h1>
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
            <div className="row">
              <Link href="/forgot-password" className="edit-link">PASSWORT VERGESSEN?</Link>
              <Link href="/signup" className="edit-link">REGISTRIEREN</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
