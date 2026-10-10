"use client";

import { DownloadInvoiceButton } from "@/components/orders/download-invoice-button";
import { Button } from "@/components/ui/button";
import {
  INVOICE_LETTERHEAD,
  type InvoiceDocumentModel,
} from "@/lib/invoice";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LineDraft = {
  productId: string;
  no: number;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  pttUnit: number;
  totalPtt: number;
  amount: number;
};

type Draft = {
  billToName: string;
  billToAddress: string;
  billToPhone: string;
  shipToName: string;
  shipToAddress: string;
  shipToPhone: string;
  discountPercent: number;
  discountAmount: number;
  subtotal: number;
  ptt: number;
  totalAmount: number;
  gst: number;
  amountDue: number;
  lines: LineDraft[];
};

const fieldClass =
  "w-full rounded-sm border border-[#9aafc4] bg-white px-1.5 py-1 text-sm text-[#1c2430] outline-none [color-scheme:light] focus:border-[#1a7abf]";

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

  const view = invoice;
  const discountLabel = view.discountTier
    ? `${view.discountTier} ${view.discountPercent}%`
    : `${view.discountPercent}%`;

  function startEdit() {
    setDraft(draftFrom(invoice));
    setError("");
    setEditing(true);
  }

  function patchLine(index: number, patch: Partial<LineDraft>) {
    setDraft((current) => {
      const lines = current.lines.map((line, lineIndex) =>
        lineIndex === index ? applyLinePatch(line, patch) : line
      );
      return { ...current, lines, ...summaryFrom(lines, current.discountPercent) };
    });
  }

  function patchSummary(patch: Partial<Draft>) {
    setDraft((current) => applySummaryPatch(current, patch));
  }

  async function save() {
    if (!orderId) return;
    if (draft.lines.some((line) => !line.description.trim())) {
      setError("Each line needs a description.");
      return;
    }
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
              {(editing ? draft.lines : view.lines).map((line, index) => (
                <tr key={`${line.productId}-${index}`} className="border-b border-[#e6ebf1]">
                  <td className="px-3 py-3">
                    {editing ? (
                      <input
                        className={`${fieldClass} min-w-36`}
                        value={draft.lines[index]?.description || ""}
                        aria-label="Description"
                        onChange={(event) =>
                          patchLine(index, { description: event.target.value })
                        }
                      />
                    ) : (
                      line.description
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {editing ? (
                      <NumberField
                        value={draft.lines[index]?.no}
                        ariaLabel="Line number"
                        onChange={(no) => patchLine(index, { no })}
                      />
                    ) : (
                      line.no
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {editing ? (
                      <NumberField
                        value={draft.lines[index]?.quantity}
                        ariaLabel="Quantity"
                        onChange={(quantity) => patchLine(index, { quantity })}
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
                        ariaLabel="Unit price"
                        onChange={(unitPrice) => patchLine(index, { unitPrice })}
                      />
                    ) : (
                      formatCurrency(line.unitPrice)
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {editing ? (
                      <NumberField
                        value={draft.lines[index]?.totalPrice}
                        step="0.01"
                        ariaLabel="Total price"
                        onChange={(totalPrice) => patchLine(index, { totalPrice })}
                      />
                    ) : (
                      formatCurrency(line.totalPrice)
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {editing ? (
                      <NumberField
                        value={draft.lines[index]?.pttUnit}
                        step="0.01"
                        ariaLabel="PTT per unit"
                        onChange={(pttUnit) => patchLine(index, { pttUnit })}
                      />
                    ) : (
                      formatCurrency(line.pttUnit)
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {editing ? (
                      <NumberField
                        value={draft.lines[index]?.totalPtt}
                        step="0.01"
                        ariaLabel="Total PTT"
                        onChange={(totalPtt) => patchLine(index, { totalPtt })}
                      />
                    ) : (
                      formatCurrency(line.totalPtt)
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-medium">
                    {editing ? (
                      <div className="flex items-center justify-end gap-2">
                        <NumberField
                          value={draft.lines[index]?.amount}
                          step="0.01"
                          ariaLabel="Amount"
                          onChange={(amount) => patchLine(index, { amount })}
                        />
                        <button
                          type="button"
                          className="no-print text-xs font-semibold text-[#1a7abf]"
                          onClick={() =>
                            setDraft((current) => {
                              const lines = current.lines.filter((_, i) => i !== index);
                              return {
                                ...current,
                                lines,
                                ...summaryFrom(lines, current.discountPercent),
                              };
                            })
                          }
                          disabled={draft.lines.length <= 1}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      formatCurrency(line.amount)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {editing && (
            <button
              type="button"
              className="no-print mt-3 text-sm font-semibold text-[#1a7abf]"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  lines: [
                    ...current.lines,
                    {
                      productId: `custom-${crypto.randomUUID()}`,
                      no: current.lines.length + 1,
                      description: "",
                      quantity: 1,
                      unitPrice: 0,
                      totalPrice: 0,
                      pttUnit: 0,
                      totalPtt: 0,
                      amount: 0,
                    },
                  ],
                }))
              }
            >
              Add line
            </button>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-sm text-sm">
            {editing ? (
              <>
                <TotalField
                  label="Subtotal"
                  value={draft.subtotal}
                  onChange={(subtotal) => patchSummary({ subtotal })}
                />
                <TotalField
                  label="Discount %"
                  value={draft.discountPercent}
                  onChange={(discountPercent) => patchSummary({ discountPercent })}
                />
                <TotalField
                  label="Discount amount"
                  value={draft.discountAmount}
                  onChange={(discountAmount) => patchSummary({ discountAmount })}
                />
                <TotalField
                  label="P.T.T/ Tobacco Tax"
                  value={draft.ptt}
                  onChange={(ptt) => patchSummary({ ptt })}
                />
                <TotalField
                  label="Total Amount"
                  value={draft.totalAmount}
                  onChange={(totalAmount) => patchSummary({ totalAmount })}
                />
                <TotalField
                  label="GST (5%)"
                  value={draft.gst}
                  onChange={(gst) => patchSummary({ gst })}
                />
                <div className="mt-2 flex items-center justify-between gap-4 bg-[#163a62] px-3 py-2.5 font-semibold text-white">
                  <dt>Amount To be Paid</dt>
                  <dd>
                    <NumberField
                      value={draft.amountDue}
                      step="0.01"
                      ariaLabel="Amount to be paid"
                      light={false}
                      onChange={(amountDue) => patchSummary({ amountDue })}
                    />
                  </dd>
                </div>
              </>
            ) : (
              <>
                <Row label="Subtotal" value={formatCurrency(view.subtotal)} />
                {view.discountAmount > 0 && (
                  <Row
                    label={`Discount ${discountLabel}`}
                    value={`−${formatCurrency(view.discountAmount)}`}
                  />
                )}
                <Row label="P.T.T/ Tobacco Tax" value={formatCurrency(view.ptt)} />
                <Row label="Total Amount" value={formatCurrency(view.totalAmount)} />
                <Row label="GST (5%)" value={formatCurrency(view.gst)} />
                <div className="mt-2 flex justify-between bg-[#163a62] px-3 py-2.5 font-semibold text-white">
                  <dt>Amount To be Paid</dt>
                  <dd>{formatCurrency(view.amountDue)}</dd>
                </div>
              </>
            )}
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

function money(amount: number) {
  return Math.round((Number(amount) || 0) * 100) / 100;
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
    discountAmount: invoice.discountAmount,
    subtotal: invoice.subtotal,
    ptt: invoice.ptt,
    totalAmount: invoice.totalAmount,
    gst: invoice.gst,
    amountDue: invoice.amountDue,
    lines: invoice.lines.map((line) => ({
      productId: line.productId,
      no: line.no,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      totalPrice: line.totalPrice,
      pttUnit: line.pttUnit,
      totalPtt: line.totalPtt,
      amount: line.amount,
    })),
  };
}

function applyLinePatch(line: LineDraft, patch: Partial<LineDraft>): LineDraft {
  const next = { ...line, ...patch };
  if ("no" in patch) next.no = Math.max(1, Math.round(Number(next.no) || 1));
  if ("quantity" in patch) {
    next.quantity = Math.max(1, Math.round(Number(next.quantity) || 1));
  }
  const quantity = Number(next.quantity) || 0;
  if ("quantity" in patch || "unitPrice" in patch) {
    next.totalPrice = money(quantity * (Number(next.unitPrice) || 0));
  }
  if ("quantity" in patch || "pttUnit" in patch) {
    next.totalPtt = money(quantity * (Number(next.pttUnit) || 0));
  }
  if (
    "quantity" in patch ||
    "unitPrice" in patch ||
    "pttUnit" in patch ||
    "totalPrice" in patch ||
    "totalPtt" in patch
  ) {
    next.amount = money((Number(next.totalPrice) || 0) + (Number(next.totalPtt) || 0));
  }
  return next;
}

function summaryFrom(lines: LineDraft[], discountPercent: number) {
  const subtotal = money(lines.reduce((sum, line) => sum + (Number(line.totalPrice) || 0), 0));
  const ptt = money(lines.reduce((sum, line) => sum + (Number(line.totalPtt) || 0), 0));
  const percent = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const discountAmount = money(subtotal * (percent / 100));
  const totalAmount = money(subtotal - discountAmount + ptt);
  const gst = money(totalAmount * 0.05);
  return {
    subtotal,
    ptt,
    discountPercent: percent,
    discountAmount,
    totalAmount,
    gst,
    amountDue: money(totalAmount + gst),
  };
}

function applySummaryPatch(current: Draft, patch: Partial<Draft>): Draft {
  const next = { ...current, ...patch };
  if ("discountPercent" in patch) {
    next.discountAmount = money(
      (Number(next.subtotal) || 0) * ((Number(next.discountPercent) || 0) / 100)
    );
  }
  if (
    "subtotal" in patch ||
    "discountPercent" in patch ||
    "discountAmount" in patch ||
    "ptt" in patch
  ) {
    next.totalAmount = money(
      (Number(next.subtotal) || 0) -
        (Number(next.discountAmount) || 0) +
        (Number(next.ptt) || 0)
    );
  }
  if (
    "subtotal" in patch ||
    "discountPercent" in patch ||
    "discountAmount" in patch ||
    "ptt" in patch ||
    "totalAmount" in patch
  ) {
    next.gst = money((Number(next.totalAmount) || 0) * 0.05);
  }
  if (
    "subtotal" in patch ||
    "discountPercent" in patch ||
    "discountAmount" in patch ||
    "ptt" in patch ||
    "totalAmount" in patch ||
    "gst" in patch
  ) {
    next.amountDue = money((Number(next.totalAmount) || 0) + (Number(next.gst) || 0));
  }
  return next;
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
            className={`${fieldClass} font-semibold`}
            value={name}
            aria-label={`${title} name`}
            onChange={(event) => onChange("Name", event.target.value)}
          />
          <textarea
            className={fieldClass}
            rows={2}
            value={address}
            aria-label={`${title} address`}
            onChange={(event) => onChange("Address", event.target.value)}
          />
          <input
            className={fieldClass}
            value={phone}
            aria-label={`${title} phone`}
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
  ariaLabel,
  light = true,
  onChange,
}: {
  value: number | undefined;
  step?: string;
  ariaLabel: string;
  light?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      step={step}
      aria-label={ariaLabel}
      className={
        light
          ? `${fieldClass} w-24 text-right`
          : "w-28 rounded-sm border border-white/40 bg-white/10 px-1.5 py-1 text-right text-white outline-none [color-scheme:dark]"
      }
      value={Number.isFinite(value) ? value : 0}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
}

function TotalField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#eef2f6] px-3 py-1.5">
      <dt className="text-[#3d4a5c]">{label}</dt>
      <dd>
        <NumberField value={value} step="0.01" ariaLabel={label} onChange={onChange} />
      </dd>
    </div>
  );
}
