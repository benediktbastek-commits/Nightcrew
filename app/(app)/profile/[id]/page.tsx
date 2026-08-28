import { notFound } from 'next/navigation';
import { Screen } from '@/components/screen';
import { Chip } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import type { Profile, Role } from '@/lib/types';

const ROLE_LABEL: Record<Role, string> = {
  dj_producer: 'DJ / PRODUCER',
  photographer_videographer: 'FOTOGRAF / VIDEOGRAF',
  manager: 'MANAGER',
};

const SOCIAL_LABEL: Record<string, string> = {
  instagram: 'INSTAGRAM',
  tiktok: 'TIKTOK',
  youtube: 'YOUTUBE',
  spotify: 'SPOTIFY',
  website: 'WEBSITE',
};

function socialUrl(key: string, rawValue: string) {
  const value = rawValue.trim().replace(/^@/, '');
  if (/^https?:\/\//i.test(value)) return value;
  switch (key) {
    case 'instagram': return `https://instagram.com/${value}`;
    case 'tiktok': return `https://tiktok.com/@${value}`;
    case 'youtube': return `https://youtube.com/@${value}`;
    case 'spotify': return `https://open.spotify.com/search/${encodeURIComponent(value)}`;
    default: return `https://${value}`;
  }
}

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', params.id).maybeSingle();
  if (!profileData) notFound();
  const profile = profileData as Profile;
  const socials = Object.entries(profile.socials ?? {}).filter((entry): entry is [string, string] => !!entry[1]);

  return (
    <Screen title={profile.display_name ?? 'PROFIL'} back="/marketplace">
      <div className="row" style={{ alignItems: 'center', gap: 14 }}>
        <div
          className="avatar"
          style={{ width: 56, height: 56, fontSize: 16, backgroundImage: profile.avatar_url ? `url(${profile.avatar_url})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          {!profile.avatar_url && (profile.display_name?.slice(0, 2).toUpperCase() ?? '··')}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>{profile.display_name ?? 'Unbekannt'}</h2>
          {profile.status && <p className="muted" style={{ marginTop: 4 }}>{profile.status}</p>}
        </div>
      </div>

      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        {(profile.roles ?? []).map((role) => <Chip key={role} tone="outline">{ROLE_LABEL[role] ?? role}</Chip>)}
        {profile.city && <Chip tone="dim">{profile.city}</Chip>}
      </div>

      {profile.bio && (
        <section className="panel">
          <p className="muted" style={{ whiteSpace: 'pre-wrap' }}>{profile.bio}</p>
        </section>
      )}

      {socials.length > 0 && (
        <section>
          <div className="row section-heading"><span className="label">SOCIALS</span></div>
          {socials.map(([key, value]) => (
            <a key={key} href={socialUrl(key, value)} target="_blank" rel="noreferrer" className="claude-link">
              <span>{SOCIAL_LABEL[key] ?? key.toUpperCase()}</span><span>›</span>
            </a>
          ))}
        </section>
      )}

      {(profile.skills ?? []).length > 0 && (
        <section>
          <div className="row section-heading"><span className="label">SKILLS</span></div>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            {profile.skills.map((skill) => <Chip key={skill} tone="outline">{skill}</Chip>)}
          </div>
        </section>
      )}

      {(profile.portfolio ?? []).length > 0 && (
        <section>
          <div className="row section-heading"><span className="label">REFERENZEN</span></div>
          {profile.portfolio.map((item, i) => (
            <a key={i} href={item.url} target="_blank" rel="noreferrer" className="claude-link">
              <span>{item.title}</span><span>›</span>
            </a>
          ))}
        </section>
      )}
    </Screen>
  );
}
