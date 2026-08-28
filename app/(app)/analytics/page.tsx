import { Screen } from '@/components/screen';
import { createClient } from '@/lib/supabase/server';
import { AnalyticsScreen } from './analytics-screen';
import type { AccountMetric, Import } from '@/lib/types';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const [{ data: metricsData, error: metricsError }, { data: lastImportData }] = await Promise.all([
    supabase.from('account_metrics').select('*').order('period_start', { ascending: true }),
    supabase
      .from('imports')
      .select('*')
      .eq('kind', 'account')
      .not('confirmed_at', 'is', null)
      .order('confirmed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (metricsError) console.error('[AnalyticsPage] metrics', metricsError);

  return (
    <Screen title="ANALYTICS">
      <AnalyticsScreen metrics={(metricsData ?? []) as AccountMetric[]} lastImport={lastImportData as Import | null} />
    </Screen>
  );
}
