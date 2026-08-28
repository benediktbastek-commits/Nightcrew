import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { InvoiceForm } from '../../invoice-form';
import { updateInvoice } from '../../actions';
import type { Invoice } from '@/lib/types';

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: invoice } = await supabase.from('invoices').select('*').eq('id', params.id).single();

  if (!invoice) notFound();

  return <InvoiceForm mode="edit" invoice={invoice as Invoice} action={updateInvoice.bind(null, params.id)} />;
}
