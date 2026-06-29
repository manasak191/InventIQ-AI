import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { transactionService, inventoryService } from '../api/inventoryService';

const EMPTY_FORM = { type:'IN', sku:'', product:'', qty:'', value:'', warehouse:'', note:'' };

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

  // SKU lookup state
  const [skuLookup, setSkuLookup]     = useState('');
  const [skuResults, setSkuResults]   = useState([]);
  const [skuLoading, setSkuLoading]   = useState(false);
  const [skuDropdown, setSkuDropdown] = useState(false);
  const skuTimer = useRef(null);
  const skuRef   = useRef(null);

  const card = { background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:22 };
  const typeColor = t => t==='IN'?T.green:t==='OUT'?T.red:T.a3;
  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(()=>setToast(null),3000); };

  const load = async () => {
    setLoading(true); setError(null);
    const { data, error:err } = await transactionService.getAll();
    if (err) { setError(err); setLoading(false); return; }
    setTxns(Array.isArray(data) ? data : data?.transactions || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Close SKU dropdown on outside click
  useEffect(() => {
    const fn = e => { if (skuRef.current && !skuRef.current.contains(e.target)) setSkuDropdown(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // Debounced SKU search
  const handleSkuInput = (val) => {
    setSkuLookup(val);
    setForm(p => ({ ...p, sku: val }));
    clearTimeout(skuTimer.current);
    if (!val.trim() || val.length < 2) { setSkuResults([]); setSkuDropdown(false); return; }
    skuTimer.current = setTimeout(async () => {
      setSkuLoading(true);
      const { data } = await inventoryService.getAll({ search: val });
      const items = Array.isArray(data) ? data : data?.products || data?.items || [];
      setSkuResults(items.slice(0, 8));
      setSkuDropdown(items.length > 0);
      setSkuLoading(false);
    }, 300);
  };

  // When user picks a product from dropdown — auto-fill all fields
  const handleSkuSelect = (product) => {
    setSkuLookup(product.sku);
    setForm(p => ({
      ...p,
      sku:       product.sku,
      product:   product.name,
      warehouse: product.warehouse || p.warehouse,
      // Auto-calculate value: qty * price (will update when qty changes)
      value:     p.qty ? String(Number(p.qty) * product.price) : '',
      _price:    product.price,   // hidden — used for auto-value calc
    }));
    setSkuResults([]);
    setSkuDropdown(false);
  };

  // When qty changes, auto-recalculate value if we know the price
  const handleQtyChange = (val) => {
    setForm(p => ({
      ...p,
      qty:   val,
      value: p._price && val ? String(Number(val) * p._price) : p.value,
    }));
  };

  const filtered = txns.filter(t => {
    const matchType   = filter==='all' || t.type===filter;
    const matchSearch = t.sku?.toLowerCase().includes(search.toLowerCase()) ||
                        t.product?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const totalIn  = txns.filter(t=>t.type==='IN').reduce((a,t) => a+(t.value||0), 0);
  const totalOut = txns.filter(t=>t.type==='OUT').reduce((a,t) => a+(t.value||0), 0);

  const openModal = () => { setForm(EMPTY_FORM); setSkuLookup(''); setSkuResults([]); setModal(true); };

  const handleAdd = async () => {
    if (!form.sku)  { showToast('SKU is required', 'error'); return; }
    if (!form.qty)  { showToast('Quantity is required', 'error'); return; }
    setSaving(true);
    const { _price, ...payload } = form;   // strip internal _price field
    const { error:err } = await transactionService.create({
      ...payload,
      qty:   Number(form.qty),
      value: Number(form.value) || 0,
    });
    if (err) { showToast(err, 'error'); setSaving(false); return; }
    showToast('Transaction recorded!');
    setSaving(false); setModal(false); setForm(EMPTY_FORM); setSkuLookup(''); load();
  };

  // Input style helper
  const inp = { width:'100%', padding:'10px 14px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit' };
  const lbl = { fontSize:11, fontWeight:700, color:T.textSub, marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em', display:'block' };

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
          <h1 style={{ fontSize:'1.4rem', fontWeight:900, color:T.text, letterSpacing:'-.03em' }}>
            {isAdmin ? 'Transactions' : 'My Transactions'}
          </h1>
          <p style={{ fontSize:13, color:T.textSub, marginTop:2 }}>
            {isAdmin ? 'All stock movements — IN, OUT, transfers' : 'Log and view your stock movements'}
          </p>
        </div>
        <button onClick={openModal}
          style={{ padding:'9px 20px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${T.a1},${T.a3})`, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
          + Log Transaction
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        {[
          { l:'Total',      v:txns.length,                                c:T.a1 },
          { l:'Stock IN',   v:txns.filter(t=>t.type==='IN').length,       c:T.green },
          { l:'Stock OUT',  v:txns.filter(t=>t.type==='OUT').length,      c:T.red },
          { l:'Transfers',  v:txns.filter(t=>t.type==='TRF').length,      c:T.a3 },
        ].map(s => (
          <div key={s.l} style={{ ...card, border:`1px solid ${s.c}28`, textAlign:'center', padding:16 }}>
            <div style={{ fontSize:'1.8rem', fontWeight:900, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:12, color:T.textSub, marginTop:4 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Value summary */}
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

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        {[{id:'all',l:'All'},{id:'IN',l:'Stock In'},{id:'OUT',l:'Stock Out'},{id:'TRF',l:'Transfers'}].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{ padding:'6px 14px', borderRadius:99, border:`1px solid ${filter===f.id?T.a1:T.border}`, background:filter===f.id?`${T.a1}18`:'transparent', color:filter===f.id?T.a1:T.textMid, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            {f.l}
          </button>
        ))}
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search SKU or product…"
          style={{ marginLeft:'auto', padding:'6px 14px', borderRadius:9, border:`1px solid ${T.border}`, background:darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit', width:200 }} />
      </div>

      {/* Table */}
      <div style={card}>
        {loading && <div style={{ textAlign:'center', padding:40, color:T.textSub }}>Loading transactions…</div>}
        {error   && <div style={{ textAlign:'center', padding:40, color:T.red }}>⚠ {error}</div>}
        {!loading && !error && (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                {['Type','SKU','Product','Qty','Value (₹)','Warehouse','User','Date','Note'].map(h => (
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
                </motion.tr>
              ))}
              {filtered.length===0 && !loading && (
                <tr><td colSpan={9} style={{ textAlign:'center', padding:40, color:T.textSub }}>
                  No transactions yet. Click "+ Log Transaction" to record your first movement.
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ── LOG TRANSACTION MODAL ── */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}
            onClick={() => setModal(false)}>
            <motion.div initial={{ scale:.93, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:.93, opacity:0 }}
              onClick={e=>e.stopPropagation()}
              style={{ background:T.bgCard, borderRadius:18, padding:32, width:540, boxShadow:'0 24px 64px rgba(0,0,0,.55)', border:`1px solid ${T.border}`, maxHeight:'90vh', overflowY:'auto' }}>

              <div style={{ fontWeight:900, fontSize:18, color:T.text, marginBottom:6 }}>+ Log Transaction</div>
              <div style={{ fontSize:12, color:T.textSub, marginBottom:24 }}>Type a SKU or product name to auto-fill details from the database.</div>

              {/* Transaction type */}
              <div style={{ marginBottom:20 }}>
                <label style={lbl}>Transaction Type</label>
                <div style={{ display:'flex', gap:10 }}>
                  {[{v:'IN',l:'📥 Stock In',c:T.green},{v:'OUT',l:'📤 Stock Out',c:T.red},{v:'TRF',l:'⇄ Transfer',c:T.a3}].map(opt => (
                    <button key={opt.v} onClick={() => setForm(p=>({...p,type:opt.v}))}
                      style={{ flex:1, padding:'10px', borderRadius:10, border:`2px solid ${form.type===opt.v?opt.c:T.border}`, background:form.type===opt.v?`${opt.c}14`:'transparent', color:form.type===opt.v?opt.c:T.textMid, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', transition:'all .18s' }}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* SKU search — auto-fetches from DB */}
              <div style={{ marginBottom:20 }} ref={skuRef}>
                <label style={lbl}>SKU / Product Search <span style={{ color:T.a1, fontWeight:500, textTransform:'none', letterSpacing:0 }}>— type to search your inventory</span></label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:14, pointerEvents:'none' }}>🔍</span>
                  <input
                    value={skuLookup}
                    onChange={e => handleSkuInput(e.target.value)}
                    onFocus={() => skuResults.length > 0 && setSkuDropdown(true)}
                    placeholder="e.g. SKU-001 or Wireless Earbuds…"
                    style={{ ...inp, paddingLeft:36 }}
                    autoFocus
                  />
                  {skuLoading && (
                    <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontSize:12, color:T.textSub }}>Searching…</span>
                  )}

                  {/* Dropdown */}
                  <AnimatePresence>
                    {skuDropdown && skuResults.length > 0 && (
                      <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                        style={{ position:'absolute', top:'100%', left:0, right:0, background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:12, boxShadow:'0 16px 40px rgba(0,0,0,.4)', zIndex:200, overflow:'hidden', marginTop:4 }}>
                        {skuResults.map((p, i) => (
                          <button key={p.id||i} onClick={() => handleSkuSelect(p)}
                            style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 16px', border:'none', background:'transparent', cursor:'pointer', fontFamily:'inherit', borderBottom:`1px solid ${T.border}`, textAlign:'left' }}>
                            <div style={{ width:36, height:36, borderRadius:9, background:`${T.a1}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>📦</div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:13, fontWeight:700, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                              <div style={{ fontSize:11, color:T.textSub, marginTop:1 }}>
                                SKU: {p.sku} · Stock: <span style={{ color: p.stock<=p.reorder_point?T.red:T.green, fontWeight:700 }}>{p.stock}</span> · ₹{p.price?.toLocaleString()} · {p.warehouse||'No warehouse'}
                              </div>
                            </div>
                            <div style={{ textAlign:'right', flexShrink:0 }}>
                              <div style={{ fontSize:11, padding:'2px 8px', borderRadius:99, background:`${p.status==='critical'?T.red:p.status==='low'?T.yellow:T.green}18`, color:p.status==='critical'?T.red:p.status==='low'?T.yellow:T.green, fontWeight:700 }}>
                                {p.status==='critical'?'🚨 Critical':p.status==='low'?'⚠️ Low':'✅ OK'}
                              </div>
                            </div>
                          </button>
                        ))}
                        <div style={{ padding:'8px 16px', fontSize:11, color:T.textSub, borderTop:`1px solid ${T.border}` }}>
                          Click a product to auto-fill all fields
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Auto-filled fields */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                {/* Product name — auto-filled, editable */}
                <div style={{ gridColumn:'span 2' }}>
                  <label style={lbl}>Product Name <span style={{ color:T.a3, fontWeight:500, textTransform:'none' }}>— auto-filled</span></label>
                  <input value={form.product} onChange={e=>setForm(p=>({...p,product:e.target.value}))}
                    placeholder="Auto-filled when you select a product"
                    style={{ ...inp, background: form.product?(darkMode?'rgba(0,212,180,0.08)':'rgba(0,168,150,0.06)'):inp.background, borderColor: form.product?T.a3:T.border }} />
                </div>

                {/* Qty */}
                <div>
                  <label style={lbl}>Quantity <span style={{ color:T.red, fontWeight:900 }}>*</span></label>
                  <input type="number" min="1" value={form.qty} onChange={e=>handleQtyChange(e.target.value)}
                    placeholder="e.g. 50"
                    style={inp} />
                </div>

                {/* Value — auto-calculated */}
                <div>
                  <label style={lbl}>Value (₹) <span style={{ color:T.a3, fontWeight:500, textTransform:'none' }}>— auto-calculated</span></label>
                  <input type="number" min="0" value={form.value} onChange={e=>setForm(p=>({...p,value:e.target.value}))}
                    placeholder="Auto = qty × price"
                    style={{ ...inp, background: form._price?(darkMode?'rgba(0,212,180,0.08)':'rgba(0,168,150,0.06)'):inp.background, borderColor: form._price?T.a3:T.border }} />
                </div>

                {/* Warehouse — auto-filled, editable */}
                <div>
                  <label style={lbl}>Warehouse <span style={{ color:T.a3, fontWeight:500, textTransform:'none' }}>— auto-filled</span></label>
                  <input value={form.warehouse} onChange={e=>setForm(p=>({...p,warehouse:e.target.value}))}
                    placeholder="e.g. WH-A"
                    style={{ ...inp, background: form.warehouse?(darkMode?'rgba(0,212,180,0.08)':'rgba(0,168,150,0.06)'):inp.background, borderColor: form.warehouse?T.a3:T.border }} />
                </div>

                {/* Note */}
                <div>
                  <label style={lbl}>Note (optional)</label>
                  <input value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))}
                    placeholder="e.g. Restock from supplier"
                    style={inp} />
                </div>
              </div>

              {/* Auto-fill status banner */}
              {form.product && (
                <div style={{ padding:'10px 14px', borderRadius:10, background:`${T.a3}0E`, border:`1px solid ${T.a3}33`, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:16 }}>✅</span>
                  <div style={{ fontSize:12, color:T.a3 }}>
                    <strong>{form.product}</strong> selected · SKU: {form.sku} · Warehouse: {form.warehouse||'—'} · Value auto-calculated from price × qty
                  </div>
                </div>
              )}

              {/* Footer */}
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:4 }}>
                <button onClick={()=>setModal(false)}
                  style={{ padding:'11px 22px', borderRadius:10, border:`1px solid ${T.border}`, background:'transparent', cursor:'pointer', fontSize:13, color:T.textMid, fontFamily:'inherit' }}>
                  Cancel
                </button>
                <button onClick={handleAdd} disabled={saving || !form.sku || !form.qty}
                  style={{ padding:'11px 28px', borderRadius:10, border:'none', background: (saving||!form.sku||!form.qty)?T.border:`linear-gradient(135deg,${T.a1},${T.a3})`, color: (saving||!form.sku||!form.qty)?T.textSub:'#fff', fontWeight:700, fontSize:13, cursor:(saving||!form.sku||!form.qty)?'not-allowed':'pointer', fontFamily:'inherit', opacity: saving?.7:1 }}>
                  {saving ? 'Saving…' : 'Log Transaction ✓'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}