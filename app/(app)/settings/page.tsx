import { Screen } from '@/components/screen';
import { createClient } from '@/lib/supabase/server';
import { isOwnerEmail } from '@/lib/owner';
import { hasRole } from '@/lib/roles';
import { signOut } from '@/app/actions';
import { SettingsForm } from './settings-form';
import {
  grantAiAccessByEmail,
  revokeAiAccessById,
  submitFeedback,
  toggleContentModule,
  updatePhotographerDetails,
} from './actions';
import type { Profile } from '@/lib/types';

const AI_ERROR_MESSAGE: Record<string, string> = {
  missing_email: 'Bitte eine E-Mail-Adresse eingeben.',
  user_not_found: 'Kein Account mit dieser E-Mail gefunden — die Person muss sich zuerst registrieren.',
  failed: 'Freischalten fehlgeschlagen.',
};

export default async function SettingsPage({ searchParams }: { searchParams: { ai_error?: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const isOwner = isOwnerEmail(user.email);
  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  const profile = (profileData ?? { id: user.id, display_name: null, avatar_url: null, status: null, roles: [], ai_unlocked: false, skills: [], portfolio: [], onboarded_at: null, wants_content: false, bio: null, city: null, socials: null, username: null }) as Profile;

  const { data: unlockedData } = isOwner
    ? await supabase.from('profiles').select('id, display_name, username').eq('ai_unlocked', true).neq('id', user.id)
    : { data: null };
  const unlockedProfiles = (unlockedData ?? []) as Pick<Profile, 'id' | 'display_name' | 'username'>[];

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
          <p className="muted">Noch nicht freigeschaltet — frag den Entwickler, dich per E-Mail freizuschalten.</p>
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
          <div className="row section-heading"><span className="label">KI-ZUGANG PER E-MAIL</span><span className="muted">{unlockedProfiles.length}</span></div>
          {unlockedProfiles.length === 0 ? (
            <p className="empty-state">Noch niemand direkt freigeschaltet.</p>
          ) : (
            unlockedProfiles.map((p) => (
              <div className="platform-row" key={p.id}>
                <div className="platform-row-top">
                  <span className="platform-name">{p.display_name ?? (p.username ? `@${p.username}` : 'Unbekannt')}</span>
                  <form action={revokeAiAccessById.bind(null, p.id)}>
                    <button type="submit" className="edit-link">ENTZIEHEN</button>
                  </form>
                </div>
              </div>
            ))
          )}
          <form action={grantAiAccessByEmail} className="quick-add">
            <input className="field" type="email" name="email" placeholder="freund@email.de" required />
            <button type="submit" className="button">FREISCHALTEN</button>
          </form>
          {searchParams.ai_error && <p className="error-text">{AI_ERROR_MESSAGE[searchParams.ai_error] ?? 'Etwas ist schiefgelaufen.'}</p>}
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
