import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { transactionService, inventoryService, warehouseService } from '../api/inventoryService';

const EMPTY_FORM = { type:'IN', sku:'', product:'', qty:'', value:'', warehouse:'', note:'' };

// isAdmin controls: delete transactions (future), see all users' transactions vs own
// Both admin and user can LOG a transaction (stock in/out is part of daily user work)
// Admin sees all transactions; user sees all but cannot delete
export default function TransactionsPage({ T, darkMode, isAdmin = false }) {
  const [txns, setTxns]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);

  // Real products & warehouses to populate dropdowns — no more free-typing SKUs/names.
  const [products, setProducts]     = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const card = { background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:22 };
  const typeColor = (t) => t==='IN'?T.green:t==='OUT'?T.red:T.a3;
  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = async () => {
    setLoading(true); setError(null);
    const { data, error: err } = await transactionService.getAll();
    if (err) { setError(err); setLoading(false); return; }
    setTxns(Array.isArray(data) ? data : data?.transactions || []);
    setLoading(false);
  };

  const loadMeta = async () => {
    const [prodRes, whRes] = await Promise.all([
      inventoryService.getAll(),
      warehouseService.getAll(),
    ]);
    setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
    setWarehouses(Array.isArray(whRes.data) ? whRes.data : []);
  };

  useEffect(() => { load(); loadMeta(); }, []);

  // Picking a product auto-fills its name and its current warehouse (still editable after).
  const handleSelectProduct = (sku) => {
    const p = products.find(p => p.sku === sku);
    setForm(prev => ({
      ...prev,
      sku,
      product: p?.name || '',
      warehouse: p?.warehouse ? p.warehouse : prev.warehouse,
    }));
  };

  const filtered = txns.filter(t => {
    const matchType   = filter === 'all' || t.type === filter;
    const matchSearch = t.sku?.toLowerCase().includes(search.toLowerCase()) || t.product?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const totalIn  = txns.filter(t => t.type==='IN').reduce((a,t)  => a + (t.value||0), 0);
  const totalOut = txns.filter(t => t.type==='OUT').reduce((a,t) => a + (t.value||0), 0);

  const handleAdd = async () => {
    if (!form.sku || !form.qty) { showToast('Product and Qty are required', 'error'); return; }
    setSaving(true);
    const payload = { ...form, qty: Number(form.qty), value: Number(form.value) };
    const { data, error: err } = await transactionService.create(payload);
    if (err) { showToast(err, 'error'); setSaving(false); return; }
    showToast('Transaction recorded!');
    setSaving(false); setModal(false); setForm(EMPTY_FORM); load();
  };

  return (
    <div>
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
            style={{ position:'fixed', top:20, right:20, zIndex:9999, padding:'12px 20px', borderRadius:10, background: toast.type==='error'?T.red:T.green, color:'#fff', fontWeight:700, fontSize:14, boxShadow:'0 8px 24px rgba(0,0,0,.3)' }}>
            {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:'1.4rem', fontWeight:900, color:T.text, letterSpacing:'-.03em' }}>
            {isAdmin ? 'Transactions' : 'My Transactions'}
          </h1>
          <p style={{ fontSize:13, color:T.textSub, marginTop:2 }}>
            {isAdmin ? 'All stock movements — in, out, transfers' : 'Log and view your stock movements'}
          </p>
        </div>
        <button onClick={() => setModal(true)} style={{ padding:'9px 18px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${T.a1},${T.a3})`, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
          + Log Transaction
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        {[
          { l:'Total', v:txns.length, c:T.a1 },
          { l:'Stock In', v:txns.filter(t=>t.type==='IN').length, c:T.green },
          { l:'Stock Out', v:txns.filter(t=>t.type==='OUT').length, c:T.red },
          { l:'Transfers', v:txns.filter(t=>t.type==='TRF').length, c:T.a3 },
        ].map(s => (
          <div key={s.l} style={{ ...card, border:`1px solid ${s.c}28`, textAlign:'center', padding:16 }}>
            <div style={{ fontSize:'1.8rem', fontWeight:900, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:12, color:T.textSub, marginTop:4 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
        <div style={{ ...card, border:`1px solid ${T.green}28`, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px' }}>
          <div>
            <div style={{ fontSize:11, color:T.textSub, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em' }}>Total Value IN</div>
            <div style={{ fontSize:'1.5rem', fontWeight:900, color:T.green, marginTop:4 }}>₹{totalIn.toLocaleString()}</div>
          </div>
          <span style={{ fontSize:28 }}>📦</span>
        </div>
        <div style={{ ...card, border:`1px solid ${T.red}28`, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px' }}>
          <div>
            <div style={{ fontSize:11, color:T.textSub, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em' }}>Total Value OUT</div>
            <div style={{ fontSize:'1.5rem', fontWeight:900, color:T.red, marginTop:4 }}>₹{totalOut.toLocaleString()}</div>
          </div>
          <span style={{ fontSize:28 }}>🚚</span>
        </div>
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        {[{id:'all',l:'All'},{id:'IN',l:'Stock In'},{id:'OUT',l:'Stock Out'},{id:'TRF',l:'Transfers'}].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{ padding:'6px 14px', borderRadius:99, border:`1px solid ${filter===f.id?T.a1:T.border}`, background: filter===f.id?`${T.a1}18`:'transparent', color: filter===f.id?T.a1:T.textMid, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            {f.l}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search SKU or product…"
          style={{ marginLeft:'auto', padding:'6px 14px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit', width:200 }} />
      </div>

      <div style={card}>
        {loading && <div style={{ textAlign:'center', padding:40, color:T.textSub }}>Loading transactions…</div>}
        {error   && <div style={{ textAlign:'center', padding:40, color:T.red }}>⚠ {error}</div>}
        {!loading && !error && (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                {['Type','SKU','Product','Qty','Value (₹)','Warehouse','User','Date','Note',
                  ...(isAdmin ? ['Actions'] : [])
                ].map(h => (
                  <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:11, fontWeight:700, color:T.textSub, letterSpacing:'.05em', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t,i) => (
                <motion.tr key={t.id||i} initial={{ opacity:0 }} animate={{ opacity:1 }} className="row-hover"
                  style={{ borderBottom:`1px solid ${T.border}`, transition:'background .15s' }}>
                  <td style={{ padding:'12px 12px' }}>
                    <span style={{ fontSize:11, padding:'3px 10px', borderRadius:99, background:`${typeColor(t.type)}18`, color:typeColor(t.type), fontWeight:800, border:`1px solid ${typeColor(t.type)}33` }}>
                      {t.type==='IN'?'↓ IN':t.type==='OUT'?'↑ OUT':'⇄ TRF'}
                    </span>
                  </td>
                  <td style={{ padding:'12px 12px', fontSize:12, fontWeight:700, color:T.a2 }}>{t.sku}</td>
                  <td style={{ padding:'12px 12px', fontSize:13, color:T.text }}>{t.product}</td>
                  <td style={{ padding:'12px 12px', fontSize:13, fontWeight:700, color:T.text }}>{t.qty}</td>
                  <td style={{ padding:'12px 12px', fontSize:13, fontWeight:600, color:typeColor(t.type) }}>₹{Number(t.value||0).toLocaleString()}</td>
                  <td style={{ padding:'12px 12px', fontSize:12, color:T.textMid }}>{t.warehouse}</td>
                  <td style={{ padding:'12px 12px', fontSize:12, color:T.textMid }}>{t.user}</td>
                  <td style={{ padding:'12px 12px', fontSize:12, color:T.textSub }}>{t.date}</td>
                  <td style={{ padding:'12px 12px', fontSize:12, color:T.textSub }}>{t.note}</td>
                  {isAdmin && (
                    <td style={{ padding:'12px 12px' }}>
                      <span style={{ fontSize:11, color:T.textSub }}>—</span>
                    </td>
                  )}
                </motion.tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={isAdmin ? 10 : 9} style={{ textAlign:'center', padding:40, color:T.textSub }}>No transactions yet. Log your first stock movement above.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Log Transaction Modal — available to both admin and user */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}
            onClick={() => setModal(false)}>
            <motion.div initial={{ scale:.92, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:.92, opacity:0 }}
              onClick={e => e.stopPropagation()}
              style={{ background:T.bgCard, borderRadius:16, padding:28, width:460, boxShadow:'0 24px 64px rgba(0,0,0,.5)', border:`1px solid ${T.border}` }}>
              <div style={{ fontWeight:900, fontSize:16, color:T.text, marginBottom:20 }}>+ Log Transaction</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textSub, marginBottom:6, textTransform:'uppercase' }}>Type</div>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type:e.target.value }))}
                    style={{ width:'100%', padding:'10px 14px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'#0D1526':'#fff', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit', colorScheme: darkMode ? 'dark' : 'light' }}>
                    <option style={{ background: T.bgCard, color: T.text }} value="IN">Stock In</option>
                    <option style={{ background: T.bgCard, color: T.text }} value="OUT">Stock Out</option>
                    <option style={{ background: T.bgCard, color: T.text }} value="TRF">Transfer</option>
                  </select>
                </div>

                {/* Product dropdown — replaces free-typed SKU. Selecting a product auto-fills Product Name. */}
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textSub, marginBottom:6, textTransform:'uppercase' }}>Product (SKU)</div>
                  <select value={form.sku} onChange={e => handleSelectProduct(e.target.value)}
                    style={{ width:'100%', padding:'10px 14px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit', colorScheme: darkMode ? 'dark' : 'light' }}>
                    <option style={{ background: T.bgCard, color: T.text }} value="">{products.length ? 'Select a product…' : 'No products found'}</option>
                    {products.map(p => (
                      <option style={{ background: T.bgCard, color: T.text }} key={p.sku} value={p.sku}>{p.sku} — {p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textSub, marginBottom:6, textTransform:'uppercase' }}>Product Name</div>
                  <input value={form.product} readOnly placeholder="Auto-filled from product"
                    style={{ width:'100%', padding:'10px 14px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.02)':'rgba(0,0,0,0.02)', color:T.textSub, fontSize:13, outline:'none', fontFamily:'inherit', cursor:'not-allowed' }} />
                </div>

                {/* Warehouse dropdown — sourced from real warehouses instead of free text */}
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textSub, marginBottom:6, textTransform:'uppercase' }}>Warehouse</div>
                  <select value={form.warehouse} onChange={e => setForm(p => ({ ...p, warehouse:e.target.value }))}
                    style={{ width:'100%', padding:'10px 14px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit', colorScheme: darkMode ? 'dark' : 'light' }}>
                    <option style={{ background: T.bgCard, color: T.text }} value="">{warehouses.length ? 'Select a warehouse…' : 'No warehouses found'}</option>
                    {warehouses.map(w => (
                      <option style={{ background: T.bgCard, color: T.text }} key={w.id} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>

                {[
                  { key:'qty', label:'Qty', placeholder:'50', type:'number' },
                  { key:'value', label:'Value (₹)', placeholder:'10000', type:'number' },
                ].map(f => (
                  <div key={f.key}>
                    <div style={{ fontSize:11, fontWeight:700, color:T.textSub, marginBottom:6, textTransform:'uppercase' }}>{f.label}</div>
                    <input type={f.type||'text'} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]:e.target.value }))} placeholder={f.placeholder}
                      style={{ width:'100%', padding:'10px 14px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit' }} />
                  </div>
                ))}
                <div style={{ gridColumn:'span 2' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textSub, marginBottom:6, textTransform:'uppercase' }}>Note (optional)</div>
                  <input value={form.note} onChange={e => setForm(p => ({ ...p, note:e.target.value }))} placeholder="e.g. Restock from supplier"
                    style={{ width:'100%', padding:'10px 14px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit' }} />
                </div>
              </div>
              <div style={{ display:'flex', gap:10, marginTop:22, justifyContent:'flex-end' }}>
                <button onClick={() => setModal(false)} style={{ padding:'10px 20px', borderRadius:9, border:`1px solid ${T.border}`, background:'transparent', cursor:'pointer', fontSize:13, color:T.textMid, fontFamily:'inherit' }}>Cancel</button>
                <button onClick={handleAdd} disabled={saving} style={{ padding:'10px 24px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${T.a1},${T.a3})`, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', opacity: saving?.7:1 }}>
                  {saving ? 'Saving…' : 'Log Transaction'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}