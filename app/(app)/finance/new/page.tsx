import { InvoiceForm } from '../invoice-form';
import { createInvoice } from '../actions';

export default function NewInvoicePage() {
  return <InvoiceForm mode="create" action={createInvoice} />;
}
