"use client";

import { VOLUME_MILESTONES } from "@/lib/orders";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

/** Line fill 0–100 between equally spaced milestone nodes. */
function lineFillPercent(totalPacks: number) {
  const steps = VOLUME_MILESTONES;
  const n = steps.length;
  if (totalPacks <= 0) return 0;
  if (totalPacks >= steps[n - 1].packs) return 100;

  // Before first milestone: keep line empty until 5% node unlocks
  if (totalPacks < steps[0].packs) return 0;

  for (let i = 0; i < n - 1; i++) {
    const a = steps[i].packs;
    const b = steps[i + 1].packs;
    const segStart = (i / (n - 1)) * 100;
    const segEnd = ((i + 1) / (n - 1)) * 100;

    if (totalPacks >= b) continue;
    if (totalPacks <= a) return segStart;
    const t = (totalPacks - a) / (b - a);
    return segStart + t * (segEnd - segStart);
  }

  return 100;
}

export function VolumeProgress({
  monthPacks,
  thisOrderPacks = 0,
  className,
}: {
  monthPacks: number;
  thisOrderPacks?: number;
  className?: string;
}) {
  const earlier = Math.max(0, monthPacks);
  const currentOrder = Math.max(0, thisOrderPacks);
  const combined = earlier + currentOrder;
  const fillPct = lineFillPercent(combined);
  const current = [...VOLUME_MILESTONES]
    .reverse()
    .find((m) => combined >= m.packs);
  const next = VOLUME_MILESTONES.find((m) => combined < m.packs);
  const packsToNext = next ? next.packs - combined : 0;

  return (
    <div className={cn("surface rounded-2xl p-5 sm:p-6", className)}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
          This calendar month
        </p>
        <p className="mt-1 font-display text-3xl text-white sm:text-4xl">
          {combined} packs
        </p>
        <p className="mt-1 text-sm text-white/65">
          Earlier this month {earlier} · this order {currentOrder} · counted
          together {combined}
        </p>
        <p className="mt-1 text-sm text-white/65">
          {current
            ? `Eligible now: ${current.percent}% off`
            : "Not eligible for a volume discount yet"}
          {next
            ? ` · ${packsToNext} more pack${packsToNext === 1 ? "" : "s"} to unlock ${next.percent}%`
            : " · Top tier unlocked"}
        </p>
      </div>

      {/* Reference-style stepper: check circles on one horizontal line */}
      <div className="relative mx-auto mt-10 max-w-lg px-1">
        <div className="absolute left-[16.5%] right-[16.5%] top-5 h-[3px] bg-[#3a3a3a] sm:top-6" />
        <div
          className="absolute left-[16.5%] top-5 h-[3px] bg-[#3b82f6] transition-[width] duration-500 sm:top-6"
          style={{
            width: `calc((100% - 33%) * ${fillPct / 100})`,
          }}
        />

        <ol className="relative z-10 grid grid-cols-3">
          {VOLUME_MILESTONES.map((milestone) => {
            const reached = combined >= milestone.packs;
            return (
              <li key={milestone.packs} className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-[2.5px] transition sm:h-12 sm:w-12",
                    reached
                      ? "border-[#3b82f6] bg-[#3b82f6] text-white shadow-[0_0_0_8px_rgba(59,130,246,0.2)]"
                      : "border-[#5a5a5a] bg-[#2a2a2a] text-[#6b6b6b]"
                  )}
                >
                  <Check
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    strokeWidth={reached ? 2.8 : 2.2}
                  />
                </span>
                <p
                  className={cn(
                    "mt-3 text-sm font-semibold tracking-wide sm:text-base",
                    reached ? "text-[#60a5fa]" : "text-[#7a7a7a]"
                  )}
                >
                  {milestone.percent}%
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-center text-[11px] leading-snug sm:text-xs",
                    reached ? "text-white/75" : "text-[#5f5f5f]"
                  )}
                >
                  {milestone.packs}+ packs
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
