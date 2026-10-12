import { discountTierLabel } from "@/lib/site";
import type { Order } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { orderGrantedDiscount } from "@/lib/volume-discount";

export function OrderTotals({
  order,
}: {
  order: Pick<
    Order,
    | "subtotal"
    | "discountPercent"
    | "discountAmount"
    | "discountAdjustment"
    | "discountTier"
    | "monthPacksBefore"
    | "qualifyingPacks"
    | "previouslyGrantedDiscount"
    | "finalMonthlyDiscount"
    | "total"
    | "items"
  >;
}) {
  const tier = discountTierLabel(order.discountPercent, order.discountTier);
  const adjustment = Number(order.discountAdjustment) || 0;
  const thisOrderDiscount = Number(order.discountAmount) || 0;
  const granted = orderGrantedDiscount(order);
  const hasDiscount = granted > 0;
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
          packs (calendar month cumulative).
        </p>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span>Subtotal {formatCurrency(order.subtotal)}</span>
        {hasDiscount ? (
          <>
            <span className="font-semibold text-cyan">
              This order {tier ? `${tier} ` : ""}
              {order.discountPercent}% (−{formatCurrency(thisOrderDiscount)})
            </span>
            {adjustment > 0 ? (
              <span className="font-semibold text-cyan">
                Prior-order adjustment (−{formatCurrency(adjustment)})
              </span>
            ) : null}
            <span className="text-navy/70">
              Total credit {formatCurrency(granted)}
            </span>
          </>
        ) : (
          <span className="text-navy/70">Discount $0.00</span>
        )}
        <span className="font-semibold text-navy">
          Total {formatCurrency(order.total)}
        </span>
      </div>
      {typeof order.finalMonthlyDiscount === "number" &&
      order.finalMonthlyDiscount > 0 ? (
        <p className="text-xs text-navy/55">
          Month target discount {formatCurrency(order.finalMonthlyDiscount)}
          {typeof order.previouslyGrantedDiscount === "number"
            ? ` · already granted before this order ${formatCurrency(order.previouslyGrantedDiscount)}`
            : null}
          . Prior invoices are not rewritten.
        </p>
      ) : null}
    </div>
  );
}
