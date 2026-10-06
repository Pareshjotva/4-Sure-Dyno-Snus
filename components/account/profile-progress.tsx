export function ProfileProgress({ complete }: { complete: boolean }) {
  const percent = complete ? 100 : 70;

  return (
    <div className="surface mt-6 rounded-2xl p-5">
      <div className="flex items-end justify-between gap-3">
        <p className="text-sm font-semibold text-white">Profile complete</p>
        <p className="font-display text-3xl leading-none text-white">{percent}%</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-cyan"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-3 text-sm text-white/75">
        {complete
          ? "Your tobacco licence is on file. You will not need to enter it again."
          : "Add your tobacco licence number to finish this profile. Pricing stays open. The licence is required when you place an order."}
      </p>
    </div>
  );
}
