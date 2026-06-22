import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryService, notificationService } from '../api/inventoryService';


const EMPTY_FORM = { sku:'', name:'', category:'', stock:'', reorder_point:'', price:'', warehouse:'' };

export default function ProductsPage({ T, darkMode }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [editId, setEditId]   = useState(null);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);

  const card = { background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: 22 };
  const sc = (s) => s === 'critical' ? T.red : s === 'low' ? T.yellow : T.green;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await inventoryService.getAll();
    if (err) { setError(err); setLoading(false); return; }
    setItems(Array.isArray(data) ? data : data?.items || data?.products || []);
    setLoading(false);

    // Auto-send low stock alert email to admin if any critical items exist
    const { data: lowData } = await inventoryService.getLowStock();
    const lowItems = Array.isArray(lowData) ? lowData : [];
    if (lowItems.length > 0) {
      const ids = lowItems.map(i => i.id).filter(Boolean);
      if (ids.length > 0) await notificationService.sendLowStockAlert(ids);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter(item => {
    const matchSearch = item.name?.toLowerCase().includes(search.toLowerCase()) || item.sku?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || item.status === filter;
    return matchSearch && matchFilter;
  });

  const openAdd  = () => { setForm(EMPTY_FORM); setEditId(null); setModal('add'); };
  const openEdit = (item) => {
    setForm({ sku: item.sku, name: item.name, category: item.category || '', stock: item.stock, reorder_point: item.reorder_point, price: item.price, warehouse: item.warehouse || '' });
    setEditId(item.id); setModal('edit');
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, stock: Number(form.stock), reorder_point: Number(form.reorder_point), price: Number(form.price) };
    const { data, error: err } = modal === 'add'
      ? await inventoryService.create(payload)
      : await inventoryService.update(editId, payload);
    if (err) { showToast(err, 'error'); setSaving(false); return; }
    showToast(modal === 'add' ? 'Product added!' : 'Product updated!');
    setSaving(false); setModal(null); load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    const { error: err } = await inventoryService.delete(id);
    if (err) { showToast(err, 'error'); return; }
    showToast('Product deleted!'); load();
  };

  const handleExport = () => inventoryService.exportCSV();

  return (
    <div>
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
            style={{ position:'fixed', top:20, right:20, zIndex:9999, padding:'12px 20px', borderRadius:10, background: toast.type==='error' ? T.red : T.green, color:'#fff', fontWeight:700, fontSize:14, boxShadow:'0 8px 24px rgba(0,0,0,.3)' }}>
            {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:'1.4rem', fontWeight:900, color:T.text, letterSpacing:'-.03em' }}>Products & Inventory</h1>
          <p style={{ fontSize:13, color:T.textSub, marginTop:2 }}>{items.length} SKUs across all warehouses</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={handleExport} style={{ padding:'9px 18px', borderRadius:9, border:`1px solid ${T.border}`, background:'transparent', color:T.textMid, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>📤 Export CSV</button>
          <button onClick={openAdd} style={{ padding:'9px 18px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${T.a1},${T.a2})`, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>+ Add Product</button>
        </div>
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        {[
          { l:'All', v:items.length, id:'all', c:T.a1 },
          { l:'Critical', v:items.filter(i=>i.status==='critical').length, id:'critical', c:T.red },
          { l:'Low Stock', v:items.filter(i=>i.status==='low').length, id:'low', c:T.yellow },
          { l:'Healthy', v:items.filter(i=>i.status==='ok').length, id:'ok', c:T.green },
        ].map(s => (
          <button key={s.id} onClick={() => setFilter(s.id)}
            style={{ padding:'6px 14px', borderRadius:99, background: filter===s.id ? `${s.c}22` : `${s.c}0E`, border:`1px solid ${filter===s.id ? s.c : s.c+'33'}`, display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontFamily:'inherit' }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:s.c }} />
            <span style={{ fontSize:12, fontWeight:700, color:s.c }}>{s.l}</span>
            <span style={{ fontSize:12, color:T.textSub }}>({s.v})</span>
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search SKU or name…"
          style={{ marginLeft:'auto', padding:'6px 14px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit', width:200 }} />
      </div>

      <div style={card}>
        {loading && <div style={{ textAlign:'center', padding:40, color:T.textSub }}>Loading inventory…</div>}
        {error  && <div style={{ textAlign:'center', padding:40, color:T.red }}>⚠ {error} — make sure the backend is running at http://127.0.0.1:8000</div>}
        {!loading && !error && (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                {['SKU','Product','Category','Stock','Reorder Pt','Price','Warehouse','Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:11, fontWeight:700, color:T.textSub, letterSpacing:'.05em', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className="row-hover" style={{ borderBottom:`1px solid ${T.border}`, transition:'background .15s' }}>
                  <td style={{ padding:'12px 12px', fontSize:12, fontWeight:700, color:T.a2 }}>{item.sku}</td>
                  <td style={{ padding:'12px 12px', fontSize:13, color:T.text }}>{item.name}</td>
                  <td style={{ padding:'12px 12px' }}><span style={{ fontSize:11, padding:'3px 9px', borderRadius:99, background:`${T.a1}18`, color:T.a1 }}>{item.category}</span></td>
                  <td style={{ padding:'12px 12px', fontSize:13, fontWeight:700, color: item.stock <= item.reorder_point ? T.red : T.text }}>{item.stock}</td>
                  <td style={{ padding:'12px 12px', fontSize:12, color:T.textMid }}>{item.reorder_point}</td>
                  <td style={{ padding:'12px 12px', fontSize:13, color:T.text }}>₹{Number(item.price).toLocaleString()}</td>
                  <td style={{ padding:'12px 12px', fontSize:12, color:T.textMid }}>{item.warehouse}</td>
                  <td style={{ padding:'12px 12px' }}>
                    <span style={{ fontSize:11, padding:'3px 9px', borderRadius:99, background:`${sc(item.status)}18`, color:sc(item.status), fontWeight:700, border:`1px solid ${sc(item.status)}33`, textTransform:'capitalize' }}>
                      {item.status === 'critical' ? '🚨 Critical' : item.status === 'low' ? '⚠️ Low' : '✅ OK'}
                    </span>
                  </td>
                  <td style={{ padding:'12px 12px' }}>
                    <div style={{ display:'flex', gap:5 }}>
                      <button onClick={() => openEdit(item)} style={{ fontSize:11, padding:'4px 9px', borderRadius:6, border:`1px solid ${T.border}`, background:'transparent', cursor:'pointer', color:T.textMid, fontFamily:'inherit' }}>Edit</button>
                      <button onClick={() => handleDelete(item.id)} style={{ fontSize:11, padding:'4px 9px', borderRadius:6, border:`1px solid ${T.red}44`, background:`${T.red}0E`, cursor:'pointer', color:T.red, fontFamily:'inherit' }}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={9} style={{ textAlign:'center', padding:40, color:T.textSub }}>No products found. Add your first product using the button above.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}
            onClick={() => setModal(null)}>
            <motion.div initial={{ scale:.92, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:.92, opacity:0 }}
              onClick={e => e.stopPropagation()}
              style={{ background:T.bgCard, borderRadius:16, padding:28, width:480, boxShadow:'0 24px 64px rgba(0,0,0,.5)', border:`1px solid ${T.border}` }}>
              <div style={{ fontWeight:900, fontSize:16, color:T.text, marginBottom:20 }}>{modal === 'add' ? '+ Add Product' : '✏️ Edit Product'}</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {[
                  { key:'sku', label:'SKU', placeholder:'SKU-001' },
                  { key:'name', label:'Product Name', placeholder:'Product name', span:2 },
                  { key:'category', label:'Category', placeholder:'Electronics' },
                  { key:'warehouse', label:'Warehouse', placeholder:'WH-A' },
                  { key:'stock', label:'Stock Qty', placeholder:'100', type:'number' },
                  { key:'reorder_point', label:'Reorder Point', placeholder:'20', type:'number' },
                  { key:'price', label:'Price (₹)', placeholder:'999', type:'number' },
                ].map(f => (
                  <div key={f.key} style={{ gridColumn: f.span ? `span ${f.span}` : 'auto' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:T.textSub, marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>{f.label}</div>
                    <input type={f.type || 'text'} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{ width:'100%', padding:'10px 14px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit' }} />
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:10, marginTop:22, justifyContent:'flex-end' }}>
                <button onClick={() => setModal(null)} style={{ padding:'10px 20px', borderRadius:9, border:`1px solid ${T.border}`, background:'transparent', cursor:'pointer', fontSize:13, color:T.textMid, fontFamily:'inherit' }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ padding:'10px 24px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${T.a1},${T.a2})`, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', opacity: saving ? .7 : 1 }}>
                  {saving ? 'Saving…' : modal === 'add' ? 'Add Product' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
