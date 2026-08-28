'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { euroToCents } from '@/lib/format';
import type { InvoiceStatus } from '@/lib/types';

function readInvoiceFields(formData: FormData) {
  return {
    number: String(formData.get('number') ?? '').trim(),
    recipient: String(formData.get('recipient') ?? '').trim(),
    amount_cents: euroToCents(String(formData.get('amount') ?? '0')),
    issued_on: String(formData.get('issued_on') ?? ''),
    due_on: String(formData.get('due_on') ?? '') || null,
    status: String(formData.get('status') ?? 'draft') as InvoiceStatus,
  };
}

export async function createInvoice(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase.from('invoices').insert({ ...readInvoiceFields(formData), user_id: user.id });
  if (error) console.error('[createInvoice]', error);

  revalidatePath('/finance');
  revalidatePath('/');
  redirect('/finance');
}

export async function updateInvoice(id: string, formData: FormData) {
  const supabase = await createClient();
  const fields = readInvoiceFields(formData);
  const { error } = await supabase
    .from('invoices')
    .update({ ...fields, paid_on: fields.status === 'paid' ? new Date().toISOString().slice(0, 10) : null })
    .eq('id', id);
  if (error) console.error('[updateInvoice]', error);

  revalidatePath('/finance');
  revalidatePath('/');
  redirect('/finance');
}

export async function createExpense(formData: FormData) {
  const category = String(formData.get('category') ?? '').trim();
  const amount = euroToCents(String(formData.get('amount') ?? '0'));
  if (!category || amount <= 0) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('expenses').insert({
    user_id: user.id,
    category,
    amount_cents: amount,
    date: new Date().toISOString().slice(0, 10),
  });
  if (error) console.error('[createExpense]', error);

  revalidatePath('/finance');
  revalidatePath('/');
}
