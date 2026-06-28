import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { reportService } from '../api/inventoryService';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS = ['#4F8EF7','#9B6DFF','#00D4B4','#FF6B35','#F59E0B','#22D67A'];

/* ─── tiny SVG chart helpers (no dependency) ─────────────── */
const Sparkline = ({ data, color, h = 48, w = 120 }) => {
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 4) - 2}`).join(' ');
  const area = `0,${h} ` + pts + ` ${w},${h}`;
  const id = `sp${color.replace('#','')}`;
  return (
    <svg width={w} height={h} style={{ display:'block', overflow:'visible' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const AreaChart = ({ series, h = 160, labels }) => {
  const allVals = series.flatMap(s => s.data);
  const max = Math.max(...allVals, 1);
  const W = 540, pad = 36;
  const toX = i => pad + (i / (series[0].data.length - 1)) * (W - pad * 2);
  const toY = v => h - 8 - (v / max) * (h - 20);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${h}`} style={{ display:'block', overflow:'visible' }}>
      <defs>
        {series.map((s, si) => (
          <linearGradient key={si} id={`area${si}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity=".2" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {/* Grid lines */}
      {[0.25,0.5,0.75,1].map(f => (
        <line key={f} x1={pad} y1={toY(max*f)} x2={W-pad} y2={toY(max*f)}
          stroke="rgba(150,170,200,0.12)" strokeWidth="1" strokeDasharray="4,4" />
      ))}
      {series.map((s, si) => {
        const pts = s.data.map((v,i) => [toX(i), toY(v)]);
        const line = pts.map((p,i) => `${i===0?'M':'L'}${p[0]},${p[1]}`).join(' ');
        const area = line + ` L${pts[pts.length-1][0]},${h} L${pts[0][0]},${h} Z`;
        return (
          <g key={si}>
            <motion.path d={area} fill={`url(#area${si})`}
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:si*.15 }} />
            <motion.path d={line} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray={s.dash ? '6,3' : undefined}
              initial={{ pathLength:0 }} animate={{ pathLength:1 }} transition={{ duration:1.2, delay:si*.15 }} />
            <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="4" fill={s.color} />
          </g>
        );
      })}
      {labels && labels.map((l,i) => {
        if (series[0].data.length > 12 ? i % 4 !== 0 : i % 2 !== 0) return null;
        return <text key={i} x={toX(i)} y={h+2} textAnchor="middle" fontSize="10" fill="rgba(140,160,190,0.55)">{l}</text>;
      })}
    </svg>
  );
};

