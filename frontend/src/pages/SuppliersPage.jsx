import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supplierService } from '../api/inventoryService';

const EMPTY_FORM = { name:'', category:'', email:'', phone:'', status:'active' };

export default function SuppliersPage({ T, darkMode }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [editId, setEditId]       = useState(null);
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState('');
  const [toast, setToast]         = useState(null);

  const card = { background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:22 };
  const sc = (s) => ({ preferred:T.green, active:T.a1, review:T.yellow }[s] || T.textSub);
  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = async () => {
    setLoading(true); setError(null);
    const { data, error: err } = await supplierService.getAll();
    if (err) { setError(err); setLoading(false); return; }
    setSuppliers(Array.isArray(data) ? data : data?.suppliers || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = suppliers.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd  = () => { setForm(EMPTY_FORM); setEditId(null); setModal('add'); };
  const openEdit = (s) => {
    setForm({ name:s.name, category:s.category||'', email:s.email||'', phone:s.phone||'',orders: s.orders ||0, status:s.status });
    setEditId(s.id); setModal('edit');
  };

  const handleSave = async () => {
    setSaving(true);
    const { error: err } = modal === 'add'
      ? await supplierService.create(form)
      : await supplierService.update(editId, form);
    if (err) { showToast(err, 'error'); setSaving(false); return; }
    showToast(modal === 'add' ? 'Supplier added!' : 'Supplier updated!');
    setSaving(false); setModal(null); load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this supplier?')) return;
    const { error: err } = await supplierService.delete(id);
    if (err) { showToast(err, 'error'); return; }
    showToast('Supplier removed!'); load();
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
          <h1 style={{ fontSize:'1.4rem', fontWeight:900, color:T.text, letterSpacing:'-.03em' }}>Suppliers</h1>
          <p style={{ fontSize:13, color:T.textSub, marginTop:2 }}>{suppliers.length} suppliers on record</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers…"
            style={{ padding:'9px 14px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit', width:200 }} />
          <button onClick={openAdd} style={{ padding:'9px 18px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${T.a2},${T.a1})`, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>+ Add Supplier</button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
        {[
          { l:'Total Suppliers', v:suppliers.length, c:T.a1 },
          { l:'Preferred', v:suppliers.filter(s=>s.status==='preferred').length, c:T.green },
          { l:'Under Review', v:suppliers.filter(s=>s.status==='review').length, c:T.yellow },
        ].map(s => (
          <div key={s.l} style={{ ...card, border:`1px solid ${s.c}28`, textAlign:'center', padding:16 }}>
            <div style={{ fontSize:'2rem', fontWeight:900, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:12, color:T.textSub, marginTop:4 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        {loading && <div style={{ textAlign:'center', padding:40, color:T.textSub }}>Loading suppliers…</div>}
        {error   && <div style={{ textAlign:'center', padding:40, color:T.red }}>⚠ {error} — make sure the backend is running.</div>}
        {!loading && !error && (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                {['Supplier','Category','Orders','Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:T.textSub, letterSpacing:'.06em', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr
                key={s.id}
                className="row-hover"
                style={{
                  borderBottom:`1px solid ${T.border}`,
                  transition:'background .15s'
                }}
              >
                {/* Supplier */}
                <td style={{ padding:'13px 14px' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.text }}>
                    {s.name}
                  </div>

                  {s.email && (
                    <div style={{ fontSize:11, color:T.textSub }}>
                      {s.email}
                    </div>
                  )}
                </td>

                {/* Category */}
                <td style={{ padding:'13px 14px' }}>
                  <span
                    style={{
                      fontSize:11,
                      padding:'3px 10px',
                      borderRadius:99,
                      background:`${T.a3}18`,
                      color:T.a3
                    }}
                  >
                    {s.category}
                  </span>
                </td>

                {/* Orders */}
                <td
                  style={{
                    padding:'13px 14px',
                    fontSize:13,
                    color:T.text,
                    fontWeight:700
                  }}
                >
                  {s.orders}
                </td>

                {/* Status */}
                <td style={{ padding:'13px 14px' }}>
                  <span
                    style={{
                      fontSize:11,
                      padding:'3px 10px',
                      borderRadius:99,
                      background:`${sc(s.status)}18`,
                      color:sc(s.status),
                      fontWeight:700,
                      border:`1px solid ${sc(s.status)}33`,
                      textTransform:'capitalize'
                    }}
                  >
                    {s.status}
                  </span>
                </td>

                {/* Actions */}
                <td style={{ padding:'13px 14px' }}>
                  <div style={{ display:'flex', gap:6 }}>
                    <button
                      onClick={() => openEdit(s)}
                      style={{
                        fontSize:11,
                        padding:'4px 10px',
                        borderRadius:6,
                        border:`1px solid ${T.border}`,
                        background:'transparent',
                        cursor:'pointer',
                        color:T.textMid,
                        fontFamily:'inherit'
                      }}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(s.id)}
                      style={{
                        fontSize:11,
                        padding:'4px 10px',
                        borderRadius:6,
                        border:`1px solid ${T.red}44`,
                        background:`${T.red}0E`,
                        cursor:'pointer',
                        color:T.red,
                        fontFamily:'inherit'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:T.textSub }}>No suppliers found. Add your first supplier above.</td></tr>
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
              style={{ background:T.bgCard, borderRadius:16, padding:28, width:440, boxShadow:'0 24px 64px rgba(0,0,0,.5)', border:`1px solid ${T.border}` }}>
              <div style={{ fontWeight:900, fontSize:16, color:T.text, marginBottom:20 }}>{modal === 'add' ? '+ Add Supplier' : '✏️ Edit Supplier'}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {[
                { key:'name', label:'Company Name', placeholder:'Supplier Ltd.' },
                { key:'category', label:'Category', placeholder:'Electronics' },
                { key:'email', label:'Email', placeholder:'contact@supplier.com' },
                { key:'phone', label:'Phone', placeholder:'+91-98000-00000' },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textSub, marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>
                    {f.label}
                  </div>

                  <input
                    value={form[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{
                      width:'100%',
                      padding:'10px 14px',
                      borderRadius:9,
                      border:`1px solid ${T.border}`,
                      background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      color:T.text,
                      fontSize:13,
                      outline:'none',
                      fontFamily:'inherit'
                    }}
                  />
                </div>
              ))}

              {/* ADD THIS HERE */}
              <div>
                <div
                  style={{
                    fontSize:11,
                    fontWeight:700,
                    color:T.textSub,
                    marginBottom:6,
                    textTransform:'uppercase',
                    letterSpacing:'.05em'
                  }}
                >
                  Orders
                </div>

                <input
                  type="number"
                  value={form.orders}
                  onChange={e =>
                    setForm(p => ({
                      ...p,
                      orders: Number(e.target.value)
                    }))
                  }
                  placeholder="0"
                  style={{
                    width:'100%',
                    padding:'10px 14px',
                    borderRadius:9,
                    border:`1px solid ${T.border}`,
                    background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    color:T.text,
                    fontSize:13,
                    outline:'none',
                    fontFamily:'inherit'
                  }}
                />
              </div>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textSub, marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>Status</div>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status:e.target.value }))}
                    style={{ width:'100%', padding:'10px 14px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'#0D1526':'#fff', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit' }}>
                    <option value="active">Active</option>
                    <option value="preferred">Preferred</option>
                    <option value="review">Under Review</option>
                  </select>
                </div>
              
              <div style={{ display:'flex', gap:10, marginTop:22, justifyContent:'flex-end' }}>
                <button onClick={() => setModal(null)} style={{ padding:'10px 20px', borderRadius:9, border:`1px solid ${T.border}`, background:'transparent', cursor:'pointer', fontSize:13, color:T.textMid, fontFamily:'inherit' }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ padding:'10px 24px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${T.a2},${T.a1})`, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', opacity: saving?.7:1 }}>
                  {saving ? 'Saving…' : modal === 'add' ? 'Add Supplier' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
