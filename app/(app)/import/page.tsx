import Link from 'next/link';
import { Screen } from '@/components/screen';
import { createClient } from '@/lib/supabase/server';
import { hasAiAccess } from '@/lib/ai-access';
import { ImportFlow } from './import-flow';
import type { Post } from '@/lib/types';

export default async function ImportPage() {
  const unlocked = await hasAiAccess();
  const supabase = await createClient();
  const { data: postsData } = unlocked
    ? await supabase.from('posts').select('*').order('planned_at', { ascending: false }).limit(30)
    : { data: null };
  const posts = (postsData ?? []) as Post[];

  return (
    <Screen title="SCREENSHOT-IMPORT" back="/">
      {unlocked ? (
        <ImportFlow posts={posts} />
      ) : (
        <>
          <p className="empty-state">Diese Funktion braucht einen Zugangscode.</p>
          <Link href="/settings" className="claude-link">ZUGANGSCODE EINGEBEN <span>›</span></Link>
        </>
      )}
    </Screen>
  );
}
