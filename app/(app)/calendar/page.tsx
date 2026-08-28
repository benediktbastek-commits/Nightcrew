import { Screen } from '@/components/screen';
import { createClient } from '@/lib/supabase/server';
import { getCalendarEvents } from '@/lib/calendar';
import { CalendarScreen } from './calendar-screen';

export default async function CalendarPage() {
  const supabase = await createClient();
  const events = await getCalendarEvents(supabase);

  return (
    <Screen title="KALENDER">
      <CalendarScreen events={events} />
    </Screen>
  );
}
