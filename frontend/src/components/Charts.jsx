import React from 'react';
import { motion } from 'framer-motion';

export const Spark = ({ pts, color, w = 100, h = 32 }) => {
  const min = Math.min(...pts), max = Math.max(...pts), rng = max - min || 1;
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
  const ys = pts.map(p => h - 3 - ((p - min) / rng) * (h - 6));
  const line = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ');
  const area = line + ` L${w},${h} L0,${h} Z`;
  const id = `sp${color.replace('#', '')}`;
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity=".28" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient></defs>
      <path d={area} fill={`url(#${id})`} />
      <motion.path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="3" fill={color} />
    </svg>
  );
};

export const LineChart = ({ series, h = 120, labels }) => {
  const all = series.flatMap(s => s.data);
  const min = Math.min(...all), max = Math.max(...all), rng = max - min || 1;
  const len = series[0].data.length;
  const W = 500;
  const toX = (i) => (i / (len - 1)) * (W - 10) + 5;
  const toY = (v) => h - 6 - ((v - min) / rng) * (h - 14);
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${W} ${h}`} style={{ display: 'block' }}>
      <defs>{series.filter(s => s.fill).map((s, i) =>
        <linearGradient key={i} id={`lc${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={s.color} stopOpacity=".2" />
          <stop offset="100%" stopColor={s.color} stopOpacity="0" />
        </linearGradient>)}
      </defs>
      {series.map((s, si) => {
        const pts = s.data.map((v, i) => ({ x: toX(i), y: toY(v) }));
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
        const area = d + ` L${pts[pts.length - 1].x},${h} L${pts[0].x},${h} Z`;
        return (
          <g key={si}>
            {s.fill && <path d={area} fill={`url(#lc${si})`} />}
            <motion.path d={d} fill="none" stroke={s.color} strokeWidth="2.2" strokeLinecap="round"
              strokeDasharray={s.dash ? '6,4' : undefined}
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: si * .15 }} />
          </g>
        );
      })}
      {labels && labels.map((l, i) => {
        if (i % Math.ceil(len / 7) !== 0) return null;
        return <text key={i} x={toX(i)} y={h} textAnchor="middle" fontSize="9" fill="rgba(150,170,210,0.45)">{l}</text>;
      })}
    </svg>
  );
};

export const BarChart = ({ data, colors, labels, h = 100 }) => {
  const max = Math.max(...data);
  const W = 500;
  const bw = Math.floor((W - data.length * 6) / data.length);
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${W} ${h}`} style={{ display: 'block' }}>
      {data.map((v, i) => {
        const bh = Math.max(4, (v / max) * (h - 18));
        const x = i * (bw + 6);
        return (
          <g key={i}>
            <motion.rect x={x} y={h - 14 - bh} width={bw} height={bh} rx={4}
              fill={colors[i % colors.length]} fillOpacity=".82"
              initial={{ height: 0, y: h - 14 }} animate={{ height: bh, y: h - 14 - bh }}
              transition={{ duration: .7, delay: i * .05 }} />
            {labels && <text x={x + bw / 2} y={h} textAnchor="middle" fontSize="9" fill="rgba(150,170,210,0.5)">{labels[i]}</text>}
          </g>
        );
      })}
    </svg>
  );
};

export const DonutChart = ({ slices, size = 110 }) => {
  const total = slices.reduce((a, b) => a + b.v, 0);
  const cx = size / 2, cy = size / 2, r = size / 2 - 10, ir = r - 16;
  let angle = -Math.PI / 2;
  return (
    <svg width={size} height={size}>
      {slices.map((s, i) => {
        const sw = (s.v / total) * Math.PI * 2;
        const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle); angle += sw;
        const x2 = cx + r * Math.cos(angle), y2 = cy + r * Math.sin(angle);
        const ix1 = cx + ir * Math.cos(angle - sw), iy1 = cy + ir * Math.sin(angle - sw);
        const ix2 = cx + ir * Math.cos(angle), iy2 = cy + ir * Math.sin(angle);
        const d = `M${x1},${y1} A${r},${r} 0 ${sw > Math.PI ? 1 : 0} 1 ${x2},${y2} L${ix2},${iy2} A${ir},${ir} 0 ${sw > Math.PI ? 1 : 0} 0 ${ix1},${iy1} Z`;
        return <motion.path key={i} d={d} fill={s.c} fillOpacity=".88" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * .1 }} />;
      })}
      <circle cx={cx} cy={cy} r={ir - 2} fill="rgba(0,0,0,0.35)" />
    </svg>
  );
};
