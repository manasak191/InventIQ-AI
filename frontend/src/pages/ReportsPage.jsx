import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { reportService } from '../api/inventoryService';
import { LineChart, BarChart } from '../components/Charts';

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function ReportsPage({ T, darkMode }) {
  const [summary, setSummary]     = useState(null);
  const [invReport, setInvReport] = useState(null);
  const [revReport, setRevReport] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [period, setPeriod]       = useState('monthly');

  const card = { background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:22 };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true); setError(null);
      const [s, inv, rev] = await Promise.all([
        reportService.getSummary({ period }),
        reportService.getInventoryReport({ period }),
        reportService.getRevenueReport({ period }),
      ]);
      if (s.error && inv.error && rev.error) {
        setError('Could not load reports — make sure the backend is running.');
        setLoading(false); return;
      }
      setSummary(s.data || null);
      setInvReport(inv.data || null);
      setRevReport(rev.data || null);
      setLoading(false);
    };
    fetchAll();
  }, [period]);

  // Use real API data only — no hardcoded fallback numbers
  const stockIn  = invReport?.stock_in  || new Array(12).fill(0);
  const stockOut = invReport?.stock_out || new Array(12).fill(0);
  const revenue  = revReport?.monthly   || new Array(12).fill(0);
  const orders   = revReport?.orders    || new Array(12).fill(0);

  const kpis = summary ? [
    { l:'Stock Accuracy',     v:`${summary.stock_accuracy}%`,      icon:'🎯', c:T.a1 },
    { l:'Total Orders YTD',   v:summary.total_orders_ytd,          icon:'💰', c:T.a2 },
    { l:'Stockout Events',    v:summary.stockout_events,            icon:'🚨', c:T.red },
    { l:'On-Time Delivery',   v:`${summary.on_time_delivery}%`,    icon:'🚚', c:T.green },
    { l:'Inventory Turnover', v:`${summary.inventory_turnover}×`,  icon:'🔄', c:T.a3 },
    { l:'Avg Order Value',    v:summary.avg_order_value,            icon:'🛒', c:T.yellow },
    { l:'Gross Margin',       v:`${summary.gross_margin}%`,        icon:'📊', c:T.a3 },
    { l:'Total Revenue',      v:summary.total_revenue,              icon:'📈', c:T.a1 },
  ] : [];

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:'1.4rem', fontWeight:900, color:T.text, letterSpacing:'-.03em' }}>Reports & Analytics</h1>
          <p style={{ fontSize:13, color:T.textSub, marginTop:2 }}>Live data from your inventory system</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {['weekly','monthly','quarterly','yearly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${period===p?T.a1:T.border}`, background: period===p?`${T.a1}18`:'transparent', color: period===p?T.a1:T.textMid, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', textTransform:'capitalize' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading && <div style={{ textAlign:'center', padding:40, color:T.textSub }}>Loading report data…</div>}
      {error   && <div style={{ textAlign:'center', padding:40, color:T.red }}>⚠ {error}</div>}

      {!loading && !error && (
        <>
          {/* KPI Grid */}
          {kpis.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
              {kpis.map((k,i) => (
                <motion.div key={k.l} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.06 }}
                  style={{ ...card, border:`1px solid ${k.c}28`, textAlign:'center', padding:'20px 16px' }}>
                  <div style={{ fontSize:26, marginBottom:8 }}>{k.icon}</div>
                  <div style={{ fontSize:'1.4rem', fontWeight:900, color:k.c }}>{k.v}</div>
                  <div style={{ fontSize:11, color:T.textSub, marginTop:4 }}>{k.l}</div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Charts */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>
            <div style={card}>
              <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:4 }}>Monthly Stock Movement</div>
              <div style={{ fontSize:11, color:T.textSub, marginBottom:14 }}>Units in vs units out</div>
              <LineChart series={[
                { data:stockIn,  color:T.a1, fill:true },
                { data:stockOut, color:T.a4, dash:true },
              ]} h={130} labels={months} />
              <div style={{ display:'flex', gap:16, marginTop:10 }}>
                {[{c:T.a1,l:'Stock In'},{c:T.a4,l:'Stock Out',dash:true}].map(lg => (
                  <div key={lg.l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:14, height:2, background: lg.dash?'none':lg.c, backgroundImage: lg.dash?`repeating-linear-gradient(90deg,${lg.c} 0,${lg.c} 4px,transparent 4px,transparent 8px)`:'none', borderRadius:1 }} />
                    <span style={{ fontSize:11, color:T.textSub }}>{lg.l}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={card}>
              <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:4 }}>Revenue Trend (₹L)</div>
              <div style={{ fontSize:11, color:T.textSub, marginBottom:14 }}>Monthly revenue performance</div>
              <LineChart series={[{ data:revenue, color:T.a2, fill:true }]} h={130} labels={months} />
            </div>

            <div style={card}>
              <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:4 }}>Orders by Month</div>
              <div style={{ fontSize:11, color:T.textSub, marginBottom:14 }}>Purchase order volume</div>
              <BarChart data={orders} colors={[T.a2]} labels={months.map((m,i) => i%2===0?m:'')} h={130} />
            </div>

            <div style={card}>
              <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:4 }}>Stock In vs Out (Bar)</div>
              <div style={{ fontSize:11, color:T.textSub, marginBottom:14 }}>Monthly comparison</div>
              <BarChart data={stockIn.map((v,i) => v - stockOut[i])} colors={stockIn.map((v,i) => v >= stockOut[i] ? T.green : T.red)} labels={months.map((m,i) => i%2===0?m:'')} h={130} />
            </div>
          </div>

          {/* Empty state when no data yet */}
          {stockIn.every(v => v === 0) && revenue.every(v => v === 0) && (
            <div style={{ ...card, textAlign:'center', padding:40, color:T.textSub }}>
              <div style={{ fontSize:36, marginBottom:12 }}>📊</div>
              <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:8 }}>No report data yet</div>
              <div style={{ fontSize:13 }}>Start adding products and logging transactions — charts will populate automatically.</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
