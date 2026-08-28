import { completeOnboarding } from './actions';

const ROLE_OPTIONS = [
  { value: 'dj_producer', label: 'DJ / PRODUCER', note: null },
  { value: 'photographer_videographer', label: 'FOTOGRAF / VIDEOGRAF', note: 'BALD VERFÜGBAR' },
  { value: 'manager', label: 'MANAGER', note: 'BALD VERFÜGBAR' },
];

export default function OnboardingPage() {
  return (
    <div className="stage">
      <div className="app">
        <div className="auth-screen">
          <div>
            <p className="eyebrow">WILLKOMMEN</p>
            <h1>WER BIST DU?</h1>
            <p className="muted" style={{ marginTop: 8 }}>Wähl aus, was auf dich zutrifft — du kannst das später in den Einstellungen ändern.</p>
          </div>
          <form action={completeOnboarding} className="auth-form">
            {ROLE_OPTIONS.map((role) => (
              <label className="form-toggle" key={role.value}>
                <input type="checkbox" name="roles" value={role.value} className="visual-checkbox" defaultChecked={role.value === 'dj_producer'} />
                <span>{role.label}</span>
                {role.note && <span className="due">{role.note}</span>}
              </label>
            ))}

            <div className="form-field" style={{ marginTop: 12 }}>
              <span className="label">NAME</span>
              <input className="field" name="display_name" placeholder="Wie sollen wir dich nennen?" required />
            </div>

            <div className="form-field">
              <span className="label">STATUS</span>
              <input className="field" name="status" placeholder="z.B. Techno DJ aus Köln" />
            </div>

            <button type="submit" className="button solid-button">WEITER</button>
          </form>
        </div>
      </div>
    </div>
  );
}
