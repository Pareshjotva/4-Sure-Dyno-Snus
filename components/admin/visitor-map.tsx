"use client";

const PLACES: Record<string, [number, number]> = {
  Canada: [56, -106],
  "United States": [39, -98],
  Mexico: [23, -102],
  Brazil: [-10, -55],
  Argentina: [-38, -64],
  "United Kingdom": [54, -2],
  Ireland: [53, -8],
  France: [46, 2],
  Germany: [51, 10],
  Spain: [40, -4],
  Italy: [42, 12],
  Netherlands: [52, 5],
  Belgium: [50, 4],
  Sweden: [62, 15],
  Norway: [61, 8],
  Denmark: [56, 10],
  Finland: [64, 26],
  Poland: [52, 19],
  Switzerland: [47, 8],
  Austria: [47, 14],
  Portugal: [39, -8],
  India: [22, 79],
  China: [35, 104],
  Japan: [36, 138],
  Australia: [-25, 134],
  "New Zealand": [-41, 174],
  "South Africa": [-29, 24],
  "United Arab Emirates": [24, 54],
  Pakistan: [30, 69],
  Philippines: [13, 122],
  Bangladesh: [24, 90],
  "Sri Lanka": [7, 81],
  Nepal: [28, 84],
  Singapore: [1, 104],
  Malaysia: [4, 102],
  Indonesia: [-2, 118],
  Thailand: [15, 101],
  Vietnam: [16, 108],
  "South Korea": [36, 128],
  "Saudi Arabia": [24, 45],
  Qatar: [25, 51],
  Kuwait: [29, 48],
  Egypt: [26, 30],
  Nigeria: [9, 8],
  Kenya: [0, 38],
  Russia: [60, 90],
};

const ALIASES: Record<string, string> = {
  usa: "United States",
  us: "United States",
  "united states of america": "United States",
  uk: "United Kingdom",
  "great britain": "United Kingdom",
  england: "United Kingdom",
  uae: "United Arab Emirates",
  "the netherlands": "Netherlands",
  holland: "Netherlands",
  "republic of india": "India",
  "people's republic of china": "China",
  "korea, republic of": "South Korea",
  "republic of korea": "South Korea",
  "russian federation": "Russia",
};

const LAND: [number, number][][] = [
  [
    [-168, 71], [-153, 59], [-140, 60], [-130, 55], [-125, 49], [-124, 40], [-117, 32],
    [-110, 23], [-105, 21], [-97, 16], [-87, 21], [-81, 25], [-80, 31], [-76, 35],
    [-70, 42], [-67, 45], [-60, 47], [-56, 53], [-64, 60], [-78, 63], [-88, 72],
    [-100, 73], [-128, 71], [-156, 71], [-168, 71],
  ],
  [
    [-73, 78], [-62, 82], [-40, 83], [-20, 80], [-20, 70], [-44, 60], [-56, 66], [-73, 76],
  ],
  [
    [-81, 9], [-77, 8], [-71, 12], [-60, 8], [-50, 1], [-35, -5], [-35, -15], [-40, -22],
    [-48, -28], [-53, -34], [-68, -55], [-75, -52], [-74, -40], [-71, -18], [-77, -5], [-81, 2],
  ],
  [
    [-10, 36], [-9, 43], [-5, 48], [-2, 52], [2, 51], [5, 53], [8, 55], [8, 58], [5, 62],
    [12, 66], [25, 71], [30, 70], [30, 60], [24, 55], [18, 55], [12, 46], [10, 44],
    [3, 43], [-5, 36],
  ],
  [
    [-10, 52], [-8, 55], [-6, 58], [-3, 59], [0, 53], [1, 51], [-5, 50], [-5, 52],
  ],
  [
    [-17, 21], [-16, 28], [-9, 32], [-6, 36], [3, 37], [10, 37], [11, 33], [25, 32],
    [32, 31], [43, 12], [51, 12], [42, -1], [40, -15], [35, -26], [28, -33], [18, -35],
    [14, -22], [12, -6], [9, 4], [8, 13], [-5, 5], [-15, 10], [-17, 15],
  ],
  [
    [26, 36], [36, 36], [44, 40], [48, 30], [56, 27], [62, 25], [68, 24], [72, 21],
    [77, 8], [80, 10], [88, 22], [92, 22], [97, 16], [98, 8], [104, 1], [109, 1],
    [109, 14], [120, 8], [120, 22], [122, 31], [126, 35], [132, 35], [131, 43],
    [140, 46], [142, 52], [140, 60], [160, 66], [170, 68], [140, 72], [100, 76],
    [70, 72], [60, 68], [44, 68], [40, 48], [32, 45], [28, 41],
  ],
  [
    [100, 13], [104, 2], [109, 1], [120, 6], [109, 14], [105, 16], [100, 18],
  ],
  [
    [130, 32], [132, 34], [138, 35], [141, 41], [145, 43], [141, 45], [140, 41], [136, 35],
  ],
  [
    [113, -22], [124, -16], [130, -13], [136, -12], [142, -11], [146, -16], [153, -26],
    [150, -38], [140, -38], [128, -32], [115, -34], [114, -28],
  ],
  [
    [166, -46], [174, -42], [178, -37], [177, -39], [172, -41], [167, -46],
  ],
];

function project(lon: number, lat: number) {
  return { x: lon + 180, y: 90 - lat };
}

function landPath(points: [number, number][]) {
  return points
    .map(([lon, lat], index) => {
      const { x, y } = project(lon, lat);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ") + " Z";
}

function placeFor(country: string) {
  const key = country.trim().toLowerCase();
  const name = ALIASES[key] || country.trim();
  return PLACES[name] ? { name, point: PLACES[name] } : null;
}

export function VisitorMap({
  rows,
}: {
  rows: { country: string; sessions: number }[];
}) {
  const max = Math.max(1, ...rows.map((row) => row.sessions));
  const plotted = rows.flatMap((row) => {
    const place = placeFor(row.country);
    return place ? [{ ...row, ...place }] : [];
  });

  return (
    <div>
      <svg viewBox="0 0 360 180" className="h-72 w-full rounded-xl bg-[#121820]" role="img" aria-label="Approximate visitor map">
        <rect width="360" height="180" fill="#121820" />
        {[0, 60, 120, 180, 240, 300, 360].map((line) => (
          <line key={`v-${line}`} x1={line} y1="0" x2={line} y2="180" stroke="rgba(255,255,255,0.06)" />
        ))}
        {[30, 60, 90, 120, 150].map((line) => (
          <line key={`h-${line}`} x1="0" y1={line} x2="360" y2={line} stroke="rgba(255,255,255,0.06)" />
        ))}
        {LAND.map((shape, index) => (
          <path key={index} d={landPath(shape)} fill="#8d97a5" stroke="#d5dbe3" strokeWidth="0.6" />
        ))}
        {plotted.map((row) => {
          const { x, y } = project(row.point[1], row.point[0]);
          const radius = 3.5 + (row.sessions / max) * 7;
          return (
            <g key={row.country}>
              <circle cx={x} cy={y} r={radius + 2} fill="rgba(227,30,36,0.28)" />
              <circle cx={x} cy={y} r={radius} fill="#e31e24" stroke="#fff" strokeWidth="0.8">
                <title>{`${row.name}: ${row.sessions} sessions`}</title>
              </circle>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-xs text-white/50">
        Dots mark country centers from approximate IP geolocation, not GPS.
        {plotted.length === 0
          ? " No mapped country visits in this range yet. Local network visits stay in the table."
          : " Hover a dot for the session count."}
      </p>
    </div>
  );
}
