import type { ProfileStatus } from "@/lib/types";

export function ProfileProgress({
  percent,
  status,
  label,
  detail,
}: {
  percent: number;
  status: ProfileStatus;
  label: string;
  detail: string;
}) {
  const tone =
    status === "verified"
      ? "text-white"
      : status === "rejected" || status === "expired"
        ? "text-warn-red"
        : status === "pending"
          ? "text-warn-yellow"
          : "text-white";

  return (
    <div className="surface mt-6 rounded-2xl p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Profile completion</p>
          <p className={`mt-1 text-sm font-semibold ${tone}`}>{label}</p>
        </div>
        <p className="font-display text-3xl leading-none text-white">{percent}%</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-cyan" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-3 text-sm text-white/75">{detail}</p>
    </div>
  );
}
