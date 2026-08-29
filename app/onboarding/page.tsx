import { createClient } from '@/lib/supabase/server';
import { OnboardingForm } from './onboarding-form';
import type { Profile } from '@/lib/types';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profileData } = user
    ? await supabase.from('profiles').select('roles, display_name, status, username').eq('id', user.id).maybeSingle()
    : { data: null };
  const profile = profileData as Pick<Profile, 'roles' | 'display_name' | 'status' | 'username'> | null;

  return (
    <div className="stage">
      <div className="app">
        <div className="auth-screen">
          <div>
            <p className="eyebrow">WILLKOMMEN</p>
            <h1>WER BIST DU?</h1>
            <p className="muted" style={{ marginTop: 8 }}>Wähl aus, was auf dich zutrifft — du kannst das später in den Einstellungen ändern.</p>
          </div>
          <OnboardingForm
            defaultRoles={profile?.roles ?? ['dj_producer']}
            defaultDisplayName={profile?.display_name ?? ''}
            defaultStatus={profile?.status ?? ''}
            defaultUsername={profile?.username ?? ''}
          />
        </div>
      </div>
    </div>
  );
}
