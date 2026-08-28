import Link from 'next/link';
import { Screen } from '@/components/screen';
import { hasAiAccess } from '@/lib/ai-access';
import { ClaudeChat } from './claude-chat';

export default async function ClaudePage() {
  const unlocked = await hasAiAccess();

  return (
    <Screen title="CLAUDE">
      {unlocked ? (
        <ClaudeChat />
      ) : (
        <>
          <p className="empty-state">Diese Funktion braucht einen Zugangscode.</p>
          <Link href="/settings" className="claude-link">ZUGANGSCODE EINGEBEN <span>›</span></Link>
        </>
      )}
    </Screen>
  );
}
