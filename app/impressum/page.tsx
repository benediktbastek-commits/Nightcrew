import Link from 'next/link';

export default function ImpressumPage() {
  return (
    <div className="stage">
      <div className="app">
        <div className="auth-screen" style={{ justifyContent: 'flex-start' }}>
          <div>
            <Link href="/login" className="edit-link">← ZURÜCK</Link>
            <p className="eyebrow" style={{ marginTop: 12 }}>RECHTLICHES</p>
            <h1>IMPRESSUM</h1>
          </div>
          <div className="auth-form" style={{ gap: 16, fontSize: 12, lineHeight: 1.6 }}>
            <p>
              Nightcrew befindet sich aktuell in einer privaten Test- und Entwicklungsphase
              und wird ausschließlich im nicht-kommerziellen, privaten Rahmen mit einem
              begrenzten Kreis an Nutzer:innen (Freund:innen und Bekannte zum Testen)
              betrieben.
            </p>
            <p>
              Ein vollständiges Impressum gemäß §5 TMG wird nachgereicht, sobald die App
              über den privaten Gebrauch hinaus (z.B. öffentlich oder kommerziell)
              angeboten wird.
            </p>
            <p>
              <span className="label">KONTAKT</span><br />
              Benedikt Bastek<br />
              E-Mail: benedikt.bastek@gmx.de
            </p>
            <p>
              <Link href="/datenschutz" className="edit-link">ZUR DATENSCHUTZERKLÄRUNG</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
