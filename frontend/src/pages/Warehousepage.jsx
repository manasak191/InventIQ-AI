import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dashboardService, inventoryService } from '../api/inventoryService';
import { BarChart, LineChart } from '../components/Charts';

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function WarehousePage({ T, darkMode }) {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState(null); // selected warehouse for detail view
  const [addModal, setAddModal]     = useState(false);
  const [newWH, setNewWH]           = useState({ name:'', location:'', capacity:'' });
  const [toast, setToast]           = useState(null);

  const C = { background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 };
  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = async () => {
    setLoading(true); setError(null);
    const { data, error: err } = await dashboardService.getWarehouseStats();
    if (err) { setError(err); setLoading(false); return; }
    setWarehouses(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = warehouses.filter(w =>
    w.warehouse?.toLowerCase().includes(search.toLowerCase())
  );

  const utilColor = (w) => {
    const maxStock = Math.max(...warehouses.map(x => x.total_stock || 0), 1);
    const pct = ((w.total_stock || 0) / maxStock) * 100;
    return pct >= 80 ? T.red : pct >= 55 ? T.yellow : T.green;
  };

  const utilPct = (w) => {
    const maxStock = Math.max(...warehouses.map(x => x.total_stock || 0), 1);
    return Math.round(((w.total_stock || 0) / maxStock) * 100);
  };

  // "Add Warehouse" just adds a placeholder product assignment explanation
  const handleAddWarehouse = () => {
    if (!newWH.name.trim()) { showToast('Warehouse name is required', 'error'); return; }
    showToast(`Warehouse "${newWH.name}" noted! Assign it to products to activate it.`);
    setAddModal(false);
    setNewWH({ name:'', location:'', capacity:'' });
  };

  const totalStock = warehouses.reduce((a,w) => a + (w.total_stock||0), 0);
  const totalValue = warehouses.reduce((a,w) => a + (w.total_value||0), 0);
  const totalSKUs  = warehouses.reduce((a,w) => a + (w.sku_count||0), 0);

  return (
    <div>
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            style={{ position:'fixed', top:20, right:20, zIndex:9999, padding:'12px 20px', borderRadius:10, background: toast.type==='error'?T.red:T.green, color:'#fff', fontWeight:700, fontSize:14, boxShadow:'0 8px 24px rgba(0,0,0,.3)' }}>
            {toast.type==='error'?'❌':'✅'} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:'1.4rem', fontWeight:900, color:T.text, letterSpacing:'-.03em' }}>Warehouses</h1>
          <p style={{ fontSize:13, color:T.textSub, marginTop:2 }}>
            {warehouses.length} warehouse{warehouses.length!==1?'s':''} · {totalSKUs} SKUs tracked
          </p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          {/* Search */}
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:13 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search warehouse…"
              style={{ padding:'9px 14px 9px 30px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, width:200, outline:'none', fontFamily:'inherit' }} />
            {search && <button onClick={() => setSearch('')} style={{ position:'absolute', right:9, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:12, color:T.textSub }}>✕</button>}
          </div>
          <button onClick={load} style={{ padding:'9px 14px', borderRadius:9, border:`1px solid ${T.border}`, background:'transparent', color:T.textMid, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>🔄 Refresh</button>
          <button onClick={() => setAddModal(true)} style={{ padding:'9px 18px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${T.a1},${T.a2})`, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>+ Add Warehouse</button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          { l:'Total Warehouses', v: warehouses.length,                        c:T.a1,   icon:'🏭' },
          { l:'Total SKUs',       v: totalSKUs,                                 c:T.a2,   icon:'📦' },
          { l:'Total Units',      v: totalStock.toLocaleString(),               c:T.a3,   icon:'📊' },
          { l:'Total Value',      v: `₹${(totalValue/100000).toFixed(1)}L`,    c:T.green, icon:'💰' },
        ].map(s => (
          <div key={s.l} style={{ ...C, border:`1px solid ${s.c}28`, display:'flex', alignItems:'center', gap:14, padding:'16px 18px' }}>
            <div style={{ width:40, height:40, borderRadius:11, background:`${s.c}18`, border:`1px solid ${s.c}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:'1.4rem', fontWeight:900, color:s.c }}>{s.v}</div>
              <div style={{ fontSize:11, color:T.textSub, marginTop:2 }}>{s.l}</div>
            </div>
          </div>
        ))}
      </div>

      {loading && <div style={{ textAlign:'center', padding:60, color:T.textSub }}>Loading warehouses…</div>}
      {error   && <div style={{ textAlign:'center', padding:60, color:T.red }}>⚠ {error} — make sure backend is running.</div>}

      {!loading && !error && warehouses.length === 0 && (
        <div style={{ ...C, textAlign:'center', padding:60 }}>
          <div style={{ fontSize:40, marginBottom:16 }}>🏭</div>
          <div style={{ fontWeight:800, fontSize:17, color:T.text, marginBottom:8 }}>No warehouses yet</div>
          <div style={{ fontSize:13, color:T.textSub, marginBottom:20 }}>
            Warehouses are created automatically when you assign a warehouse name to a product.<br />
            Go to Products → Add Product → fill in the Warehouse field.
          </div>
          <button onClick={() => showToast('Go to Products page and assign a warehouse to any product')}
            style={{ padding:'10px 22px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${T.a1},${T.a2})`, color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>
            How to add a warehouse →
          </button>
        </div>
      )}

      {!loading && !error && warehouses.length > 0 && (
        <>
          {/* Selected warehouse detail view */}
          {selected && (
            <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
              style={{ ...C, border:`1px solid ${T.a1}44`, marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:16, fontWeight:900, color:T.text }}>🏭 {selected.warehouse}</div>
                  <div style={{ fontSize:12, color:T.textSub, marginTop:3 }}>Detailed view · {selected.sku_count} SKUs</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background:'none', border:`1px solid ${T.border}`, borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:12, color:T.textMid, fontFamily:'inherit' }}>Close ✕</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
                {[
                  { l:'Total SKUs',    v: selected.sku_count,                             c:T.a1 },
                  { l:'Total Units',   v: (selected.total_stock||0).toLocaleString(),      c:T.a3 },
                  { l:'Stock Value',   v: `₹${((selected.total_value||0)/100000).toFixed(2)}L`, c:T.green },
                  { l:'Low Stock',     v: selected.low_stock_count || 0,                   c:T.red },
                ].map(s => (
                  <div key={s.l} style={{ padding:'12px 14px', borderRadius:10, background: darkMode?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)', border:`1px solid ${s.c}28`, textAlign:'center' }}>
                    <div style={{ fontSize:'1.4rem', fontWeight:900, color:s.c }}>{s.v}</div>
                    <div style={{ fontSize:11, color:T.textSub, marginTop:3 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              {selected.monthly_in && (
                <>
                  <div style={{ fontWeight:700, fontSize:13, color:T.text, marginBottom:10 }}>Monthly Movement</div>
                  <LineChart series={[
                    { data: selected.monthly_in,  color:T.green, fill:true },
                    { data: selected.monthly_out, color:T.red,   dash:true },
                  ]} h={100} labels={months} />
                  <div style={{ display:'flex', gap:16, marginTop:8 }}>
                    {[{c:T.green,l:'IN'},{c:T.red,l:'OUT',dash:true}].map(lg => (
                      <div key={lg.l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <div style={{ width:14, height:2, background:lg.dash?'none':lg.c, backgroundImage:lg.dash?`repeating-linear-gradient(90deg,${lg.c} 0,${lg.c} 4px,transparent 4px,transparent 8px)`:'none', borderRadius:1 }} />
                        <span style={{ fontSize:11, color:T.textSub }}>Stock {lg.l}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Warehouse cards grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
            {filtered.map((w,i) => {
              const pct = utilPct(w);
              const uc  = utilColor(w);
              const isSelected = selected?.warehouse === w.warehouse;
              return (
                <motion.div key={w.warehouse||i} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.07 }}
                  onClick={() => setSelected(isSelected ? null : w)}
                  style={{ ...C, border:`1px solid ${isSelected ? T.a1 : uc}30`, cursor:'pointer', transition:'all .2s' }}>
                  {/* Card header */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:42, height:42, borderRadius:11, background:`${T.a1}18`, border:`1px solid ${T.a1}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🏭</div>
                      <div>
                        <div style={{ fontSize:15, fontWeight:800, color:T.text }}>{w.warehouse || 'Unassigned'}</div>
                        <div style={{ fontSize:11, color:T.textSub, marginTop:2 }}>{w.sku_count} SKU{w.sku_count!==1?'s':''}</div>
                      </div>
                    </div>
                    <span style={{ fontSize:11, padding:'4px 10px', borderRadius:99, background:`${uc}18`, color:uc, fontWeight:700, border:`1px solid ${uc}33` }}>
                      {pct>=80?'🔴 High':pct>=55?'🟡 Medium':'🟢 Low'} Load
                    </span>
                  </div>

                  {/* Stats */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                    {[
                      { l:'Total Units', v:(w.total_stock||0).toLocaleString(), c:T.a1 },
                      { l:'Value',       v:`₹${((w.total_value||0)/100000).toFixed(1)}L`, c:T.green },
                      { l:'SKUs',        v:w.sku_count||0, c:T.a2 },
                      { l:'Low Stock',   v:w.low_stock_count||0, c:T.red },
                    ].map(s => (
                      <div key={s.l} style={{ padding:'10px 12px', borderRadius:10, background: darkMode?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)', border:`1px solid ${T.border}` }}>
                        <div style={{ fontSize:16, fontWeight:900, color:s.c }}>{s.v}</div>
                        <div style={{ fontSize:10, color:T.textSub, marginTop:2 }}>{s.l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Utilization bar */}
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontSize:11, color:T.textSub }}>Relative Load</span>
                      <span style={{ fontSize:11, color:uc, fontWeight:700 }}>{pct}%</span>
                    </div>
                    <div style={{ height:5, borderRadius:99, background: darkMode?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)', overflow:'hidden' }}>
                      <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:.8, delay:i*.07 }}
                        style={{ height:'100%', background:`linear-gradient(90deg,${uc},${uc}bb)`, borderRadius:99 }} />
                    </div>
                  </div>

                  <div style={{ marginTop:12, fontSize:11, color:T.a1, fontWeight:600 }}>
                    {isSelected ? 'Click to collapse ↑' : 'Click for details →'}
                  </div>
                </motion.div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ ...C, textAlign:'center', padding:40, color:T.textSub, gridColumn:'1/-1' }}>
                No warehouses match "{search}"
              </div>
            )}
          </div>

          {/* Bar chart of all warehouses */}
          {warehouses.length > 1 && (
            <div style={{ ...C, marginTop:20 }}>
              <div style={{ fontWeight:800, fontSize:15, color:T.text, marginBottom:4 }}>Warehouse Utilization Comparison</div>
              <div style={{ fontSize:11, color:T.textSub, marginBottom:14 }}>Total units per warehouse</div>
              <BarChart
                data={warehouses.map(w => w.total_stock || 0)}
                colors={warehouses.map((_,i) => [T.a1,T.a2,T.a3,T.green,T.yellow,T.red][i%6])}
                labels={warehouses.map(w => w.warehouse?.length > 7 ? w.warehouse.slice(0,7) : w.warehouse)}
                h={140} />
            </div>
          )}
        </>
      )}

      {/* Add Warehouse Modal */}
      <AnimatePresence>
        {addModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}
            onClick={() => setAddModal(false)}>
            <motion.div initial={{ scale:.92, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:.92 }}
              onClick={e => e.stopPropagation()}
              style={{ background:T.bgCard, borderRadius:16, padding:28, width:440, boxShadow:'0 24px 64px rgba(0,0,0,.5)', border:`1px solid ${T.border}` }}>
              <div style={{ fontWeight:900, fontSize:16, color:T.text, marginBottom:6 }}>+ Add Warehouse</div>
              <div style={{ fontSize:12, color:T.textSub, marginBottom:20 }}>
                After adding, go to <strong style={{ color:T.a1 }}>Products</strong> and assign this warehouse name to your products.
              </div>
              {[
                { key:'name',     label:'Warehouse Name', placeholder:'e.g. WH-A, Mumbai Central' },
                { key:'location', label:'Location',       placeholder:'e.g. Mumbai, Maharashtra' },
                { key:'capacity', label:'Capacity (units)',placeholder:'e.g. 5000', type:'number' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textSub, marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>{f.label}</div>
                  <input type={f.type||'text'} value={newWH[f.key]} onChange={e => setNewWH(p => ({ ...p, [f.key]:e.target.value }))}
                    placeholder={f.placeholder}
                    style={{ width:'100%', padding:'10px 14px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit' }} />
                </div>
              ))}
              <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
                <button onClick={() => setAddModal(false)} style={{ padding:'10px 20px', borderRadius:9, border:`1px solid ${T.border}`, background:'transparent', cursor:'pointer', fontSize:13, color:T.textMid, fontFamily:'inherit' }}>Cancel</button>
                <button onClick={handleAddWarehouse} style={{ padding:'10px 24px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${T.a1},${T.a2})`, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                  Add Warehouse
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}