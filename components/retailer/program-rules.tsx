import { VOLUME_MILESTONES } from "@/lib/orders";
import type { IncentiveTier } from "@/lib/types";

function packRangeLabel(minPacks: number, maxPacks: number | null) {
  return maxPacks == null ? `${minPacks}+ packs` : `${minPacks}–${maxPacks} packs`;
}

export function ProgramRules({ tiers }: { tiers: IncentiveTier[] }) {
  const sorted = [...tiers].sort((a, b) => a.minPacks - b.minPacks);
  const display =
    sorted.length > 0
      ? sorted
      : VOLUME_MILESTONES.map((m, i) => ({
          id: `fallback_${i}`,
          name: `${m.label} · ${m.name}`,
          minPacks: m.packs,
          maxPacks: m.maxPacks,
          discountPercent: m.percent,
          savePerPack: m.percent === 5 ? 2 : m.percent === 10 ? 4 : 6,
        }));

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        {display.map((tier) => (
          <article
            key={tier.id}
            className="rounded-2xl border border-cyan/35 bg-black/55 p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
              {tier.discountPercent}% off
            </p>
            <h3 className="mt-2 font-display text-2xl text-white">
              {tier.name}
            </h3>
            <p className="mt-2 text-sm text-white/70">
              {packRangeLabel(tier.minPacks, tier.maxPacks)} in a calendar month
            </p>
            {tier.savePerPack > 0 ? (
              <p className="mt-3 text-sm font-semibold text-warn-red">
                Save ${tier.savePerPack.toFixed(2)} / 50 g pack
              </p>
            ) : null}
          </article>
        ))}
      </div>

      <div className="surface rounded-2xl p-6">
        <h2 className="font-display text-2xl text-white">Program rules</h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/80">
          {display.map((tier) => (
            <li key={`rule_${tier.id}`}>
              <strong className="text-white">
                {tier.name} · {tier.discountPercent}%:
              </strong>{" "}
              {packRangeLabel(tier.minPacks, tier.maxPacks)}
            </li>
          ))}
          <li>
            Qualify by accumulating packs across the calendar month{" "}
            <strong className="text-white">or</strong> by ordering the full
            volume in a single order.
          </li>
          <li>
            The volume count resets at the start of each calendar month — packs
            do not carry forward.
          </li>
          <li>
            The unlocked discount applies to{" "}
            <strong className="text-white">this order only</strong> (based on
            earlier packs this month plus packs on the new order). Earlier
            invoices keep the discount they already received.
          </li>
        </ul>
      </div>
    </div>
  );
}
