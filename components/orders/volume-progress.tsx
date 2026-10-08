import { VOLUME_MILESTONES } from "@/lib/orders";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function VolumeProgress({
  monthPacks,
  className,
}: {
  monthPacks: number;
  className?: string;
}) {
  const steps = VOLUME_MILESTONES;
  const reachedCount = steps.filter((m) => monthPacks >= m.packs).length;
  const currentIndex = reachedCount - 1;
  const next = steps.find((m) => monthPacks < m.packs);
  const packsToNext = next ? next.packs - monthPacks : 0;
  const current = currentIndex >= 0 ? steps[currentIndex] : null;

  return (
    <div className={cn("surface rounded-2xl p-5 sm:p-6", className)}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
          This calendar month
        </p>
        <p className="mt-1 font-display text-3xl text-white">
          {monthPacks} packs ordered so far
        </p>
        <p className="mt-1 text-sm text-white/65">
          {current ? (
            <>
              Eligible for{" "}
              <span className="font-semibold text-cyan">
                {current.percent}% off
              </span>{" "}
              on this order
              {next
                ? ` · ${packsToNext} more pack${packsToNext === 1 ? "" : "s"} to ${next.percent}%`
                : " · top tier unlocked"}
            </>
          ) : next ? (
            <>
              {packsToNext} more pack{packsToNext === 1 ? "" : "s"} to unlock{" "}
              {next.percent}% off
            </>
          ) : (
            "Volume discount progress"
          )}
        </p>
      </div>

      <ol className="mx-auto mt-10 flex max-w-md list-none items-start">
        {steps.map((step, index) => {
          const reached = monthPacks >= step.packs;
          const isCurrent = reached && index === currentIndex;
          const nextReached =
            index < steps.length - 1 && monthPacks >= steps[index + 1].packs;

          return (
            <li key={step.packs} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <div
                  className={cn(
                    "h-[2px] flex-1",
                    index === 0
                      ? "bg-transparent"
                      : monthPacks >= step.packs
                        ? "bg-cyan"
                        : "bg-white/20"
                  )}
                />
                <div
                  className={cn(
                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition",
                    reached
                      ? "border-cyan bg-cyan text-white"
                      : "border-white/25 bg-[#2a2a2a]",
                    isCurrent && "ring-[10px] ring-cyan/30"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  <Check
                    size={16}
                    strokeWidth={3}
                    className={cn(
                      "text-white transition-opacity",
                      reached ? "opacity-100" : "opacity-0"
                    )}
                  />
                </div>
                <div
                  className={cn(
                    "h-[2px] flex-1",
                    index === steps.length - 1
                      ? "bg-transparent"
                      : nextReached
                        ? "bg-cyan"
                        : "bg-white/20"
                  )}
                />
              </div>

              <p
                className={cn(
                  "mt-3 text-center text-sm font-semibold",
                  reached ? "text-cyan" : "text-white/40"
                )}
              >
                {step.percent}%
              </p>
              <p
                className={cn(
                  "mt-0.5 text-center text-[11px]",
                  reached ? "text-white/65" : "text-white/35"
                )}
              >
                {step.packs}+ packs
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
