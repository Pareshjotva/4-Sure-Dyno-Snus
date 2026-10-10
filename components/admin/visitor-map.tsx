"use client";

const PLACES: Record<string, [number, number]> = {
  Canada: [56, -106],
  "United States": [39, -98],
  Mexico: [23, -102],
  Brazil: [-10, -55],
  "United Kingdom": [54, -2],
  Ireland: [53, -8],
  France: [46, 2],
  Germany: [51, 10],
  Spain: [40, -4],
  Italy: [42, 12],
  Netherlands: [52, 5],
  Sweden: [62, 15],
  Norway: [61, 8],
  India: [22, 79],
  China: [35, 104],
  Japan: [36, 138],
  Australia: [-25, 134],
  "New Zealand": [-41, 174],
  "South Africa": [-29, 24],
  "United Arab Emirates": [24, 54],
  Pakistan: [30, 69],
  Philippines: [13, 122],
};

export function VisitorMap({
  rows,
}: {
  rows: { country: string; sessions: number }[];
}) {
  const max = Math.max(1, ...rows.map((row) => row.sessions));
  const plotted = rows.filter((row) => PLACES[row.country]);
  return (
    <div>
      <svg viewBox="0 0 360 180" className="h-64 w-full rounded-xl bg-black" role="img" aria-label="Approximate visitor map">
        <rect width="360" height="180" fill="#070707" />
        {[0, 45, 90, 135, 180].map((line) => (
          <line key={`v-${line}`} x1={line * 2} y1="0" x2={line * 2} y2="180" stroke="rgba(255,255,255,0.16)" />
        ))}
        {[0, 45, 90, 135, 180].map((line) => (
          <line key={`h-${line}`} x1="0" y1={line} x2="360" y2={line} stroke="rgba(255,255,255,0.16)" />
        ))}
        {plotted.map((row) => {
          const [lat, lon] = PLACES[row.country];
          const radius = 3 + (row.sessions / max) * 10;
          return (
            <circle
              key={row.country}
              cx={lon + 180}
              cy={90 - lat}
              r={radius}
              fill="rgba(227,30,36,0.85)"
            >
              <title>{`${row.country}: ${row.sessions} sessions`}</title>
            </circle>
          );
        })}
      </svg>
      <p className="mt-2 text-xs text-white/50">
        Dots use country centers from approximate IP geolocation, not GPS. Hover a dot for the count.
        {plotted.length === 0 && rows.length > 0
          ? " Locations without a mapped country center, including local network visits, stay in the table."
          : ""}
      </p>
    </div>
  );
}
