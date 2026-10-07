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
      <article className="invoice-sheet bg-white px-6 py-7 text-[#1c2430] shadow-xl sm:px-8">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-[#163a62] pb-5">
          <div className="min-w-[240px] flex-1">
            <Image
              src="/images/logo-4sure-original.png"
              alt="4Sure International — From Global to Local"
              width={1024}
              height={371}
              className="h-24 w-auto max-w-full"
              priority
            />
            <div className="mt-4 space-y-0.5 text-sm text-[#3d4a5c]">
              <p>{INVOICE_LETTERHEAD.address}</p>
              <p>{INVOICE_LETTERHEAD.email}</p>
              <p>{INVOICE_LETTERHEAD.phone}</p>
            </div>
          </div>
          <div className="min-w-[180px] text-left sm:text-right">
            <p className="text-3xl font-semibold tracking-[0.14em] text-[#163a62]">
              INVOICE
            </p>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between gap-6 sm:justify-end">
                <dt className="text-[#5c6b7d]">Invoice#</dt>
                <dd className="font-semibold">{invoice.number}</dd>
              </div>
              <div className="flex justify-between gap-6 sm:justify-end">
                <dt className="text-[#5c6b7d]">Date</dt>
                <dd className="font-semibold">{invoice.dateLabel}</dd>
              </div>
              <div className="flex justify-between gap-6 sm:justify-end">
                <dt className="text-[#5c6b7d]">Order</dt>
                <dd className="font-semibold">{invoice.orderNumber}</dd>
              </div>
            </dl>
          </div>
        </header>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Party
            title="Bill To"
            name={invoice.billToName}
            address={invoice.billToAddress}
            phone={invoice.billToPhone}
          />
          <Party
            title="Ship To"
            name={invoice.shipToName}
            address={invoice.shipToAddress}
            phone={invoice.shipToPhone}
          />
        </div>

        <p className="mt-5 text-xs leading-5 text-[#5c6b7d]">
          GST# {INVOICE_LETTERHEAD.gst}
          <span className="px-2 text-[#c5ced8]">|</span>
          Import Lic. {INVOICE_LETTERHEAD.importLicence}
          <span className="px-2 text-[#c5ced8]">|</span>
          Excise Duty# {INVOICE_LETTERHEAD.exciseDuty}
          {invoice.province === "AB" && (
            <>
              <span className="px-2 text-[#c5ced8]">|</span>
              Alberta Tax Collector I/W {INVOICE_LETTERHEAD.albertaTaxCollector}
            </>
          )}
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#163a62] text-white">
                <th className="px-3 py-2.5 font-medium">Description</th>
                <th className="px-3 py-2.5 font-medium">No.</th>
                <th className="px-3 py-2.5 text-right font-medium">Qty.</th>
                <th className="px-3 py-2.5 text-right font-medium">Unit Price</th>
                <th className="px-3 py-2.5 text-right font-medium">Total Price</th>
                <th className="px-3 py-2.5 text-right font-medium">PTT/Unit</th>
                <th className="px-3 py-2.5 text-right font-medium">Total PTT</th>
                <th className="px-3 py-2.5 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line) => (
                <tr key={`${line.no}-${line.description}`} className="border-b border-[#e6ebf1]">
                  <td className="px-3 py-3">{line.description}</td>
                  <td className="px-3 py-3">{line.no}</td>
                  <td className="px-3 py-3 text-right">{line.quantity}</td>
                  <td className="px-3 py-3 text-right">{formatCurrency(line.unitPrice)}</td>
                  <td className="px-3 py-3 text-right">{formatCurrency(line.totalPrice)}</td>
                  <td className="px-3 py-3 text-right">{formatCurrency(line.pttUnit)}</td>
                  <td className="px-3 py-3 text-right">{formatCurrency(line.totalPtt)}</td>
                  <td className="px-3 py-3 text-right font-medium">
                    {formatCurrency(line.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-sm text-sm">
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
            <div className="mt-2 flex justify-between bg-[#163a62] px-3 py-2.5 font-semibold text-white">
              <dt>Amount To be Paid</dt>
              <dd>{formatCurrency(invoice.amountDue)}</dd>
            </div>
          </dl>
        </div>

        <footer className="mt-8 border-t border-[#e6ebf1] pt-4 text-sm">
          <p className="font-semibold text-[#163a62]">Payment via E-transfer</p>
          <p className="mt-1">{INVOICE_LETTERHEAD.email}</p>
          <p className="mt-3 text-xs leading-5 text-[#5c6b7d]">
            Notice: {INVOICE_LETTERHEAD.notice}
          </p>
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
    <div className="border-l-4 border-[#1a7abf] bg-[#f4f7fb] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1a7abf]">
        {title}
      </p>
      <p className="mt-1 font-semibold text-[#163a62]">{name}</p>
      <p className="whitespace-pre-line text-sm text-[#3d4a5c]">{address}</p>
      {phone && <p className="text-sm text-[#3d4a5c]">{phone}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 border-b border-[#eef2f6] px-3 py-1.5">
      <dt className="text-[#3d4a5c]">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
