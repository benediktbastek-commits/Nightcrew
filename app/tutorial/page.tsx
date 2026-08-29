import Link from 'next/link';

const ITEMS = [
  { label: 'ÜBERBLICK', text: 'Nächster Gig, offene Aufgaben, Release-Fortschritt — alles auf einen Blick.' },
  { label: 'BOOKINGS', text: 'Gigs anlegen, Gagen im Blick, Advance-Infos pro Termin.' },
  { label: 'CONTENT', text: 'Posts planen, Wochenübersicht, mit Releases verknüpfen.' },
  { label: 'RELEASES', text: 'Zeitstrahl, Phasen, Tracks und Deadlines pro Release.' },
  { label: 'ANALYTICS', text: 'Screenshots importieren, Analytics ohne manuelles Abtippen.' },
  { label: 'CREW AI', text: 'KI-Planer für Content-Ideen — muss vom Entwickler freigeschaltet werden.' },
  { label: 'DASHBOARD-KACHELN', text: 'Finanzen, Tour & Logistik und Screenshot-Import erreichst du über die Kacheln im Dashboard.' },
];

const IPHONE_STEPS = [
  'Diese Seite in Safari geöffnet haben (nicht Chrome).',
  'Unten in der Leiste auf das Teilen-Symbol tippen (Viereck mit Pfeil nach oben).',
  'Nach unten scrollen und „Zum Home-Bildschirm" antippen.',
  'Oben rechts auf „Hinzufügen" tippen.',
];

const ANDROID_STEPS = [
  'Oben rechts auf die drei Punkte tippen.',
  '„App installieren" (oder „Zum Startbildschirm hinzufügen") auswählen.',
  'Mit „Installieren" bestätigen.',
];

export default function TutorialPage() {
  return (
    <div className="stage">
      <div className="app">
        <div className="auth-screen">
          <div>
            <p className="eyebrow">KURZ ERKLÄRT</p>
            <h1>SO FUNKTIONIERT'S</h1>
          </div>
          <div className="kv-list">
            {ITEMS.map((item) => (
              <div className="kv-row" key={item.label}>
                <span className="kv-key" style={{ width: 90 }}>{item.label}</span>
                <span className="kv-value">{item.text}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="eyebrow">EMPFEHLUNG</p>
            <h1 style={{ fontSize: 18 }}>ALS APP NUTZEN</h1>
            <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8 }}>
              Zum Home-Bildschirm hinzufügen, dann läuft Nightcrew im Vollbild wie eine
              echte App — ohne Adressleiste, mit eigenem Icon.
            </p>
          </div>

          <div>
            <p className="eyebrow">IPHONE · SAFARI</p>
            <div className="kv-list">
              {IPHONE_STEPS.map((step, index) => (
                <div className="kv-row" key={step}>
                  <span className="kv-key" style={{ width: 20 }}>{index + 1}.</span>
                  <span className="kv-value">{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="eyebrow">ANDROID · CHROME</p>
            <div className="kv-list">
              {ANDROID_STEPS.map((step, index) => (
                <div className="kv-row" key={step}>
                  <span className="kv-key" style={{ width: 20 }}>{index + 1}.</span>
                  <span className="kv-value">{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="button-row">
            <Link href="/" className="button solid-button" style={{ textAlign: 'center' }}>LOS GEHT&apos;S</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
