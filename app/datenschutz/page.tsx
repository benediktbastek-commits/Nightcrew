import Link from 'next/link';

export default function DatenschutzPage() {
  return (
    <div className="stage">
      <div className="app">
        <div className="auth-screen" style={{ justifyContent: 'flex-start' }}>
          <div>
            <Link href="/login" className="edit-link">← ZURÜCK</Link>
            <p className="eyebrow" style={{ marginTop: 12 }}>RECHTLICHES</p>
            <h1>DATENSCHUTZ</h1>
          </div>
          <div className="auth-form" style={{ gap: 16, fontSize: 12, lineHeight: 1.6 }}>
            <p>
              Diese Erklärung beschreibt, welche Daten Nightcrew verarbeitet und wofür.
              Nightcrew befindet sich in einer privaten Testphase mit einem begrenzten
              Nutzer:innenkreis — es findet keine Weitergabe an Werbe- oder
              Analysedienste statt.
            </p>

            <p><span className="label">VERANTWORTLICHER</span><br />
              Benedikt Bastek, E-Mail: benedikt.bastek@gmx.de (siehe auch{' '}
              <Link href="/impressum" className="edit-link">Impressum</Link>).
            </p>

            <p><span className="label">ACCOUNT & LOGIN</span><br />
              Bei der Registrierung werden E-Mail-Adresse und Passwort gespeichert
              (Passwort verschlüsselt). Der Login läuft über unseren Datenbank- und
              Auth-Anbieter Supabase. Zum Versand von Bestätigungs- und
              Passwort-Zurücksetzen-E-Mails nutzen wir den E-Mail-Dienst Resend.
            </p>

            <p><span className="label">PROFIL & INHALTE</span><br />
              Angaben wie Name, Benutzername, Profilbild, Bio, Standort und Social-Media-Links
              sind für andere Nutzer:innen der App sichtbar, wenn du sie ausfüllst. Gigs,
              Releases, Finanzen, Kontakte und Aufgaben sind privat und nur für dich sichtbar,
              außer du teilst sie aktiv (z.B. über den Marktplatz oder eine Verbindungsanfrage).
            </p>

            <p><span className="label">KI-FUNKTIONEN (CREW AI, SCREENSHOT-IMPORT)</span><br />
              Wenn du den Crew-AI-Chat nutzt oder einen Screenshot importierst, werden die
              jeweiligen Texte bzw. Bilder zur Verarbeitung an die Anthropic-API (Claude)
              übermittelt. Es werden keine zusätzlichen Konto- oder Zugangsdaten mitgeschickt.
            </p>

            <p><span className="label">COOKIES</span><br />
              Es werden ausschließlich technisch notwendige Cookies zur Anmeldung
              (Session-Cookies von Supabase) gesetzt — keine Tracking- oder
              Werbe-Cookies.
            </p>

            <p><span className="label">HOSTING</span><br />
              Die App läuft bei Vercel (Hosting) und Supabase (Datenbank, Auth,
              Dateispeicher).
            </p>

            <p><span className="label">DEINE RECHTE</span><br />
              Du kannst deine Profildaten jederzeit selbst in den Einstellungen bearbeiten.
              Unter Einstellungen → Gefahrenzone kannst du deinen Account inklusive aller
              gespeicherten Daten jederzeit selbst und dauerhaft löschen. Für Fragen zu
              Auskunft, Berichtigung oder Löschung kannst du dich zusätzlich jederzeit per
              E-Mail an uns wenden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