const BarGroup = ({ data, colors, labels, h = 140 }) => {
  const max = Math.max(...data, 1);
  const W = 540, pad = 36;
  const bw = Math.floor((W - pad*2 - data.length*6) / data.length);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${h+16}`} style={{ display:'block' }}>
      {[0.25,0.5,0.75,1].map(f => (
        <line key={f} x1={pad} y1={h - (f*h*0.85)} x2={W-pad} y2={h - (f*h*0.85)}
          stroke="rgba(150,170,200,0.12)" strokeWidth="1" strokeDasharray="4,4" />
      ))}
      {data.map((v, i) => {
        const bh = Math.max(4, (v / max) * h * 0.85);
        const x = pad + i * (bw + 6);
        return (
          <g key={i}>
            <motion.rect x={x} y={h - bh} width={bw} height={bh} rx="5"
              fill={colors[i % colors.length]} fillOpacity=".85"
              initial={{ height:0, y:h }} animate={{ height:bh, y:h-bh }} transition={{ duration:.6, delay:i*.04 }} />
            {labels && <text x={x+bw/2} y={h+14} textAnchor="middle" fontSize="10" fill="rgba(140,160,190,0.55)">{labels[i]}</text>}
          </g>
        );
      })}
    </svg>
  );
};

const DonutRing = ({ slices, size = 140 }) => {
  const total = slices.reduce((a,s) => a + s.v, 0) || 1;
  const cx = size/2, cy = size/2, r = size/2-14, ir = r-22;
  let angle = -Math.PI/2;
  return (
    <svg width={size} height={size}>
      {slices.map((s,i) => {
        const sw = (s.v / total) * Math.PI * 2;
        const x1=cx+r*Math.cos(angle), y1=cy+r*Math.sin(angle); angle+=sw;
        const x2=cx+r*Math.cos(angle), y2=cy+r*Math.sin(angle);
        const ix1=cx+ir*Math.cos(angle-sw), iy1=cy+ir*Math.sin(angle-sw);
        const ix2=cx+ir*Math.cos(angle), iy2=cy+ir*Math.sin(angle);
        const d=`M${x1},${y1} A${r},${r} 0 ${sw>Math.PI?1:0} 1 ${x2},${y2} L${ix2},${iy2} A${ir},${ir} 0 ${sw>Math.PI?1:0} 0 ${ix1},${iy1} Z`;
        return <motion.path key={i} d={d} fill={s.c} fillOpacity=".88"
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*.08 }} />;
      })}
      <circle cx={cx} cy={cy} r={ir-3} fill="rgba(0,0,0,0.25)" />
    </svg>
  );
};

/* ─── KPI card ────────────────────────────────────────────── */
const KPICard = ({ label, value, sub, icon, color, trend, spark, T, darkMode, delay=0 }) => (
  <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay }}
    style={{ background:T.bgCard, border:`1px solid ${color}28`, borderRadius:14, padding:'18px 20px', display:'flex', flexDirection:'column', gap:10 }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <div style={{ fontSize:11, fontWeight:700, color:T.textSub, textTransform:'uppercase', letterSpacing:'.06em', lineHeight:1.4, maxWidth:110 }}>{label}</div>
      <div style={{ width:34, height:34, borderRadius:10, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{icon}</div>
    </div>
    <div style={{ fontSize:'1.6rem', fontWeight:900, color, lineHeight:1 }}>{value}</div>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
      <div style={{ fontSize:11, color:T.textSub }}>{sub}</div>
      {spark && <Sparkline data={spark} color={color} h={28} w={72} />}
    </div>
    {trend !== undefined && (
      <div style={{ fontSize:11, fontWeight:700, color: trend>=0?T.green:T.red }}>
        {trend>=0?'↑':'↓'} {Math.abs(trend)}% vs last period
      </div>
    )}
  </motion.div>
);

/* ─── NA badge ────────────────────────────────────────────── */
const NA = ({ T, reason }) => (
  <div style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:99, background:`${T.yellow}14`, border:`1px solid ${T.yellow}33` }}>
    <span style={{ fontSize:12 }}>⏳</span>
    <span style={{ fontSize:11, color:T.yellow, fontWeight:600 }}>N/A — {reason}</span>
  </div>
);

/* ─── download helper ─────────────────────────────────────── */
const downloadCSV = (rows, filename) => {
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
};

const downloadJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
};

/* ════════════════════════════════════════════════════════════
   MAIN REPORTS PAGE
════════════════════════════════════════════════════════════ */
export default function ReportsPage({ T, darkMode }) {
  const [summary, setSummary]   = useState(null);
  const [invData, setInvData]   = useState(null);
  const [revData, setRevData]   = useState(null);
  const [supData, setSupData]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [period, setPeriod]     = useState('monthly');
  const [activeTab, setActiveTab] = useState('overview');
  const [dlMenu, setDlMenu]     = useState(false);
  const dlRef = useRef(null);

  const C = { background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:22 };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true); setError(null);
      const [s, inv, rev, sup] = await Promise.all([
        reportService.getSummary({ period }),
        reportService.getInventoryReport({ period }),
        reportService.getRevenueReport({ period }),
        reportService.getSupplierReport ? reportService.getSupplierReport() : Promise.resolve({ data: null }),
      ]);
      if (s.error && inv.error) {
        setError('Could not load reports — make sure the backend is running at http://127.0.0.1:8000');
        setLoading(false); return;
      }
      setSummary(s.data || null);
      setInvData(inv.data || null);
      setRevData(rev.data || null);
      setSupData(sup.data || null);
      setLoading(false);
    };
    fetchAll();
  }, [period]);

  // Close download menu on outside click
  useEffect(() => {
    const fn = e => { if (dlRef.current && !dlRef.current.contains(e.target)) setDlMenu(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const fmt = v => {
    if (v === null || v === undefined) return null;
    if (v >= 10000000) return `₹${(v/10000000).toFixed(2)}Cr`;
    if (v >= 100000)   return `₹${(v/100000).toFixed(2)}L`;
    if (v >= 1000)     return `₹${(v/1000).toFixed(1)}K`;
    return `₹${v}`;
  };

  const stockIn  = invData?.stock_in  || new Array(12).fill(0);
  const stockOut = invData?.stock_out || new Array(12).fill(0);
  const revenue  = revData?.monthly   || new Array(12).fill(0);
  const orders   = revData?.orders    || new Array(12).fill(0);
  const hasData  = summary?.has_transactions;

  // Build download data
  const handleDownload = (type) => {
    setDlMenu(false);
    const ts = new Date().toISOString().slice(0,10);
    if (type === 'summary-csv') {
      if (!summary) return;
      const rows = [
        ['Metric','Value'],
        ['Total Products', summary.total_products],
        ['Total Stock Value', fmt(summary.total_stock_value)],
        ['Total Revenue', fmt(summary.total_revenue)],
        ['Total IN Value', fmt(summary.total_in_value)],
        ['Gross Margin', summary.gross_margin !== null ? `${summary.gross_margin}%` : 'N/A'],
        ['Stock Accuracy', summary.stock_accuracy !== null ? `${summary.stock_accuracy}%` : 'N/A'],
        ['Stockout Events', summary.stockout_events],
        ['Low Stock Count', summary.low_stock_count],
        ['Inventory Turnover', summary.inventory_turnover !== null ? `${summary.inventory_turnover}x` : 'N/A'],
        ['Total Transactions', summary.total_transactions],
        ['Stock IN Count', summary.txn_count_in],
        ['Stock OUT Count', summary.txn_count_out],
        ['Transfers', summary.txn_count_trf],
        ['Total Orders', summary.total_orders],
        ['Avg Order Value', summary.avg_order_value !== null ? fmt(summary.avg_order_value) : 'N/A'],
        ['On-Time Delivery', summary.on_time_delivery !== null ? `${summary.on_time_delivery}%` : 'N/A'],
      ];
      downloadCSV(rows, `inventiq-summary-${ts}.csv`);
    } else if (type === 'inventory-csv') {
      const rows = [['Month','Stock IN (units)','Stock OUT (units)']];
      MONTHS.forEach((m,i) => rows.push([m, stockIn[i], stockOut[i]]));
      downloadCSV(rows, `inventiq-inventory-${ts}.csv`);
    } else if (type === 'revenue-csv') {
      const rows = [['Month','Revenue (₹L)','Orders']];
      MONTHS.forEach((m,i) => rows.push([m, revenue[i], orders[i]]));
      downloadCSV(rows, `inventiq-revenue-${ts}.csv`);
    } else if (type === 'full-json') {
      downloadJSON({ summary, inventory: { stock_in: stockIn, stock_out: stockOut }, revenue: { monthly: revenue, orders } }, `inventiq-report-${ts}.json`);
    }
  };

  const TABS = [
    { id:'overview',   label:'Overview' },
    { id:'inventory',  label:'Inventory' },
    { id:'revenue',    label:'Revenue' },
    { id:'categories', label:'Categories' },
    { id:'suppliers',  label:'Suppliers' },
  ];

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:'1.4rem', fontWeight:900, color:T.text, letterSpacing:'-.03em' }}>Reports & Analytics</h1>
          <p style={{ fontSize:13, color:T.textSub, marginTop:3 }}>
            All figures calculated from your live database · Last refreshed {new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
          </p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {/* Period selector */}
          {['weekly','monthly','quarterly','yearly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${period===p?T.a1:T.border}`, background:period===p?`${T.a1}18`:'transparent', color:period===p?T.a1:T.textMid, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', textTransform:'capitalize' }}>
              {p}
            </button>
          ))}
          {/* Download menu */}
          <div ref={dlRef} style={{ position:'relative' }}>
            <button onClick={() => setDlMenu(v=>!v)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:8, border:`1px solid ${T.a1}`, background:`${T.a1}14`, color:T.a1, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              ⬇ Download
            </button>
            <AnimatePresence>
              {dlMenu && (
                <motion.div initial={{ opacity:0, y:6, scale:.97 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:6 }}
                  style={{ position:'absolute', right:0, top:40, width:220, background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:12, boxShadow:'0 16px 40px rgba(0,0,0,.35)', zIndex:100, overflow:'hidden' }}>
                  <div style={{ padding:'10px 14px', fontSize:10, fontWeight:700, color:T.textSub, textTransform:'uppercase', letterSpacing:'.08em', borderBottom:`1px solid ${T.border}` }}>
                    Download Report
                  </div>
                  {[
                    { key:'summary-csv',   icon:'📊', label:'Summary (CSV)' },
                    { key:'inventory-csv', icon:'📦', label:'Inventory Movement (CSV)' },
                    { key:'revenue-csv',   icon:'💰', label:'Revenue Data (CSV)' },
                    { key:'full-json',     icon:'🗂', label:'Full Report (JSON)' },
                  ].map(opt => (
                    <button key={opt.key} onClick={() => handleDownload(opt.key)}
                      style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 14px', border:'none', background:'transparent', cursor:'pointer', fontFamily:'inherit', fontSize:13, color:T.textMid, borderBottom:`1px solid ${T.border}`, textAlign:'left' }}>
                      <span style={{ fontSize:16 }}>{opt.icon}</span>{opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:'flex', gap:4, marginBottom:22, borderBottom:`1px solid ${T.border}`, paddingBottom:0 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding:'10px 18px', border:'none', background:'transparent', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:activeTab===tab.id?700:500, color:activeTab===tab.id?T.a1:T.textMid, borderBottom:`2px solid ${activeTab===tab.id?T.a1:'transparent'}`, marginBottom:-1, transition:'all .18s' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign:'center', padding:60, color:T.textSub }}>
          <div style={{ width:28, height:28, border:`3px solid ${T.a1}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite', margin:'0 auto 16px' }} />
          <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
          Loading report data…
        </div>
      )}
      {error && <div style={{ ...C, textAlign:'center', padding:48, color:T.red }}>⚠ {error}</div>}

      {!loading && !error && (
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:.18 }}>

            {/* ══ OVERVIEW TAB ══ */}
            {activeTab === 'overview' && (
              <div>
                {/* KPI grid — 4 columns */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
                  {[
                    {
                      label:'Total Revenue', icon:'💰', color:T.a1,
                      value: summary?.total_revenue > 0 ? fmt(summary.total_revenue) : null,
                      nullReason:'no stock-out transactions',
                      sub:'From all stock-out transactions',
                      spark: revenue,
                    },
                    {
                      label:'Stock Value', icon:'📦', color:T.a2,
                      value: summary?.total_stock_value > 0 ? fmt(summary.total_stock_value) : null,
                      nullReason:'no products',
                      sub:`${summary?.total_products || 0} products tracked`,
                    },
                    {
                      label:'Stock Accuracy', icon:'🎯', color:T.a3,
                      value: summary?.stock_accuracy !== null && summary?.stock_accuracy !== undefined ? `${summary.stock_accuracy}%` : null,
                      nullReason:'no products yet',
                      sub:'Products above reorder point',
                    },
                    {
                      label:'Gross Margin', icon:'📈', color:T.green,
                      value: summary?.gross_margin !== null && summary?.gross_margin !== undefined ? `${summary.gross_margin}%` : null,
                      nullReason:'need both IN and OUT transactions',
                      sub:'(Revenue − Cost) / Revenue',
                    },
                    {
                      label:'Inventory Turnover', icon:'🔄', color:T.a4,
                      value: summary?.inventory_turnover !== null && summary?.inventory_turnover !== undefined ? `${summary.inventory_turnover}×` : null,
                      nullReason:'need stock-out transactions',
                      sub:'Annualized (OUT / Stock Value × 12)',
                    },
                    {
                      label:'On-Time Delivery', icon:'🚚', color:T.yellow,
                      value: summary?.on_time_delivery !== null && summary?.on_time_delivery !== undefined ? `${summary.on_time_delivery}%` : null,
                      nullReason:'no supplier data',
                      sub:'Avg across suppliers with data',
                    },
                    {
                      label:'Stockout Events', icon:'🚨', color:T.red,
                      value: summary !== null ? String(summary.stockout_events) : null,
                      nullReason:'no products',
                      sub:'Products with stock = 0',
                    },
                    {
                      label:'Total Transactions', icon:'🔁', color:T.a1,
                      value: summary !== null ? String(summary.total_transactions) : null,
                      nullReason:'no transactions',
                      sub:`IN: ${summary?.txn_count_in || 0} · OUT: ${summary?.txn_count_out || 0} · TRF: ${summary?.txn_count_trf || 0}`,
                    },
                  ].map((k, i) => (
                    <KPICard key={k.label} {...k}
                      value={k.value ?? <NA T={T} reason={k.nullReason} />}
                      spark={k.spark}
                      T={T} darkMode={darkMode} delay={i*.05} />
                  ))}
                </div>

                {/* Revenue + Stock Movement charts side by side */}
                <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:16, marginBottom:16 }}>
                  <div style={C}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                      <div>
                        <div style={{ fontWeight:800, fontSize:14, color:T.text }}>Revenue vs Cost</div>
                        <div style={{ fontSize:11, color:T.textSub, marginTop:2 }}>Stock-out (revenue) vs Stock-in (cost) value — ₹L</div>
                      </div>
                    </div>
                    {hasData ? (
                      <>
                        <AreaChart
                          series={[
                            { data: revenue, color:T.a1, fill:true },
                            { data: invData?.stock_out?.map((v,i) => (v * (summary?.avg_order_value || 0)) / 100000) || revenue.map(()=>0), color:T.a4, dash:true },
                          ]}
                          h={160} labels={MONTHS} />
                        <div style={{ display:'flex', gap:18, marginTop:12 }}>
                          {[{c:T.a1,l:'Revenue (₹L)'},{c:T.a4,l:'Approx. Cost',dash:true}].map(lg=>(
                            <div key={lg.l} style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <div style={{ width:16, height:2, background:lg.dash?'none':lg.c, backgroundImage:lg.dash?`repeating-linear-gradient(90deg,${lg.c} 0,${lg.c} 4px,transparent 4px,transparent 8px)`:'none', borderRadius:1 }}/>
                              <span style={{ fontSize:11, color:T.textSub }}>{lg.l}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <EmptyChart T={T} msg="Log stock-in and stock-out transactions to see revenue vs cost." />
                    )}
                  </div>

                  {/* Transaction breakdown */}
                  <div style={C}>
                    <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:16 }}>Transaction Breakdown</div>
                    {summary?.total_transactions > 0 ? (
                      <>
                        {[
                          { label:'Stock IN',  count:summary.txn_count_in,  color:T.green, pct: Math.round(summary.txn_count_in/summary.total_transactions*100) },
                          { label:'Stock OUT', count:summary.txn_count_out, color:T.red,   pct: Math.round(summary.txn_count_out/summary.total_transactions*100) },
                          { label:'Transfers', count:summary.txn_count_trf, color:T.a3,    pct: Math.round(summary.txn_count_trf/summary.total_transactions*100) },
                        ].map(s => (
                          <div key={s.label} style={{ marginBottom:14 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                                <div style={{ width:8, height:8, borderRadius:'50%', background:s.color }}/>
                                <span style={{ fontSize:13, color:T.text, fontWeight:600 }}>{s.label}</span>
                              </div>
                              <span style={{ fontSize:13, fontWeight:800, color:s.color }}>{s.count} <span style={{ fontSize:11, color:T.textSub, fontWeight:500 }}>({s.pct}%)</span></span>
                            </div>
                            <div style={{ height:6, borderRadius:99, background:darkMode?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.07)', overflow:'hidden' }}>
                              <motion.div initial={{ width:0 }} animate={{ width:`${s.pct}%` }} transition={{ duration:.8 }}
                                style={{ height:'100%', background:s.color, borderRadius:99 }}/>
                            </div>
                          </div>
                        ))}
                        <div style={{ marginTop:16, padding:'12px 14px', borderRadius:10, background:darkMode?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)', border:`1px solid ${T.border}` }}>
                          <div style={{ fontSize:11, color:T.textSub, marginBottom:2 }}>Total Transactions</div>
                          <div style={{ fontSize:'1.4rem', fontWeight:900, color:T.a1 }}>{summary.total_transactions}</div>
                        </div>
                      </>
                    ) : (
                      <EmptyChart T={T} msg="Log transactions to see breakdown." />
                    )}
                  </div>
                </div>

                {/* Low stock alert table */}
                {summary?.low_stock_count > 0 && (
                  <div style={{ ...C, border:`1px solid ${T.red}28` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                      <span style={{ fontSize:18 }}>🚨</span>
                      <div style={{ fontWeight:800, fontSize:14, color:T.red }}>{summary.low_stock_count} Products Need Attention</div>
                    </div>
                    <div style={{ fontSize:12, color:T.textSub }}>
                      Go to the <strong style={{ color:T.a1 }}>Products</strong> page → filter by "Critical" or "Low Stock" to see affected SKUs and take action.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ INVENTORY TAB ══ */}
            {activeTab === 'inventory' && (
              <div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
                  {[
                    { label:'Total Products',  v:summary?.total_products || 0,    c:T.a1, icon:'📦' },
                    { label:'Low Stock Items', v:summary?.low_stock_count || 0,   c:T.yellow, icon:'⚠️' },
                    { label:'Stockout Items',  v:summary?.stockout_events || 0,   c:T.red, icon:'🚨' },
                  ].map((k,i) => (
                    <motion.div key={k.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.07 }}
                      style={{ ...C, border:`1px solid ${k.c}28`, display:'flex', alignItems:'center', gap:14, padding:'16px 20px' }}>
                      <div style={{ width:42, height:42, borderRadius:11, background:`${k.c}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{k.icon}</div>
                      <div>
                        <div style={{ fontSize:'1.6rem', fontWeight:900, color:k.c }}>{k.v}</div>
                        <div style={{ fontSize:11, color:T.textSub, marginTop:2 }}>{k.label}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                  <div style={C}>
                    <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:4 }}>Stock IN vs OUT — Monthly</div>
                    <div style={{ fontSize:11, color:T.textSub, marginBottom:14 }}>Units received vs dispatched ({period})</div>
                    {invData?.has_data ? (
                      <>
                        <AreaChart series={[
                          { data:stockIn,  color:T.green, fill:true },
                          { data:stockOut, color:T.red, dash:true },
                        ]} h={160} labels={MONTHS} />
                        <div style={{ display:'flex', gap:18, marginTop:10 }}>
                          {[{c:T.green,l:'Stock IN (units)'},{c:T.red,l:'Stock OUT',dash:true}].map(lg=>(
                            <div key={lg.l} style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <div style={{ width:16, height:2, background:lg.dash?'none':lg.c, backgroundImage:lg.dash?`repeating-linear-gradient(90deg,${lg.c} 0,${lg.c} 4px,transparent 4px,transparent 8px)`:'none', borderRadius:1 }}/>
                              <span style={{ fontSize:11, color:T.textSub }}>{lg.l}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : <EmptyChart T={T} msg="Log stock-in and stock-out transactions." />}
                  </div>

                  <div style={C}>
                    <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:4 }}>Net Stock Change</div>
                    <div style={{ fontSize:11, color:T.textSub, marginBottom:14 }}>IN minus OUT per month (positive = stock grew)</div>
                    {invData?.has_data ? (
                      <BarGroup
                        data={stockIn.map((v,i) => Math.abs(v - stockOut[i]))}
                        colors={stockIn.map((v,i) => v >= stockOut[i] ? T.green : T.red)}
                        labels={MONTHS.map((m,i) => i%2===0?m:'')}
                        h={150} />
                    ) : <EmptyChart T={T} msg="Log transactions to see net stock change." />}
                  </div>
                </div>

                {/* Monthly breakdown table */}
                <div style={C}>
                  <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:14 }}>Monthly Breakdown Table</div>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                        {['Month','Stock IN (units)','Stock OUT (units)','Net Change','Status'].map(h=>(
                          <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:11, fontWeight:700, color:T.textSub, letterSpacing:'.05em', textTransform:'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MONTHS.map((m,i) => {
                        const net = stockIn[i] - stockOut[i];
                        const hasAny = stockIn[i] > 0 || stockOut[i] > 0;
                        return (
                          <tr key={m} className="row-hover" style={{ borderBottom:`1px solid ${T.border}`, transition:'background .15s' }}>
                            <td style={{ padding:'10px 12px', fontSize:13, fontWeight:600, color:T.text }}>{m}</td>
                            <td style={{ padding:'10px 12px', fontSize:13, color:T.green, fontWeight:700 }}>{stockIn[i] > 0 ? `+${stockIn[i]}` : '—'}</td>
                            <td style={{ padding:'10px 12px', fontSize:13, color:T.red, fontWeight:700 }}>{stockOut[i] > 0 ? `-${stockOut[i]}` : '—'}</td>
                            <td style={{ padding:'10px 12px', fontSize:13, fontWeight:700, color:net>0?T.green:net<0?T.red:T.textSub }}>{hasAny ? (net>=0?`+${net}`:net) : '—'}</td>
                            <td style={{ padding:'10px 12px' }}>
                              {!hasAny ? <span style={{ fontSize:11, color:T.textSub }}>No data</span>
                                : <span style={{ fontSize:11, padding:'2px 8px', borderRadius:99, background:`${net>=0?T.green:T.red}18`, color:net>=0?T.green:T.red, fontWeight:700 }}>
                                    {net>=0?'📈 Gained':'📉 Lost'}
                                  </span>
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══ REVENUE TAB ══ */}
            {activeTab === 'revenue' && (
              <div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
                  {[
                    { label:'Total Revenue',    v:summary?.total_revenue>0?fmt(summary.total_revenue):'₹0', c:T.a1, icon:'💰' },
                    { label:'Total Cost (IN)',  v:summary?.total_in_value>0?fmt(summary.total_in_value):'₹0', c:T.a4, icon:'🏭' },
                    { label:'Gross Margin',     v:summary?.gross_margin!==null&&summary?.gross_margin!==undefined?`${summary.gross_margin}%`:null, c:T.green, icon:'📊' },
                    { label:'Avg Order Value',  v:summary?.avg_order_value?fmt(summary.avg_order_value):null, c:T.a2, icon:'🛒' },
                  ].map((k,i) => (
                    <motion.div key={k.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.07 }}
                      style={{ ...C, border:`1px solid ${k.c}28`, textAlign:'center', padding:'18px 14px' }}>
                      <div style={{ fontSize:22, marginBottom:8 }}>{k.icon}</div>
                      <div style={{ fontSize:'1.4rem', fontWeight:900, color:k.c, marginBottom:4 }}>
                        {k.v ?? <NA T={T} reason="insufficient data" />}
                      </div>
                      <div style={{ fontSize:11, color:T.textSub }}>{k.label}</div>
                    </motion.div>
                  ))}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:16, marginBottom:16 }}>
                  <div style={C}>
                    <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:4 }}>Monthly Revenue (₹L)</div>
                    <div style={{ fontSize:11, color:T.textSub, marginBottom:14 }}>Revenue from stock-out transactions per month</div>
                    {revData?.has_data
                      ? <AreaChart series={[{ data:revenue, color:T.a1, fill:true }]} h={160} labels={MONTHS} />
                      : <EmptyChart T={T} msg="Log stock-out transactions to generate revenue data." />}
                  </div>

                  <div style={C}>
                    <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:4 }}>Orders per Month</div>
                    <div style={{ fontSize:11, color:T.textSub, marginBottom:14 }}>Purchase order volume</div>
                    {orders.some(v=>v>0)
                      ? <BarGroup data={orders} colors={[T.a2]} labels={MONTHS.map((m,i)=>i%2===0?m:'')} h={150} />
                      : <EmptyChart T={T} msg="Create purchase orders to see volume." />}
                  </div>
                </div>

                {/* Revenue table */}
                <div style={C}>
                  <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:14 }}>Monthly Revenue Table</div>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                        {['Month','Revenue (₹L)','Orders','Status'].map(h=>(
                          <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:11, fontWeight:700, color:T.textSub, textTransform:'uppercase', letterSpacing:'.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MONTHS.map((m,i) => (
                        <tr key={m} className="row-hover" style={{ borderBottom:`1px solid ${T.border}`, transition:'background .15s' }}>
                          <td style={{ padding:'10px 12px', fontSize:13, fontWeight:600, color:T.text }}>{m}</td>
                          <td style={{ padding:'10px 12px', fontSize:13, fontWeight:700, color:revenue[i]>0?T.a1:T.textSub }}>
                            {revenue[i]>0 ? `₹${revenue[i]}L` : '—'}
                          </td>
                          <td style={{ padding:'10px 12px', fontSize:13, color:T.textMid }}>{orders[i] > 0 ? orders[i] : '—'}</td>
                          <td style={{ padding:'10px 12px' }}>
                            {revenue[i]>0
                              ? <span style={{ fontSize:11, padding:'2px 8px', borderRadius:99, background:`${T.green}18`, color:T.green, fontWeight:700 }}>Revenue recorded</span>
                              : <span style={{ fontSize:11, color:T.textSub }}>No data</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══ CATEGORIES TAB ══ */}
            {activeTab === 'categories' && (
              <div>
                {summary?.top_categories?.length > 0 ? (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:16 }}>
                    {/* Donut */}
                    <div style={C}>
                      <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:16 }}>Stock Value by Category</div>
                      <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
                        <div style={{ position:'relative' }}>
                          <DonutRing
                            slices={summary.top_categories.map((c,i)=>({ v:c.stock_value, c:COLORS[i%COLORS.length] }))}
                            size={160} />
                          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                            <div style={{ fontSize:13, fontWeight:900, color:T.text }}>{fmt(summary.total_stock_value)}</div>
                            <div style={{ fontSize:9, color:T.textSub }}>Total Value</div>
                          </div>
                        </div>
                      </div>
                      {summary.top_categories.map((c,i)=>(
                        <div key={c.name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ width:10, height:10, borderRadius:'50%', background:COLORS[i%COLORS.length] }}/>
                            <span style={{ fontSize:13, color:T.textMid }}>{c.name}</span>
                          </div>
                          <span style={{ fontSize:13, fontWeight:700, color:T.text }}>{fmt(c.stock_value)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Category table */}
                    <div style={C}>
                      <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:14 }}>Category Breakdown</div>
                      <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                            {['Category','Products','Total Units','Stock Value'].map(h=>(
                              <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:11, fontWeight:700, color:T.textSub, textTransform:'uppercase', letterSpacing:'.05em' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {summary.top_categories.map((c,i)=>(
                            <tr key={c.name} className="row-hover" style={{ borderBottom:`1px solid ${T.border}`, transition:'background .15s' }}>
                              <td style={{ padding:'11px 12px' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                  <div style={{ width:8, height:8, borderRadius:'50%', background:COLORS[i%COLORS.length] }}/>
                                  <span style={{ fontSize:13, fontWeight:700, color:T.text }}>{c.name}</span>
                                </div>
                              </td>
                              <td style={{ padding:'11px 12px', fontSize:13, color:T.textMid }}>{c.product_count}</td>
                              <td style={{ padding:'11px 12px', fontSize:13, color:T.textMid }}>{c.total_stock?.toLocaleString()}</td>
                              <td style={{ padding:'11px 12px', fontSize:13, fontWeight:700, color:T.a1 }}>{fmt(c.stock_value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div style={{ ...C, textAlign:'center', padding:60 }}>
                    <div style={{ fontSize:36, marginBottom:12 }}>📂</div>
                    <div style={{ fontWeight:700, fontSize:16, color:T.text, marginBottom:8 }}>No Category Data</div>
                    <div style={{ fontSize:13, color:T.textSub }}>Add products with categories assigned to see the breakdown.</div>
                  </div>
                )}
              </div>
            )}

            {/* ══ SUPPLIERS TAB ══ */}
            {activeTab === 'suppliers' && (
              <div>
                {supData?.suppliers?.length > 0 || summary?.has_suppliers ? (
                  <>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
                      {[
                        { label:'Total Suppliers', v:supData?.suppliers?.length || 0, c:T.a1, icon:'🤝' },
                        { label:'On-Time Delivery', v:summary?.on_time_delivery!==null&&summary?.on_time_delivery!==undefined?`${summary.on_time_delivery}%`:null, c:T.green, icon:'🚚' },
                        { label:'Preferred Suppliers', v:supData?.suppliers?.filter(s=>s.status==='preferred').length || 0, c:T.a2, icon:'⭐' },
                      ].map((k,i)=>(
                        <motion.div key={k.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.07 }}
                          style={{ ...C, border:`1px solid ${k.c}28`, display:'flex', alignItems:'center', gap:14, padding:'16px 20px' }}>
                          <div style={{ width:42, height:42, borderRadius:11, background:`${k.c}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{k.icon}</div>
                          <div>
                            <div style={{ fontSize:'1.5rem', fontWeight:900, color:k.c }}>{k.v ?? <NA T={T} reason="no supplier data" />}</div>
                            <div style={{ fontSize:11, color:T.textSub, marginTop:2 }}>{k.label}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {supData?.suppliers?.length > 0 && (
                      <div style={C}>
                        <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:14 }}>Supplier Performance</div>
                        <table style={{ width:'100%', borderCollapse:'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                              {['Supplier','Category','Rating','On-Time %','Orders','Status'].map(h=>(
                                <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:11, fontWeight:700, color:T.textSub, textTransform:'uppercase', letterSpacing:'.05em' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {supData.suppliers.map((s,i)=>{
                              const rc = s.rating>=4.5?T.green:s.rating>=3.5?T.yellow:T.red;
                              const oc = s.on_time_percent>=90?T.green:s.on_time_percent>=75?T.yellow:T.red;
                              const sc = {preferred:T.green,active:T.a1,review:T.yellow}[s.status]||T.textSub;
                              return (
                                <tr key={i} className="row-hover" style={{ borderBottom:`1px solid ${T.border}`, transition:'background .15s' }}>
                                  <td style={{ padding:'11px 12px', fontSize:13, fontWeight:700, color:T.text }}>{s.name}</td>
                                  <td style={{ padding:'11px 12px' }}><span style={{ fontSize:11, padding:'2px 8px', borderRadius:99, background:`${T.a1}18`, color:T.a1 }}>{s.category}</span></td>
                                  <td style={{ padding:'11px 12px', fontSize:13, fontWeight:700, color:rc }}>{'★'.repeat(Math.round(s.rating||0))} {s.rating || '—'}</td>
                                  <td style={{ padding:'11px 12px' }}>
                                    <div style={{ fontSize:12, fontWeight:700, color:oc, marginBottom:3 }}>{s.on_time_percent>0?`${s.on_time_percent}%`:'—'}</div>
                                    {s.on_time_percent>0&&<div style={{ height:4, borderRadius:99, background:darkMode?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.07)', width:80, overflow:'hidden' }}>
                                      <motion.div initial={{ width:0 }} animate={{ width:`${s.on_time_percent}%` }} transition={{ duration:.8 }} style={{ height:'100%', background:oc, borderRadius:99 }}/>
                                    </div>}
                                  </td>
                                  <td style={{ padding:'11px 12px', fontSize:13, color:T.textMid }}>{s.orders || '—'}</td>
                                  <td style={{ padding:'11px 12px' }}>
                                    <span style={{ fontSize:11, padding:'2px 9px', borderRadius:99, background:`${sc}18`, color:sc, fontWeight:700, border:`1px solid ${sc}33`, textTransform:'capitalize' }}>{s.status}</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ ...C, textAlign:'center', padding:60 }}>
                    <div style={{ fontSize:36, marginBottom:12 }}>🤝</div>
                    <div style={{ fontWeight:700, fontSize:16, color:T.text, marginBottom:8 }}>No Supplier Data</div>
                    <div style={{ fontSize:13, color:T.textSub }}>Add suppliers from the Suppliers page to see performance analytics here.</div>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

/* ─── empty chart placeholder ─────────────────────────────── */
function EmptyChart({ T, msg }) {
  return (
    <div style={{ height:160, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', borderRadius:10, background:T.darkMode?'rgba(255,255,255,0.03)':'rgba(0,0,0,0.03)', border:`1px dashed ${T.border}` }}>
      <div style={{ fontSize:28, marginBottom:10 }}>📊</div>
      <div style={{ fontSize:12, color:T.textSub, textAlign:'center', maxWidth:200, lineHeight:1.5 }}>{msg}</div>
    </div>
  );
}