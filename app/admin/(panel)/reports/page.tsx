import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { requireSession } from "@/lib/auth";
import { getOrders } from "@/lib/db";
import {
  buildSalesReport,
  currentMonthValue,
  currentYearValue,
  parseMonthValue,
  parseYearValue,
  resolveCustomRange,
  type ReportMode,
  type SalesReport,
} from "@/lib/sales-report";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const modes: { id: ReportMode; label: string }[] = [
  { id: "overall", label: "Overall" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
  { id: "custom", label: "Custom" },
];

function modeFromParam(value: string | undefined): ReportMode {
  if (value === "overall" || value === "yearly" || value === "custom") return value;
  return "monthly";
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    mode?: string;
    month?: string;
    year?: string;
    start?: string;
    end?: string;
  }>;
}) {
  const session = await requireSession("admin");
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const mode = modeFromParam(params.mode);
  const now = new Date();
  const monthlyRange = parseMonthValue(params.month || "", now);
  const yearlyRange = parseYearValue(params.year || "", now);
  const monthInput = currentMonthValue(monthlyRange.start);
  const yearInput = currentYearValue(yearlyRange.start);
  const startInput = params.start || "";
  const endInput = params.end || "";
  const custom =
    mode === "custom" ? resolveCustomRange(startInput, endInput) : null;

  const range =
    mode === "overall"
      ? null
      : mode === "monthly"
        ? monthlyRange
        : mode === "yearly"
          ? yearlyRange
          : custom?.range || null;

  let report: SalesReport | null = null;
  if (mode === "overall" || range) {
    const orders = await getOrders();
    report = buildSalesReport(orders, range);
  }

  const yearOptions = yearChoices(now.getFullYear(), yearInput);

  return (
    <div>
      <h1 className="font-display text-3xl text-white">Sales reports</h1>
      <p className="mt-2 text-sm text-slate-ink">
        Wholesale orders, packs, discounts, and totals. Cancelled orders are
        left out of revenue.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {modes.map((item) => (
          <Link
            key={item.id}
            href={modeHref(item.id, monthInput, yearInput, startInput, endInput)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-semibold transition",
              mode === item.id
                ? "bg-cyan text-white"
                : "surface text-white/70 hover:text-white"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <form
        key={`${mode}:${monthInput}:${yearInput}:${startInput}:${endInput}`}
        method="get"
        action="/admin/reports"
        className="surface mt-4 rounded-2xl p-4"
      >
        <input type="hidden" name="mode" value={mode} />
        {mode === "overall" && (
          <p className="text-sm text-white/75">
            Overall report covers every order, with a customer-wise total and
            the orders placed.
          </p>
        )}
        {mode === "monthly" && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1">
              <label
                htmlFor="month"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/70"
              >
                Month
              </label>
              <Input id="month" name="month" type="month" defaultValue={monthInput} required />
            </div>
            <Button type="submit">Show report</Button>
          </div>
        )}
        {mode === "yearly" && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-40 flex-1">
              <label
                htmlFor="year"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/70"
              >
                Year
              </label>
              <Select id="year" name="year" defaultValue={yearInput}>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit">Show report</Button>
          </div>
        )}
        {mode === "custom" && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-44 flex-1">
              <label
                htmlFor="start"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/70"
              >
                Start date
              </label>
              <Input
                id="start"
                name="start"
                type="date"
                defaultValue={startInput}
                required
              />
              <FieldError message={custom?.startError} />
            </div>
            <div className="min-w-44 flex-1">
              <label
                htmlFor="end"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/70"
              >
                End date
              </label>
              <Input id="end" name="end" type="date" defaultValue={endInput} required />
              <FieldError message={custom?.endError} />
            </div>
            <Button type="submit">Show report</Button>
          </div>
        )}
      </form>

      {mode === "custom" && !report && !custom?.startError && !custom?.endError && (
        <p className="surface mt-6 rounded-2xl p-6 text-sm text-white/75">
          Choose a start date and an end date to run a custom report.
        </p>
      )}

      {report && <ReportBody report={report} />}
    </div>
  );
}

function ReportBody({ report }: { report: SalesReport }) {
  const empty = report.orderCount === 0 && report.cancelledCount === 0;
  const cards = [
    { label: "Orders", value: String(report.orderCount) },
    { label: "Cancelled", value: String(report.cancelledCount) },
    { label: "Packs", value: String(report.packCount) },
    { label: "Subtotal", value: formatCurrency(report.subtotal) },
    { label: "Discount", value: formatCurrency(report.discountAmount) },
    { label: "Total", value: formatCurrency(report.total) },
  ];

  return (
    <div className="mt-6">
      <h2 className="font-display text-2xl text-white">{report.label}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="surface rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-cyan">{card.label}</p>
            <p className="mt-1 font-display text-3xl text-navy">{card.value}</p>
          </div>
        ))}
      </div>

      {empty && (
        <p className="surface mt-6 rounded-2xl p-6 text-sm text-white/75">
          No orders in this period.
        </p>
      )}

      {!empty && report.orderCount === 0 && (
        <p className="surface mt-6 rounded-2xl p-6 text-sm text-white/75">
          No sales in this period. {report.cancelledCount} cancelled{" "}
          {report.cancelledCount === 1 ? "order is" : "orders are"} excluded
          from totals.
        </p>
      )}

      {report.orderCount > 0 && (
        <div className="mt-8 grid gap-6">
          <section>
            <h3 className="font-display text-2xl text-white">By product</h3>
            <p className="mt-1 text-xs text-white/50">
              Pack counts and line subtotals before the order discount.
            </p>
            <div className="mt-3 overflow-x-auto surface rounded-2xl">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-black/50 text-white/70">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Product</th>
                    <th className="px-4 py-3 font-semibold">Packs</th>
                    <th className="px-4 py-3 font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {report.byProduct.map((row) => (
                    <tr key={row.productId} className="border-t border-white/8">
                      <td className="px-4 py-3 font-medium text-white">
                        {row.productName}
                      </td>
                      <td className="px-4 py-3 text-white/75">{row.packs}</td>
                      <td className="px-4 py-3 text-white">
                        {formatCurrency(row.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="font-display text-2xl text-white">By province</h3>
            <div className="mt-3 overflow-x-auto surface rounded-2xl">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-black/50 text-white/70">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Province</th>
                    <th className="px-4 py-3 font-semibold">Orders</th>
                    <th className="px-4 py-3 font-semibold">Packs</th>
                    <th className="px-4 py-3 font-semibold">Subtotal</th>
                    <th className="px-4 py-3 font-semibold">Discount</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.byProvince.map((row) => (
                    <tr key={row.province} className="border-t border-white/8">
                      <td className="px-4 py-3 font-medium text-white">
                        {row.province}
                      </td>
                      <td className="px-4 py-3 text-white/75">{row.orders}</td>
                      <td className="px-4 py-3 text-white/75">{row.packs}</td>
                      <td className="px-4 py-3 text-white">
                        {formatCurrency(row.subtotal)}
                      </td>
                      <td className="px-4 py-3 text-white/75">
                        {formatCurrency(row.discountAmount)}
                      </td>
                      <td className="px-4 py-3 text-white">
                        {formatCurrency(row.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {report.byCustomer.length > 0 && (
        <section className="mt-8">
          <h3 className="font-display text-2xl text-white">By customer</h3>
          <p className="mt-1 text-xs text-white/50">
            Overall customer report for this period. Money totals leave out
            cancelled orders.
          </p>
          <div className="mt-3 overflow-x-auto surface rounded-2xl">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-black/50 text-white/70">
                <tr>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Orders</th>
                  <th className="px-4 py-3 font-semibold">Packs</th>
                  <th className="px-4 py-3 font-semibold">Subtotal</th>
                  <th className="px-4 py-3 font-semibold">Discount</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {report.byCustomer.map((row) => (
                  <tr key={row.key} className="border-t border-white/8">
                    <td className="px-4 py-3 font-medium text-white">
                      {row.customer}
                    </td>
                    <td className="px-4 py-3 text-white/75">{row.company}</td>
                    <td className="px-4 py-3 text-white/75">{row.orders}</td>
                    <td className="px-4 py-3 text-white/75">{row.packs}</td>
                    <td className="px-4 py-3 text-white">
                      {formatCurrency(row.subtotal)}
                    </td>
                    <td className="px-4 py-3 text-white/75">
                      {formatCurrency(row.discountAmount)}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {formatCurrency(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {report.orders.length > 0 && (
        <section className="mt-8">
          <h3 className="font-display text-2xl text-white">Orders</h3>
          <p className="mt-1 text-xs text-white/50">
            Every order in this report, including cancelled orders.
          </p>
          <div className="mt-3 overflow-x-auto surface rounded-2xl">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-black/50 text-white/70">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Items</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Discount</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {report.orders.map((order) => (
                  <tr key={order.id} className="border-t border-white/8">
                    <td className="px-4 py-3 text-white/75">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-white">{order.customer}</td>
                    <td className="px-4 py-3 text-white/75">{order.company}</td>
                    <td className="px-4 py-3 text-white/75">{order.summary}</td>
                    <td className="px-4 py-3 capitalize text-white/75">
                      {order.status}
                    </td>
                    <td className="px-4 py-3 text-white/75">
                      {order.discountPercent > 0
                        ? `${order.discountTier ? `${order.discountTier} ` : ""}${order.discountPercent}% (−${formatCurrency(order.discountAmount)})`
                        : formatCurrency(0)}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {formatCurrency(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function modeHref(
  mode: ReportMode,
  month: string,
  year: string,
  start: string,
  end: string
) {
  const query = new URLSearchParams({ mode });
  if (mode === "overall") return `/admin/reports?${query.toString()}`;
  if (mode === "monthly") query.set("month", month);
  if (mode === "yearly") query.set("year", year);
  if (mode === "custom") {
    if (start) query.set("start", start);
    if (end) query.set("end", end);
  }
  return `/admin/reports?${query.toString()}`;
}

function yearChoices(currentYear: number, selected: string) {
  const years = new Set<string>();
  for (let year = currentYear; year >= currentYear - 6; year -= 1) {
    years.add(String(year));
  }
  if (/^\d{4}$/.test(selected)) years.add(selected);
  return [...years].sort((a, b) => Number(b) - Number(a));
}
