import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ReleaseForm } from '../../release-form';
import { updateRelease } from '../../actions';
import type { Release } from '@/lib/types';

export default async function EditReleasePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: release } = await supabase.from('releases').select('*').eq('id', params.id).single();

  if (!release) notFound();

  return <ReleaseForm mode="edit" release={release as Release} action={updateRelease.bind(null, params.id)} />;
}
