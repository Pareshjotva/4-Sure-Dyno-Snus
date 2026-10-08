"use client";

import { DownloadInvoiceButton } from "@/components/orders/download-invoice-button";
import { Button } from "@/components/ui/button";
import {
  INVOICE_LETTERHEAD,
  priceInvoice,
  type InvoiceDocumentModel,
} from "@/lib/invoice";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Draft = {
  billToName: string;
  billToAddress: string;
  billToPhone: string;
  shipToName: string;
  shipToAddress: string;
  shipToPhone: string;
  discountPercent: number;
  lines: {
    productId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    pttUnit: number;
  }[];
};

export function InvoiceDocument({
  invoice,
  orderId,
  canEdit = false,
  backHref,
  backLabel,
}: {
  invoice: InvoiceDocumentModel;
  orderId?: string;
  canEdit?: boolean;
  backHref: string;
  backLabel: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => draftFrom(invoice));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const view = editing ? pricedDraft(invoice, draft) : invoice;
  const discountLabel = view.discountTier
    ? `${view.discountTier} ${view.discountPercent}%`
    : `${view.discountPercent}%`;

  function startEdit() {
    setDraft(draftFrom(invoice));
    setError("");
    setEditing(true);
  }

  async function save() {
    if (!orderId) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoice: draft }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not save the invoice. Check the amounts and try again.");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  return (
    <div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          html, body { background: #fff !important; }
          .panel-shell,
          div.mx-auto.grid {
            display: block !important;
            max-width: none !important;
            width: 100% !important;
            padding: 0 !important;
            gap: 0 !important;
          }
          .invoice-sheet {
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .invoice-sheet, .invoice-sheet * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .invoice-head {
            display: flex !important;
            flex-wrap: nowrap !important;
            align-items: flex-start !important;
            justify-content: space-between !important;
          }
          .invoice-parties {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
          }
          .invoice-table-wrap { overflow: visible !important; }
          .invoice-table { width: 100% !important; font-size: 10px; }
          .invoice-table th, .invoice-table td { padding: 4px 5px !important; }
        }
        @page { size: letter; margin: 10mm; }
      `}</style>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={backHref} className="text-sm text-cyan">
          ← {backLabel}
        </Link>
        <div className="flex flex-wrap gap-2">
          {canEdit && !editing && (
            <Button type="button" variant="outline" onClick={startEdit}>
              Edit invoice
            </Button>
          )}
          {editing && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setError("");
                }}
              >
                Cancel
              </Button>
              <Button type="button" onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save invoice"}
              </Button>
            </>
          )}
          {!editing && <DownloadInvoiceButton />}
        </div>
      </div>
      {error && (
        <p className="no-print mb-3 text-sm text-warn-red" role="alert">
          {error}
        </p>
      )}
      <article className="invoice-sheet bg-white px-6 py-7 text-[#1c2430] shadow-xl sm:px-8">
        <div className="invoice-head flex flex-wrap items-start justify-between gap-6 border-b-2 border-[#163a62] pb-5">
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
              <Meta label="Invoice#" value={view.number} />
              <Meta label="Date" value={view.dateLabel} />
              <Meta label="Order" value={view.orderNumber} />
            </dl>
          </div>
        </div>

        <div className="invoice-parties mt-6 grid gap-4 sm:grid-cols-2">
          <Party
            title="Bill To"
            name={editing ? draft.billToName : view.billToName}
            address={editing ? draft.billToAddress : view.billToAddress}
            phone={editing ? draft.billToPhone : view.billToPhone}
            editing={editing}
            onChange={(field, value) =>
              setDraft((current) => ({
                ...current,
                [`billTo${field}`]: value,
              }))
            }
          />
          <Party
            title="Ship To"
            name={editing ? draft.shipToName : view.shipToName}
            address={editing ? draft.shipToAddress : view.shipToAddress}
            phone={editing ? draft.shipToPhone : view.shipToPhone}
            editing={editing}
            onChange={(field, value) =>
              setDraft((current) => ({
                ...current,
                [`shipTo${field}`]: value,
              }))
            }
          />
        </div>

        <p className="mt-5 text-xs leading-5 text-[#5c6b7d]">
          GST# {INVOICE_LETTERHEAD.gst}
          <span className="px-2 text-[#c5ced8]">|</span>
          Import Lic. {INVOICE_LETTERHEAD.importLicence}
          <span className="px-2 text-[#c5ced8]">|</span>
          Excise Duty# {INVOICE_LETTERHEAD.exciseDuty}
          {view.province === "AB" && (
            <>
              <span className="px-2 text-[#c5ced8]">|</span>
              Alberta Tax Collector I/W {INVOICE_LETTERHEAD.albertaTaxCollector}
            </>
          )}
        </p>

        <div className="invoice-table-wrap mt-5 overflow-x-auto">
          <table className="invoice-table min-w-full border-collapse text-left text-sm">
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
              {view.lines.map((line, index) => (
                <tr key={line.productId || line.no} className="border-b border-[#e6ebf1]">
                  <td className="px-3 py-3">
                    {editing ? (
                      <input
                        className="w-full min-w-36 border border-[#c5ced8] px-2 py-1"
                        value={draft.lines[index]?.description || ""}
                        onChange={(event) =>
                          updateLine(setDraft, index, {
                            description: event.target.value,
                          })
                        }
                      />
                    ) : (
                      line.description
                    )}
                  </td>
                  <td className="px-3 py-3">{line.no}</td>
                  <td className="px-3 py-3 text-right">
                    {editing ? (
                      <NumberField
                        value={draft.lines[index]?.quantity}
                        onChange={(quantity) => updateLine(setDraft, index, { quantity })}
                      />
                    ) : (
                      line.quantity
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {editing ? (
                      <NumberField
                        value={draft.lines[index]?.unitPrice}
                        step="0.01"
                        onChange={(unitPrice) =>
                          updateLine(setDraft, index, { unitPrice })
                        }
                      />
                    ) : (
                      formatCurrency(line.unitPrice)
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">{formatCurrency(line.totalPrice)}</td>
                  <td className="px-3 py-3 text-right">
                    {editing ? (
                      <NumberField
                        value={draft.lines[index]?.pttUnit}
                        step="0.01"
                        onChange={(pttUnit) => updateLine(setDraft, index, { pttUnit })}
                      />
                    ) : (
                      formatCurrency(line.pttUnit)
                    )}
                  </td>
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
            <Row label="Subtotal" value={formatCurrency(view.subtotal)} />
            {(view.discountAmount > 0 || editing) && (
              <div className="flex items-center justify-between gap-6 border-b border-[#eef2f6] px-3 py-1.5">
                <dt className="text-[#3d4a5c]">
                  {editing ? "Discount %" : `Discount ${discountLabel}`}
                </dt>
                <dd className="font-medium">
                  {editing ? (
                    <NumberField
                      value={draft.discountPercent}
                      step="0.01"
                      onChange={(discountPercent) =>
                        setDraft((current) => ({ ...current, discountPercent }))
                      }
                    />
                  ) : (
                    `−${formatCurrency(view.discountAmount)}`
                  )}
                </dd>
              </div>
            )}
            <Row label="P.T.T/ Tobacco Tax" value={formatCurrency(view.ptt)} />
            <Row label="Total Amount" value={formatCurrency(view.totalAmount)} />
            <Row label="GST (5%)" value={formatCurrency(view.gst)} />
            <div className="mt-2 flex justify-between bg-[#163a62] px-3 py-2.5 font-semibold text-white">
              <dt>Amount To be Paid</dt>
              <dd>{formatCurrency(view.amountDue)}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-8 border-t border-[#e6ebf1] pt-4 text-sm">
          <p className="font-semibold text-[#163a62]">Payment via E-transfer</p>
          <p className="mt-1">{INVOICE_LETTERHEAD.email}</p>
          <p className="mt-3 text-xs leading-5 text-[#5c6b7d]">
            Notice: {INVOICE_LETTERHEAD.notice}
          </p>
        </div>
      </article>
    </div>
  );
}

function draftFrom(invoice: InvoiceDocumentModel): Draft {
  return {
    billToName: invoice.billToName,
    billToAddress: invoice.billToAddress,
    billToPhone: invoice.billToPhone,
    shipToName: invoice.shipToName,
    shipToAddress: invoice.shipToAddress,
    shipToPhone: invoice.shipToPhone,
    discountPercent: invoice.discountPercent,
    lines: invoice.lines.map((line) => ({
      productId: line.productId,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      pttUnit: line.pttUnit,
    })),
  };
}

function pricedDraft(invoice: InvoiceDocumentModel, draft: Draft): InvoiceDocumentModel {
  const priced = priceInvoice(draft.lines, draft.discountPercent);
  const tier =
    priced.discountPercent === invoice.discountPercent ? invoice.discountTier : "";
  return {
    ...invoice,
    billToName: draft.billToName,
    billToAddress: draft.billToAddress,
    billToPhone: draft.billToPhone,
    shipToName: draft.shipToName,
    shipToAddress: draft.shipToAddress,
    shipToPhone: draft.shipToPhone,
    lines: priced.lines,
    subtotal: priced.subtotal,
    discountPercent: priced.discountPercent,
    discountAmount: priced.discountAmount,
    discountTier: tier,
    ptt: priced.ptt,
    totalAmount: priced.totalAmount,
    gst: priced.gst,
    amountDue: priced.amountDue,
  };
}

function updateLine(
  setDraft: (updater: (current: Draft) => Draft) => void,
  index: number,
  patch: Partial<Draft["lines"][number]>
) {
  setDraft((current) => ({
    ...current,
    lines: current.lines.map((line, lineIndex) =>
      lineIndex === index ? { ...line, ...patch } : line
    ),
  }));
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 sm:justify-end">
      <dt className="text-[#5c6b7d]">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function Party({
  title,
  name,
  address,
  phone,
  editing,
  onChange,
}: {
  title: string;
  name: string;
  address: string;
  phone: string;
  editing: boolean;
  onChange: (field: "Name" | "Address" | "Phone", value: string) => void;
}) {
  return (
    <div className="border-l-4 border-[#1a7abf] bg-[#f4f7fb] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1a7abf]">
        {title}
      </p>
      {editing ? (
        <div className="mt-2 space-y-2">
          <input
            className="w-full border border-[#c5ced8] bg-white px-2 py-1 text-sm font-semibold"
            value={name}
            onChange={(event) => onChange("Name", event.target.value)}
          />
          <textarea
            className="w-full border border-[#c5ced8] bg-white px-2 py-1 text-sm"
            rows={2}
            value={address}
            onChange={(event) => onChange("Address", event.target.value)}
          />
          <input
            className="w-full border border-[#c5ced8] bg-white px-2 py-1 text-sm"
            value={phone}
            onChange={(event) => onChange("Phone", event.target.value)}
          />
        </div>
      ) : (
        <>
          <p className="mt-1 font-semibold text-[#163a62]">{name}</p>
          <p className="whitespace-pre-line text-sm text-[#3d4a5c]">{address}</p>
          {phone && <p className="text-sm text-[#3d4a5c]">{phone}</p>}
        </>
      )}
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

function NumberField({
  value,
  step = "1",
  onChange,
}: {
  value: number | undefined;
  step?: string;
  onChange: (value: number) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      step={step}
      className="w-24 border border-[#c5ced8] bg-white px-2 py-1 text-right"
      value={Number.isFinite(value) ? value : 0}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
}
