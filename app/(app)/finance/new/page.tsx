import { Screen } from '@/components/screen';
import { InvoiceForm } from '../invoice-form';
import { createInvoice } from '../actions';

export default function NewInvoicePage() {
  return (
    <Screen title="NEUE RECHNUNG" back="/finance">
      <InvoiceForm mode="create" action={createInvoice} />
    </Screen>
  );
}
