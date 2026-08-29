import Link from 'next/link';
import { Screen } from '@/components/screen';
import { hasAiAccess } from '@/lib/ai-access';
import { CrewAiChat } from './crew-ai-chat';

export default async function CrewAiPage() {
  const unlocked = await hasAiAccess();

  return (
    <Screen title="CREW AI">
      {unlocked ? (
        <CrewAiChat />
      ) : (
        <>
          <p className="empty-state">Diese Funktion muss freigeschaltet werden.</p>
          <Link href="/settings" className="claude-link">MEHR IN DEN EINSTELLUNGEN <span>›</span></Link>
        </>
      )}
    </Screen>
  );
}
