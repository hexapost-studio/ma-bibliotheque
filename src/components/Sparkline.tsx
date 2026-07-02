interface Props {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

/** Mini graphe SVG déterministe (pas de dépendance, pas d'état). */
export default function Sparkline({ data, width = 120, height = 34, color = "#b5623c" }: Props) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 3;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * w;
    const y = pad + h - ((v - min) / span) * h;
    return [x, y] as const;
  });
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L${pts[pts.length - 1][0].toFixed(1)},${height - pad} L${pad},${height - pad} Z`;
  const last = pts[pts.length - 1];
  const down = data[data.length - 1] <= data[0];
  const trend = down ? "#5a7052" : "#a2503c";
  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      <path d={area} fill={color} opacity={0.1} />
      <path d={path} fill="none" stroke={trend} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={2.6} fill={trend} />
    </svg>
  );
}
