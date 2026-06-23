import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { warehouseService } from '../api/inventoryService'; // <-- new import, alongside your existing services
import { BarChart, LineChart } from '../components/Charts';

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const EMPTY_FORM = {
  name:'', code:'', address:'', city:'', state:'', country:'',
  manager_name:'', contact_number:'', email:'', max_capacity:'', status:'active',
};

export default function WarehousePage({ T, darkMode }) {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | inactive
  const [loadFilter, setLoadFilter] = useState('all');     // all | high | medium | low
  const [sortBy, setSortBy]         = useState('name');    // name | stock | value | capacity | utilization
  const [selected, setSelected]     = useState(null);
  const [modalMode, setModalMode]   = useState(null); // null | 'add' | 'edit'
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast]           = useState(null);

  const C = { background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 };
  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = async () => {
    setLoading(true); setError(null);
    const { data, error: err } = await warehouseService.getAll();
    if (err) { setError(err); setLoading(false); return; }
    setWarehouses(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ---- filtering / sorting ----
  const matchesLoad = (pct) => {
    if (loadFilter === 'high')   return pct >= 80;
    if (loadFilter === 'medium') return pct >= 55 && pct < 80;
    if (loadFilter === 'low')    return pct < 55;
    return true;
  };

  const filtered = warehouses
    .filter(w => {
      const q = search.toLowerCase();
      return !q || w.name?.toLowerCase().includes(q) || w.city?.toLowerCase().includes(q) || w.manager_name?.toLowerCase().includes(q);
    })
    .filter(w => statusFilter === 'all' || w.status === statusFilter)
    .filter(w => matchesLoad(w.utilization_pct || 0))
    .sort((a, b) => {
      if (sortBy === 'stock')       return (b.total_stock||0) - (a.total_stock||0);
      if (sortBy === 'value')       return (b.total_value||0) - (a.total_value||0);
      if (sortBy === 'capacity')    return (b.max_capacity||0) - (a.max_capacity||0);
      if (sortBy === 'utilization') return (b.utilization_pct||0) - (a.utilization_pct||0);
      return (a.name||'').localeCompare(b.name||'');
    });

  const utilColor = (pct) => pct >= 80 ? T.red : pct >= 55 ? T.yellow : T.green;

  const totalStock = warehouses.reduce((a,w) => a + (w.total_stock||0), 0);
  const totalValue = warehouses.reduce((a,w) => a + (w.total_value||0), 0);
  const totalSKUs  = warehouses.reduce((a,w) => a + (w.sku_count||0), 0);

  // ---- modal handlers ----
  const openAdd = () => { setForm(EMPTY_FORM); setModalMode('add'); };
  const openEdit = (w) => {
    setForm({
      name: w.name||'', code: w.code||'', address: w.address||'', city: w.city||'',
      state: w.state||'', country: w.country||'', manager_name: w.manager_name||'',
      contact_number: w.contact_number||'', email: w.email||'',
      max_capacity: w.max_capacity ?? '', status: w.status || 'active',
    });
    setModalMode('edit');
    setSelected(w);
  };
  const closeModal = () => { setModalMode(null); setForm(EMPTY_FORM); };

  const validateForm = () => {
    if (!form.name.trim()) return 'Warehouse name is required';
    if (!form.code.trim()) return 'Warehouse code is required';
    if (form.max_capacity === '' || isNaN(Number(form.max_capacity)) || Number(form.max_capacity) < 0) return 'Enter a valid maximum capacity';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Enter a valid email address';
    if (form.contact_number && form.contact_number.replace(/\D/g,'').length < 7) return 'Enter a valid contact number';
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) { showToast(validationError, 'error'); return; }

    setSaving(true);
    const payload = { ...form, max_capacity: Number(form.max_capacity) };

    const { data, error: err } = modalMode === 'edit'
      ? await warehouseService.update(selected.id, payload)
      : await warehouseService.create(payload);

    setSaving(false);

    if (err) { showToast(err, 'error'); return; }

    showToast(modalMode === 'edit' ? `Warehouse "${data.name}" updated` : `Warehouse "${data.name}" created`);
    closeModal();
    await load();
    if (modalMode === 'edit') setSelected(data);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error: err } = await warehouseService.delete(deleteTarget.id);
    if (err) { showToast(err, 'error'); setDeleteTarget(null); return; }
    showToast(`Warehouse "${deleteTarget.name}" deleted`);
    if (selected?.id === deleteTarget.id) setSelected(null);
    setDeleteTarget(null);
    await load();
  };

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
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:'1.4rem', fontWeight:900, color:T.text, letterSpacing:'-.03em' }}>Warehouses</h1>
          <p style={{ fontSize:13, color:T.textSub, marginTop:2 }}>
            {warehouses.length} warehouse{warehouses.length!==1?'s':''} · {totalSKUs} SKUs tracked
          </p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:13 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, city, manager…"
              style={{ padding:'9px 14px 9px 30px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, width:220, outline:'none', fontFamily:'inherit' }} />
            {search && <button onClick={() => setSearch('')} style={{ position:'absolute', right:9, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:12, color:T.textSub }}>✕</button>}
          </div>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding:'9px 12px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, fontFamily:'inherit', colorScheme: darkMode ? 'dark' : 'light' }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select value={loadFilter} onChange={e => setLoadFilter(e.target.value)}
            style={{ padding:'9px 12px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, fontFamily:'inherit', colorScheme: darkMode ? 'dark' : 'light' }}>
            <option value="all">All Load</option>
            <option value="high">High (&gt;80%)</option>
            <option value="medium">Medium (55-80%)</option>
            <option value="low">Low (&lt;55%)</option>
          </select>

          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding:'9px 12px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, fontFamily:'inherit', colorScheme: darkMode ? 'dark' : 'light' }}>
            <option value="name">Sort: Name</option>
            <option value="stock">Sort: Total Stock</option>
            <option value="value">Sort: Total Value</option>
            <option value="capacity">Sort: Capacity</option>
            <option value="utilization">Sort: Utilization</option>
          </select>

          <button onClick={load} style={{ padding:'9px 14px', borderRadius:9, border:`1px solid ${T.border}`, background:'transparent', color:T.textMid, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>🔄 Refresh</button>
          <button onClick={openAdd} style={{ padding:'9px 18px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${T.a1},${T.a2})`, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>+ Add Warehouse</button>
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
            Create your first warehouse to start tracking capacity and stock.
          </div>
          <button onClick={openAdd}
            style={{ padding:'10px 22px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${T.a1},${T.a2})`, color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>
            + Add Warehouse
          </button>
        </div>
      )}

      {!loading && !error && warehouses.length > 0 && (
        <>
          {/* Selected warehouse detail view */}
          {selected && (
            <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
              style={{ ...C, border:`1px solid ${T.a1}44`, marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
                <div>
                  <div style={{ fontSize:16, fontWeight:900, color:T.text }}>🏭 {selected.name}</div>
                  <div style={{ fontSize:12, color:T.textSub, marginTop:3 }}>
                    {selected.code} · {selected.sku_count} SKUs · {selected.status === 'active' ? '🟢 Active' : '⚪ Inactive'}
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => openEdit(selected)} style={{ background:'none', border:`1px solid ${T.border}`, borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:12, color:T.textMid, fontFamily:'inherit' }}>✏️ Edit</button>
                  <button onClick={() => setDeleteTarget(selected)} style={{ background:'none', border:`1px solid ${T.red}55`, borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:12, color:T.red, fontFamily:'inherit' }}>🗑 Delete</button>
                  <button onClick={() => setSelected(null)} style={{ background:'none', border:`1px solid ${T.border}`, borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:12, color:T.textMid, fontFamily:'inherit' }}>Close ✕</button>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
                {[
                  { l:'Total Products', v: selected.sku_count,                                   c:T.a1 },
                  { l:'Total Stock',    v: (selected.total_stock||0).toLocaleString(),            c:T.a3 },
                  { l:'Stock Value',    v: `₹${((selected.total_value||0)/100000).toFixed(2)}L`,  c:T.green },
                  { l:'Low Stock',      v: selected.low_stock_count || 0,                          c:T.red },
                  { l:'Max Capacity',   v: (selected.max_capacity||0).toLocaleString(),            c:T.a2 },
                  { l:'Available',      v: (selected.remaining_capacity||0).toLocaleString(),      c:T.green },
                  { l:'Utilization',    v: `${selected.utilization_pct||0}%`,                      c: utilColor(selected.utilization_pct||0) },
                  { l:'Manager',        v: selected.manager_name || '—',                           c:T.a1 },
                ].map(s => (
                  <div key={s.l} style={{ padding:'12px 14px', borderRadius:10, background: darkMode?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)', border:`1px solid ${s.c}28`, textAlign:'center' }}>
                    <div style={{ fontSize:'1.2rem', fontWeight:900, color:s.c }}>{s.v}</div>
                    <div style={{ fontSize:11, color:T.textSub, marginTop:3 }}>{s.l}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize:12, color:T.textSub, marginBottom: 16 }}>
                📍 {[selected.address, selected.city, selected.state, selected.country].filter(Boolean).join(', ') || 'No address on file'}
                {selected.updated_at && <span> · Last updated {new Date(selected.updated_at).toLocaleString()}</span>}
              </div>

              <div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontSize:11, color:T.textSub }}>Capacity Used</span>
                  <span style={{ fontSize:11, color: utilColor(selected.utilization_pct||0), fontWeight:700 }}>{selected.utilization_pct||0}%</span>
                </div>
                <div style={{ height:6, borderRadius:99, background: darkMode?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)', overflow:'hidden' }}>
                  <motion.div initial={{ width:0 }} animate={{ width:`${Math.min(selected.utilization_pct||0,100)}%` }} transition={{ duration:.8 }}
                    style={{ height:'100%', background:`linear-gradient(90deg,${utilColor(selected.utilization_pct||0)},${utilColor(selected.utilization_pct||0)}bb)`, borderRadius:99 }} />
                </div>
              </div>

              {selected.monthly_in && (
                <>
                  <div style={{ fontWeight:700, fontSize:13, color:T.text, marginBottom:10, marginTop:18 }}>Monthly Movement</div>
                  <LineChart series={[
                    { data: selected.monthly_in,  color:T.green, fill:true },
                    { data: selected.monthly_out, color:T.red,   dash:true },
                  ]} h={100} labels={months} />
                </>
              )}
            </motion.div>
          )}

          {/* Warehouse cards grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
            {filtered.map((w,i) => {
              const pct = Math.round(w.utilization_pct || 0);
              const uc  = utilColor(pct);
              const isSelected = selected?.id === w.id;
              return (
                <motion.div key={w.id} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.05 }}
                  style={{ ...C, border:`1px solid ${isSelected ? T.a1 : uc}30`, transition:'all .2s' }}>
                  <div onClick={() => setSelected(isSelected ? null : w)} style={{ cursor:'pointer' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ width:42, height:42, borderRadius:11, background:`${T.a1}18`, border:`1px solid ${T.a1}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🏭</div>
                        <div>
                          <div style={{ fontSize:15, fontWeight:800, color:T.text }}>{w.name}</div>
                          <div style={{ fontSize:11, color:T.textSub, marginTop:2 }}>{w.code} · {w.sku_count} SKU{w.sku_count!==1?'s':''}</div>
                        </div>
                      </div>
                      <span style={{ fontSize:11, padding:'4px 10px', borderRadius:99, background:`${uc}18`, color:uc, fontWeight:700, border:`1px solid ${uc}33` }}>
                        {pct>=80?'🔴 High':pct>=55?'🟡 Medium':'🟢 Low'} Load
                      </span>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                      {[
                        { l:'Current Stock', v:(w.current_capacity||0).toLocaleString(), c:T.a1 },
                        { l:'Value',         v:`₹${((w.total_value||0)/100000).toFixed(1)}L`, c:T.green },
                        { l:'Max Capacity',  v:(w.max_capacity||0).toLocaleString(), c:T.a2 },
                        { l:'Available',     v:(w.remaining_capacity||0).toLocaleString(), c:T.red },
                      ].map(s => (
                        <div key={s.l} style={{ padding:'10px 12px', borderRadius:10, background: darkMode?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)', border:`1px solid ${T.border}` }}>
                          <div style={{ fontSize:16, fontWeight:900, color:s.c }}>{s.v}</div>
                          <div style={{ fontSize:10, color:T.textSub, marginTop:2 }}>{s.l}</div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                        <span style={{ fontSize:11, color:T.textSub }}>Capacity Used</span>
                        <span style={{ fontSize:11, color:uc, fontWeight:700 }}>{pct}%</span>
                      </div>
                      <div style={{ height:5, borderRadius:99, background: darkMode?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)', overflow:'hidden' }}>
                        <motion.div initial={{ width:0 }} animate={{ width:`${Math.min(pct,100)}%` }} transition={{ duration:.8, delay:i*.05 }}
                          style={{ height:'100%', background:`linear-gradient(90deg,${uc},${uc}bb)`, borderRadius:99 }} />
                      </div>
                    </div>

                    <div style={{ marginTop:12, fontSize:11, color:T.a1, fontWeight:600 }}>
                      {isSelected ? 'Click to collapse ↑' : 'Click for details →'}
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div style={{ display:'flex', gap:8, marginTop:14, paddingTop:14, borderTop:`1px solid ${T.border}` }}>
                    <button onClick={() => openEdit(w)} style={{ flex:1, padding:'7px 0', borderRadius:8, border:`1px solid ${T.border}`, background:'transparent', color:T.textMid, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>✏️ Edit</button>
                    <button onClick={() => setDeleteTarget(w)} style={{ flex:1, padding:'7px 0', borderRadius:8, border:`1px solid ${T.red}44`, background:'transparent', color:T.red, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>🗑 Delete</button>
                  </div>
                </motion.div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ ...C, textAlign:'center', padding:40, color:T.textSub, gridColumn:'1/-1' }}>
                No warehouses match your filters
              </div>
            )}
          </div>

          {/* Bar chart of all warehouses */}
          {warehouses.length > 1 && (
            <div style={{ ...C, marginTop:20 }}>
              <div style={{ fontWeight:800, fontSize:15, color:T.text, marginBottom:4 }}>Warehouse Capacity Comparison</div>
              <div style={{ fontSize:11, color:T.textSub, marginBottom:14 }}>Current stock vs. capacity per warehouse</div>
              <BarChart
                data={warehouses.map(w => w.current_capacity || 0)}
                colors={warehouses.map(w => utilColor(w.utilization_pct || 0))}
                labels={warehouses.map(w => w.name?.length > 7 ? w.name.slice(0,7) : w.name)}
                h={140} />
            </div>
          )}
        </>
      )}

      {/* Add / Edit Warehouse Modal */}
      <AnimatePresence>
        {modalMode && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', overflowY:'auto', padding:20 }}
            onClick={closeModal}>
            <motion.div initial={{ scale:.92, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:.92 }}
              onClick={e => e.stopPropagation()}
              style={{ background:T.bgCard, borderRadius:16, padding:28, width:480, boxShadow:'0 24px 64px rgba(0,0,0,.5)', border:`1px solid ${T.border}` }}>
              <div style={{ fontWeight:900, fontSize:16, color:T.text, marginBottom:20 }}>
                {modalMode === 'edit' ? '✏️ Edit Warehouse' : '+ Add Warehouse'}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {[
                  { key:'name', label:'Warehouse Name *', placeholder:'e.g. Mumbai Central' },
                  { key:'code', label:'Warehouse Code *', placeholder:'e.g. WH-A' },
                  { key:'address', label:'Address', placeholder:'Street address', full:true },
                  { key:'city', label:'City', placeholder:'e.g. Mumbai' },
                  { key:'state', label:'State', placeholder:'e.g. Maharashtra' },
                  { key:'country', label:'Country', placeholder:'e.g. India' },
                  { key:'manager_name', label:'Manager Name', placeholder:'e.g. Rahul Sharma' },
                  { key:'contact_number', label:'Contact Number', placeholder:'e.g. 9876543210' },
                  { key:'email', label:'Email', placeholder:'manager@company.com' },
                  { key:'max_capacity', label:'Max Capacity (units) *', placeholder:'e.g. 5000', type:'number' },
                ].map(f => (
                  <div key={f.key} style={{ gridColumn: f.full ? '1 / -1' : 'auto' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:T.textSub, marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>{f.label}</div>
                    <input type={f.type||'text'} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]:e.target.value }))}
                      placeholder={f.placeholder}
                      style={{ width:'100%', padding:'10px 14px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
                  </div>
                ))}

                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textSub, marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>Status</div>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status:e.target.value }))}
                    style={{ width:'100%', padding:'10px 14px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit', colorScheme: darkMode ? 'dark' : 'light' }}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display:'flex', gap:10, marginTop:24, justifyContent:'flex-end' }}>
                <button onClick={closeModal} style={{ padding:'10px 20px', borderRadius:9, border:`1px solid ${T.border}`, background:'transparent', cursor:'pointer', fontSize:13, color:T.textMid, fontFamily:'inherit' }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ padding:'10px 24px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${T.a1},${T.a2})`, color:'#fff', fontWeight:700, fontSize:13, cursor: saving ? 'default' : 'pointer', fontFamily:'inherit', opacity: saving ? .7 : 1 }}>
                  {saving ? 'Saving…' : (modalMode === 'edit' ? 'Save Changes' : 'Add Warehouse')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}
            onClick={() => setDeleteTarget(null)}>
            <motion.div initial={{ scale:.92, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:.92 }}
              onClick={e => e.stopPropagation()}
              style={{ background:T.bgCard, borderRadius:16, padding:28, width:380, boxShadow:'0 24px 64px rgba(0,0,0,.5)', border:`1px solid ${T.border}` }}>
              <div style={{ fontWeight:900, fontSize:16, color:T.text, marginBottom:10 }}>Delete "{deleteTarget.name}"?</div>
              <div style={{ fontSize:13, color:T.textSub, marginBottom:22 }}>
                This can't be undone. {deleteTarget.sku_count > 0 ? `This warehouse has ${deleteTarget.sku_count} product(s) assigned — you'll need to reassign them first.` : ''}
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={() => setDeleteTarget(null)} style={{ padding:'10px 20px', borderRadius:9, border:`1px solid ${T.border}`, background:'transparent', cursor:'pointer', fontSize:13, color:T.textMid, fontFamily:'inherit' }}>Cancel</button>
                <button onClick={confirmDelete} style={{ padding:'10px 24px', borderRadius:9, border:'none', background:T.red, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}