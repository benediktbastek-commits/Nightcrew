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
          <div className="button-row">
            <Link href="/" className="button solid-button" style={{ textAlign: 'center' }}>LOS GEHT&apos;S</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
