import { Screen } from '@/components/screen';
import { Chip } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { isOwnerEmail } from '@/lib/owner';
import { hasRole } from '@/lib/roles';
import { signOut } from '@/app/actions';
import { SettingsForm } from './settings-form';
import { createAccessCode, redeemAccessCode, revokeAccessCode, submitFeedback, toggleContentModule, updatePhotographerDetails } from './actions';
import type { AccessCode, Profile } from '@/lib/types';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const isOwner = isOwnerEmail(user.email);
  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  const profile = (profileData ?? { id: user.id, display_name: null, avatar_url: null, status: null, roles: [], ai_unlocked: false, skills: [], portfolio: [], onboarded_at: null, wants_content: false, bio: null, city: null, socials: null, username: null }) as Profile;

  const { data: codesData } = isOwner
    ? await supabase.from('access_codes').select('*').eq('created_by', user.id).order('created_at', { ascending: false })
    : { data: null };
  const codes = (codesData ?? []) as AccessCode[];

  return (
    <Screen title="EINSTELLUNGEN" back="/">
      <section>
        <div className="row section-heading"><span className="label">PROFIL</span></div>
        <SettingsForm profile={profile} userId={user.id} />
      </section>

      <section className="panel">
        <div className="row section-heading"><span className="label">KI-FUNKTIONEN (CLAUDE, SCREENSHOT-IMPORT)</span></div>
        {isOwner || profile.ai_unlocked ? (
          <p className="muted">✓ Freigeschaltet{isOwner ? ' (Eigentümer)' : ''}.</p>
        ) : (
          <form action={redeemAccessCode} className="quick-add">
            <input className="field" name="code" placeholder="Zugangscode eingeben" required />
            <button type="submit" className="button">✓</button>
          </form>
        )}
      </section>

      {hasRole(profile.roles, 'photographer_videographer') && (
        <section className="panel">
          <div className="row section-heading"><span className="label">ZUSÄTZLICHE FUNKTIONEN</span></div>
          <form action={toggleContentModule} className="auth-form">
            <label className="form-toggle">
              <input type="checkbox" name="wants_content" defaultChecked={profile.wants_content} className="visual-checkbox" />
              <span>Content-Planung nutzen (Posts planen, Wochenübersicht — wie bei DJs)</span>
            </label>
            <button type="submit" className="button">SPEICHERN</button>
          </form>
        </section>
      )}

      {hasRole(profile.roles, 'photographer_videographer') && (
        <section>
          <div className="row section-heading"><span className="label">SKILLS & REFERENZEN</span></div>
          <form action={updatePhotographerDetails} className="auth-form">
            <div className="form-field">
              <span className="label">SKILLS (KOMMAGETRENNT)</span>
              <input className="field" name="skills" defaultValue={profile.skills?.join(', ') ?? ''} placeholder="z.B. Konzertfotografie, Drohne, Schnitt" />
            </div>
            <div className="form-field">
              <span className="label">REFERENZEN (EINE PRO ZEILE: TITEL | LINK)</span>
              <textarea
                className="field"
                name="portfolio"
                placeholder={'z.B.\nClub Nacht Reel | https://instagram.com/…'}
                defaultValue={(profile.portfolio ?? []).map((item) => `${item.title} | ${item.url}`).join('\n')}
              />
            </div>
            <button type="submit" className="button">SPEICHERN</button>
          </form>
        </section>
      )}

      {isOwner && (
        <section>
          <div className="row section-heading"><span className="label">ZUGANGSCODES VERWALTEN</span><span className="muted">{codes.length}</span></div>
          {codes.length === 0 ? (
            <p className="empty-state">Noch keine Codes erstellt.</p>
          ) : (
            codes.map((code) => (
              <div className="platform-row" key={code.id}>
                <div className="platform-row-top">
                  <span className="platform-name bright">{code.code}</span>
                  <Chip tone={code.revoked ? 'dim' : code.redeemed_by ? 'solid' : 'outline'}>
                    {code.revoked ? 'WIDERRUFEN' : code.redeemed_by ? 'EINGELÖST' : 'OFFEN'}
                  </Chip>
                </div>
                {code.label && <span className="muted">{code.label}</span>}
                {!code.revoked && !code.redeemed_by && (
                  <form action={revokeAccessCode.bind(null, code.id)}>
                    <button type="submit" className="edit-link">WIDERRUFEN</button>
                  </form>
                )}
              </div>
            ))
          )}
          <form action={createAccessCode} className="quick-add">
            <input className="field" name="label" placeholder="Für wen? (optional)" />
            <button type="submit" className="button">+</button>
          </form>
        </section>
      )}

      <section>
        <div className="row section-heading"><span className="label">FEEDBACK AN DEN ENTWICKLER</span></div>
        <form action={submitFeedback} className="auth-form">
          <textarea className="field" name="message" placeholder="Idee, Wunsch oder Bug beschreiben …" required />
          <button type="submit" className="button">SENDEN</button>
        </form>
      </section>

      <form action={signOut}>
        <button type="submit" className="button">ABMELDEN</button>
      </form>
    </Screen>
  );
}
