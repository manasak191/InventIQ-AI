import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { dashboardService } from '../api/inventoryService';

export default function WarehousePage({ T, darkMode }) {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const card = { background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: 22 };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error: err } = await dashboardService.getWarehouseStats();
      if (err) { setError(err); setLoading(false); return; }
      setWarehouses(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    load();
  }, []);

  const totalStock = warehouses.reduce((a, w) => a + (w.total_stock || 0), 0);
  const totalValue = warehouses.reduce((a, w) => a + (w.total_value || 0), 0);

  const utilColor = (pct) => pct >= 85 ? T.red : pct >= 65 ? T.yellow : T.green;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: T.text, letterSpacing: '-.03em' }}>Warehouses</h1>
        <p style={{ fontSize: 13, color: T.textSub, marginTop: 2 }}>
          {warehouses.length} warehouse{warehouses.length !== 1 ? 's' : ''} — live stock distribution
        </p>
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { l: 'Total Warehouses', v: warehouses.length,                          c: T.a1,    icon: '🏭' },
          { l: 'Total Units',      v: totalStock.toLocaleString(),                 c: T.a3,    icon: '📦' },
          { l: 'Total Value',      v: `₹${(totalValue/100000).toFixed(1)}L`,      c: T.green, icon: '💰' },
        ].map(s => (
          <div key={s.l} style={{ ...card, border: `1px solid ${s.c}28`, display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.c}18`, border: `1px solid ${s.c}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 11, color: T.textSub, marginTop: 2 }}>{s.l}</div>
            </div>
          </div>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 48, color: T.textSub }}>Loading warehouses…</div>}
      {error   && <div style={{ textAlign: 'center', padding: 48, color: T.red }}>⚠ {error} — make sure backend is running.</div>}

      {!loading && !error && warehouses.length === 0 && (
        <div style={{ ...card, textAlign: 'center', padding: 48, color: T.textSub }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏭</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 8 }}>No warehouses yet</div>
          <div style={{ fontSize: 13 }}>Add products with a warehouse name assigned — they will appear here automatically.</div>
        </div>
      )}

      {!loading && !error && warehouses.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
          {warehouses.map((w, i) => {
            // Estimate utilization as a visual indicator based on relative stock
            const maxStock = Math.max(...warehouses.map(x => x.total_stock || 0), 1);
            const utilPct  = Math.round(((w.total_stock || 0) / maxStock) * 100);
            const uc       = utilColor(utilPct);
            return (
              <motion.div key={w.warehouse || i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .08 }}
                style={{ ...card, border: `1px solid ${uc}28` }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: `${T.a1}18`, border: `1px solid ${T.a1}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏭</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{w.warehouse || 'Unassigned'}</div>
                      <div style={{ fontSize: 12, color: T.textSub }}>{w.sku_count} SKU{w.sku_count !== 1 ? 's' : ''} assigned</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 99, background: `${uc}18`, color: uc, fontWeight: 700, border: `1px solid ${uc}33` }}>
                    {utilPct >= 85 ? '🔴 High' : utilPct >= 65 ? '🟡 Medium' : '🟢 Low'} Load
                  </span>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                  {[
                    { l: 'Total Units',   v: (w.total_stock || 0).toLocaleString(), c: T.a1 },
                    { l: 'Stock Value',   v: `₹${((w.total_value || 0)/100000).toFixed(2)}L`, c: T.green },
                    { l: 'SKUs',          v: w.sku_count || 0,                       c: T.a2 },
                    { l: 'Avg per SKU',   v: w.sku_count ? Math.round((w.total_stock||0) / w.sku_count) : 0, c: T.a3 },
                  ].map(s => (
                    <div key={s.l} style={{ padding: '12px 14px', borderRadius: 10, background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: s.c }}>{s.v}</div>
                      <div style={{ fontSize: 11, color: T.textSub, marginTop: 3 }}>{s.l}</div>
                    </div>
                  ))}
                </div>

                {/* Utilization bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: T.textSub, fontWeight: 600 }}>Relative Load</span>
                    <span style={{ fontSize: 11, color: uc, fontWeight: 700 }}>{utilPct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${utilPct}%` }} transition={{ duration: .8, delay: i * .08 }}
                      style={{ height: '100%', background: `linear-gradient(90deg,${uc},${uc}bb)`, borderRadius: 99 }} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}