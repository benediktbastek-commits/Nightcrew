import { Screen } from '@/components/screen';
import { createClient } from '@/lib/supabase/server';
import { FEATURE_COLUMN, FEATURE_OPTIONS } from '@/lib/features';
import type { Profile } from '@/lib/types';
import { updateFeaturePrefs } from './actions';

export default async function DisplaySettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  const profile = (profileData ?? {}) as Partial<Profile>;

  return (
    <Screen title="ANZEIGEEINSTELLUNGEN" back="/">
      <section>
        <p className="muted" style={{ fontSize: 11 }}>
          Wähl aus, welche Funktionen du nutzen möchtest — abgewählte Module verschwinden
          aus den Tabs und dem Dashboard. Kann jederzeit wieder geändert werden.
        </p>
      </section>
      <section>
        <form action={updateFeaturePrefs} className="auth-form">
          {FEATURE_OPTIONS.map((feature) => (
            <div key={feature.key} style={{ padding: '10px 0', borderTop: '1px solid rgba(230,230,230,.08)' }}>
              <label className="form-toggle" style={{ padding: 0, border: 0 }}>
                <input
                  type="checkbox"
                  name={feature.key}
                  className="visual-checkbox"
                  defaultChecked={profile[FEATURE_COLUMN[feature.key]] !== false}
                />
                <span>{feature.label}</span>
              </label>
              <p className="muted" style={{ fontSize: 9, marginTop: 4, marginLeft: 24 }}>{feature.text}</p>
            </div>
          ))}
          <button type="submit" className="button solid-button">SPEICHERN</button>
        </form>
      </section>
    </Screen>
  );
}
