import Link from 'next/link';
import { Screen } from '@/components/screen';
import { Chip } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { formatDayMonth, formatEuro } from '@/lib/format';
import { createExpense } from './actions';
import type { Expense, Invoice, InvoiceStatus } from '@/lib/types';

const STATUS_LABEL: Record<InvoiceStatus, string> = { draft: 'ENTWURF', open: 'OFFEN', paid: 'BEZAHLT', overdue: 'MAHNUNG' };
const STATUS_TONE: Record<InvoiceStatus, 'solid' | 'outline' | 'dim'> = { draft: 'dim', open: 'outline', paid: 'dim', overdue: 'solid' };

export default async function FinancePage() {
  const supabase = await createClient();
  const year = new Date().getFullYear();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const [{ data: invoicesData, error: invoicesError }, { data: expensesData, error: expensesError }] = await Promise.all([
    supabase.from('invoices').select('*').order('issued_on', { ascending: false }),
    supabase.from('expenses').select('*').order('date', { ascending: false }),
  ]);
  if (invoicesError) console.error('[FinancePage] invoices', invoicesError);
  if (expensesError) console.error('[FinancePage] expenses', expensesError);

  const invoices = (invoicesData ?? []) as Invoice[];
  const expenses = (expensesData ?? []) as Expense[];

  const paidThisYear = invoices.filter((i) => i.status === 'paid' && (i.paid_on ?? i.issued_on) >= yearStart && (i.paid_on ?? i.issued_on) <= yearEnd);
  const einnahmen = paidThisYear.reduce((sum, i) => sum + i.amount_cents, 0);
  const offen = invoices.filter((i) => i.status === 'open' || i.status === 'overdue').reduce((sum, i) => sum + i.amount_cents, 0);
  const ausgabenThisYear = expenses.filter((e) => e.date >= yearStart && e.date <= yearEnd);
  const ausgaben = ausgabenThisYear.reduce((sum, e) => sum + e.amount_cents, 0);
  const ruecklage = Math.round(Math.max(einnahmen - ausgaben, 0) * 0.3);

  const byRecipient = new Map<string, number>();
  for (const invoice of paidThisYear) {
    byRecipient.set(invoice.recipient, (byRecipient.get(invoice.recipient) ?? 0) + invoice.amount_cents);
  }
  const sources = Array.from(byRecipient.entries()).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, 5);
  const maxSource = Math.max(...sources.map((s) => s.amount), 1);

  return (
    <Screen title="FINANZEN" back="/">
      <section className="metrics-grid">
        <div className="metric"><span className="label">EINNAHMEN {year}</span><strong>{formatEuro(einnahmen)}</strong></div>
        <div className="metric"><span className="label">OFFEN</span><strong>{formatEuro(offen)}</strong></div>
        <div className="metric"><span className="label">AUSGABEN</span><strong>{formatEuro(ausgaben)}</strong></div>
        <div className="metric"><span className="label">RÜCKLAGE STEUER*</span><strong>{formatEuro(ruecklage)}</strong></div>
      </section>
      <p className="muted" style={{ fontSize: '9px' }}>* grobe Schätzung: 30 % von Einnahmen minus Ausgaben, ersetzt keine Steuerberatung.</p>

      <div>
        <div className="row section-heading"><span className="label">RECHNUNGEN</span></div>
        {invoices.length === 0 ? (
          <p className="empty-state">Noch keine Rechnungen.</p>
        ) : (
          invoices.map((invoice) => (
            <Link href={`/finance/${invoice.id}/edit`} className="invoice-row" key={invoice.id}>
              <span className="invoice-number">{invoice.number}</span>
              <div className="grow">
                <strong>{invoice.recipient}</strong>
                <span className="gig-row-time">{formatDayMonth(invoice.issued_on)}{invoice.due_on ? ` · FÄLLIG ${formatDayMonth(invoice.due_on)}` : ''}</span>
              </div>
              <div className="gig-side">
                <Chip tone={STATUS_TONE[invoice.status]}>{STATUS_LABEL[invoice.status]}</Chip>
                <span className="invoice-amount">{formatEuro(invoice.amount_cents)}</span>
              </div>
            </Link>
          ))
        )}
        <Link href="/finance/new" className="claude-link">+ RECHNUNG ANLEGEN <span>›</span></Link>
      </div>

      {sources.length > 0 && (
        <div>
          <div className="row section-heading"><span className="label">EINNAHMEN NACH QUELLE</span></div>
          {sources.map((source) => (
            <div className="platform-row" key={source.name}>
              <div className="platform-row-top">
                <span className="platform-name">{source.name.toUpperCase()}</span>
                <strong>{formatEuro(source.amount)}</strong>
              </div>
              <div className="platform-track"><i style={{ width: `${(source.amount / maxSource) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="row section-heading"><span className="label">AUSGABEN</span></div>
        {expenses.length === 0 ? (
          <p className="empty-state">Noch keine Ausgaben.</p>
        ) : (
          expenses.slice(0, 8).map((expense) => (
            <div className="expense-row" key={expense.id}>
              <span className="expense-date">{formatDayMonth(expense.date)}</span>
              <span className="grow">{expense.category}</span>
              <span className="muted">{formatEuro(expense.amount_cents)}</span>
            </div>
          ))
        )}
        <form action={createExpense} className="quick-add">
          <input className="field" name="category" placeholder="Kategorie, z.B. Equipment" required />
          <input className="field" name="amount" inputMode="decimal" placeholder="€" style={{ maxWidth: 80 }} required />
          <button type="submit" className="button">+</button>
        </form>
      </div>
    </Screen>
  );
}
