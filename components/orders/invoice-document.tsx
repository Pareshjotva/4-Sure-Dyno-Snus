import { DownloadInvoiceButton } from "@/components/orders/download-invoice-button";
import { INVOICE_LETTERHEAD, type InvoiceDocumentModel } from "@/lib/invoice";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export function InvoiceDocument({
  invoice,
  backHref,
  backLabel,
}: {
  invoice: InvoiceDocumentModel;
  backHref: string;
  backLabel: string;
}) {
  const discountLabel = invoice.discountTier
    ? `${invoice.discountTier} ${invoice.discountPercent}%`
    : `${invoice.discountPercent}%`;

  return (
    <div>
      <style>{`
        @media print {
          header, aside, footer, .no-print { display: none !important; }
          body { background: #fff !important; }
          .invoice-sheet, .invoice-sheet * { visibility: visible; }
          .invoice-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
            border: 0 !important;
          }
        }
        @page { size: letter; margin: 12mm; }
      `}</style>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={backHref} className="text-sm text-cyan">
          ← {backLabel}
        </Link>
        <DownloadInvoiceButton />
      </div>
      <article className="invoice-sheet overflow-hidden rounded-xl border border-black/10 bg-white text-black shadow-xl">
        <header className="flex flex-wrap items-start justify-between gap-4 bg-black px-6 py-5 text-white">
          <div>
            <Image
              src="/images/logo-4sure-white.png"
              alt="4Sure International"
              width={180}
              height={64}
              className="h-12 w-auto"
            />
            <p className="mt-3 text-sm">Address: {INVOICE_LETTERHEAD.address}</p>
            <p className="text-sm">Email: {INVOICE_LETTERHEAD.email}</p>
            <p className="text-sm">Contact: {INVOICE_LETTERHEAD.phone}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-display text-3xl tracking-wide">INVOICE</p>
            <p className="mt-2">
              Invoice# <strong>{invoice.number}</strong>
            </p>
            <p>
              Date: <strong>{invoice.dateLabel}</strong>
            </p>
            <p className="text-white/70">Order {invoice.orderNumber}</p>
          </div>
        </header>

        <div className="grid gap-6 px-6 py-5 sm:grid-cols-2">
          <Party title="Bill To" name={invoice.billToName} address={invoice.billToAddress} phone={invoice.billToPhone} />
          <Party title="Ship To" name={invoice.shipToName} address={invoice.shipToAddress} phone={invoice.shipToPhone} />
        </div>

        <div className="space-y-1 px-6 pb-4 text-xs text-black/80">
          <p>GST#: {INVOICE_LETTERHEAD.gst}</p>
          <p>Import Lic.: {INVOICE_LETTERHEAD.importLicence}</p>
          <p>Excise Duty#: {INVOICE_LETTERHEAD.exciseDuty}</p>
          {invoice.province === "AB" && (
            <p>Alberta Tax Collector I/W: {INVOICE_LETTERHEAD.albertaTaxCollector}</p>
          )}
        </div>

        <div className="overflow-x-auto px-6">
          <table className="min-w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-y border-black bg-neutral-100">
                <th className="px-2 py-2 font-semibold">Description</th>
                <th className="px-2 py-2 font-semibold">No.</th>
                <th className="px-2 py-2 font-semibold">Qty.</th>
                <th className="px-2 py-2 font-semibold">Unit Price</th>
                <th className="px-2 py-2 font-semibold">Total Price</th>
                <th className="px-2 py-2 font-semibold">PTT/Unit</th>
                <th className="px-2 py-2 font-semibold">Total PTT</th>
                <th className="px-2 py-2 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line) => (
                <tr key={`${line.no}-${line.description}`} className="border-b border-black/15">
                  <td className="px-2 py-2">{line.description}</td>
                  <td className="px-2 py-2">{line.no}</td>
                  <td className="px-2 py-2">{line.quantity}</td>
                  <td className="px-2 py-2">{formatCurrency(line.unitPrice)}</td>
                  <td className="px-2 py-2">{formatCurrency(line.totalPrice)}</td>
                  <td className="px-2 py-2">{formatCurrency(line.pttUnit)}</td>
                  <td className="px-2 py-2">{formatCurrency(line.totalPtt)}</td>
                  <td className="px-2 py-2">{formatCurrency(line.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end px-6 pb-6">
          <dl className="w-full max-w-xs space-y-1 text-sm">
            <Row label="Subtotal" value={formatCurrency(invoice.subtotal)} />
            {invoice.discountAmount > 0 && (
              <Row
                label={`Discount ${discountLabel}`}
                value={`−${formatCurrency(invoice.discountAmount)}`}
              />
            )}
            <Row label="P.T.T/ Tobacco Tax" value={formatCurrency(invoice.ptt)} />
            <Row label="Total Amount" value={formatCurrency(invoice.totalAmount)} />
            <Row label="GST (5%)" value={formatCurrency(invoice.gst)} />
            <div className="flex justify-between border-t border-black pt-2 font-semibold">
              <dt>Amount To be Paid</dt>
              <dd>{formatCurrency(invoice.amountDue)}</dd>
            </div>
          </dl>
        </div>

        <footer className="space-y-2 border-t border-black/15 px-6 py-4 text-sm">
          <p className="font-semibold">*** Payment via E-transfer ***</p>
          <p>{INVOICE_LETTERHEAD.email}</p>
          <p className="text-xs">***Notice:- {INVOICE_LETTERHEAD.notice}</p>
        </footer>
      </article>
    </div>
  );
}

function Party({
  title,
  name,
  address,
  phone,
}: {
  title: string;
  name: string;
  address: string;
  phone: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-black/60">{title}:</p>
      <p className="mt-1 font-semibold">{name}</p>
      <p className="whitespace-pre-line text-sm">{address}</p>
      {phone && <p className="text-sm">{phone}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
