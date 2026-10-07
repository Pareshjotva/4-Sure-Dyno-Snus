import { discountTierLabel } from "@/lib/site";
import type { Order } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function OrderTotals({
  order,
}: {
  order: Pick<
    Order,
    | "subtotal"
    | "discountPercent"
    | "discountAmount"
    | "discountTier"
    | "monthPacksBefore"
    | "qualifyingPacks"
    | "total"
    | "items"
  >;
}) {
  const tier = discountTierLabel(order.discountPercent, order.discountTier);
  const hasDiscount = order.discountPercent > 0 && order.discountAmount > 0;
  const thisOrderPacks = (order.items || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );
  const showRunningTotal = typeof order.monthPacksBefore === "number";

  return (
    <div className="mt-3 space-y-1 text-sm">
      {showRunningTotal && (
        <p className="text-navy/70">
          Earlier this month {order.monthPacksBefore} packs + this order{" "}
          {thisOrderPacks} packs = {order.qualifyingPacks ?? thisOrderPacks}{" "}
          packs. Discount is on this order.
        </p>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
      <span>Subtotal {formatCurrency(order.subtotal)}</span>
      <span className={hasDiscount ? "font-semibold text-cyan" : "text-navy/70"}>
        {hasDiscount
          ? `Discount ${tier} ${order.discountPercent}% (−${formatCurrency(order.discountAmount)})`
          : "Discount $0.00 — 40 packs this month for 5% off"}
      </span>
      <span className="font-semibold text-navy">
        Total {formatCurrency(order.total)}
      </span>
      </div>
    </div>
  );
}
