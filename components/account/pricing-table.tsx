import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product, ProvincePricing, SiteContent } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

const provinces = [
  { code: "BC", label: "British Columbia" },
  { code: "AB", label: "Alberta" },
  { code: "ON", label: "Ontario" },
];

export function PricingTable({
  code,
  pricing,
  products,
  site,
  basePath,
}: {
  code: string;
  pricing: ProvincePricing[];
  products: Product[];
  site: SiteContent;
  basePath: string;
}) {
  const productName = (id: string) =>
    products.find((p) => p.id === id)?.name ?? id;

  return (
    <div>
      <Badge>Retailer panel</Badge>
      <h1 className="mt-3 font-display text-4xl text-navy sm:text-5xl">
        Pricing
      </h1>
      <p className="mt-3 max-w-2xl text-slate-ink">
        SKU pricing for licensed adult tobacco retailers. Provincial tobacco
        tax (PTT), case packs, and MSRP ranges are shown as a planning guide —
        confirm final figures with {site.companyName} before ordering.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {provinces.map((p) => (
          <Link key={p.code} href={`${basePath}?province=${p.code}`}>
            <Button
              variant={code === p.code ? "secondary" : "outline"}
              size="sm"
            >
              {p.label}
            </Button>
          </Link>
        ))}
      </div>

      <div className="surface mt-8 overflow-x-auto rounded-2xl">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-cyan text-white">
            <tr>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Pack qty</th>
              <th className="px-4 py-3 font-semibold">Case</th>
              <th className="px-4 py-3 font-semibold">Pack price</th>
              <th className="px-4 py-3 font-semibold">{code} PTT</th>
              <th className="px-4 py-3 font-semibold">MSRP range</th>
              <th className="px-4 py-3 font-semibold">Margin</th>
            </tr>
          </thead>
          <tbody>
            {pricing.map((row) => (
              <tr key={row.id} className="border-t border-navy/8">
                <td className="px-4 py-3 font-medium text-navy">
                  {productName(row.productId)}
                </td>
                <td className="px-4 py-3 text-slate-ink">{row.packQty}</td>
                <td className="px-4 py-3 text-slate-ink">{row.casePack}</td>
                <td className="px-4 py-3 text-navy">
                  {formatCurrency(row.wholesale)}
                </td>
                <td className="px-4 py-3 text-navy">
                  {formatCurrency(row.ptt)}
                </td>
                <td className="px-4 py-3 text-slate-ink">
                  {formatCurrency(row.msrpMin)} – {formatCurrency(row.msrpMax)}
                </td>
                <td className="px-4 py-3 text-slate-ink">
                  {row.marginMin}% – {row.marginMax}%
                </td>
              </tr>
            ))}
            {pricing.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-slate-ink"
                >
                  No pricing rows for this province yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="surface rounded-xl p-5">
          <h2 className="font-display text-xl text-navy">Minimum order</h2>
          <p className="mt-2 text-sm text-slate-ink">
            {site.minOrderPacks}× 50 g soft-pack pouches qualifies for free
            shipping.
          </p>
        </div>
        <div className="surface rounded-xl p-5">
          <h2 className="font-display text-xl text-navy">Taxes & freight</h2>
          <p className="mt-2 text-sm text-slate-ink">
            Prices exclude applicable provincial sales tax. Orders under the
            minimum incur standard shipping.
          </p>
        </div>
        <div className="surface rounded-xl p-5">
          <h2 className="font-display text-xl text-navy">Confidential</h2>
          <p className="mt-2 text-sm text-slate-ink">
            Intended strictly for signed-in retailer accounts. Availability and
            pricing may change.
          </p>
        </div>
      </div>
    </div>
  );
}
