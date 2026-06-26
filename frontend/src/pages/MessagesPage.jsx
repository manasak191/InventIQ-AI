// Save as: frontend/src/pages/MessagesPage.jsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { messageService } from '../api/inventoryService';

const CATEGORIES = [
  { id:'product',     label:'Product',     icon:'📦' },
  { id:'supplier',     label:'Supplier',     icon:'🤝' },
  { id:'transaction',  label:'Transaction',  icon:'🔄' },
  { id:'other',        label:'Other',        icon:'💬' },
];

const EMPTY_FORM = { category:'product', reference:'', subject:'', body:'' };

export default function MessagesPage({ T, darkMode, isAdmin }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [composeOpen, setComposeOpen] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [replying, setReplying] = useState(false);
  const [toast, setToast]       = useState(null);

  const card = { background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:20 };
  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const catMeta = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[3];
  const statusColor = (s) => s === 'open' ? T.yellow : s === 'answered' ? T.green : T.textSub;

  const load = async () => {
    setLoading(true); setError(null);
    const { data, error: err } = isAdmin ? await messageService.getAll() : await messageService.getMine();
    if (err) { setError(err); setLoading(false); return; }
    setMessages(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [isAdmin]);

  const filtered = messages.filter(m => statusFilter === 'all' || m.status === statusFilter);
  const openCount = messages.filter(m => m.status === 'open').length;

  const handleSend = async () => {
    if (!form.subject.trim()) { showToast('Subject is required', 'error'); return; }
    if (!form.body.trim()) { showToast('Message body is required', 'error'); return; }
    setSaving(true);
    const { error: err } = await messageService.create(form);
    setSaving(false);
    if (err) { showToast(err, 'error'); return; }
    showToast('Message sent to admin');
    setForm(EMPTY_FORM);
    setComposeOpen(false);
    await load();
  };

  const openReply = (m) => { setExpandedId(m.id); setReplyDraft(m.admin_reply || ''); };

  const handleReply = async (id) => {
    if (!replyDraft.trim()) { showToast('Reply cannot be empty', 'error'); return; }
    setReplying(true);
    const { error: err } = await messageService.reply(id, replyDraft);
    setReplying(false);
    if (err) { showToast(err, 'error'); return; }
    showToast('Reply sent');
    setExpandedId(null);
    setReplyDraft('');
    await load();
  };

  const handleClose = async (id) => {
    const { error: err } = await messageService.updateStatus(id, 'closed');
    if (err) { showToast(err, 'error'); return; }
    showToast('Conversation closed');
    await load();
  };

  const handleDelete = async (id) => {
    const { error: err } = await messageService.delete(id);
    if (err) { showToast(err, 'error'); return; }
    showToast('Message deleted');
    setMessages(prev => prev.filter(m => m.id !== id));
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

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:'1.4rem', fontWeight:900, color:T.text, letterSpacing:'-.03em' }}>
            {isAdmin ? 'User Messages' : 'Messages'}
          </h1>
          <p style={{ fontSize:13, color:T.textSub, marginTop:2 }}>
            {isAdmin ? `${openCount} open · ${messages.length} total` : `Ask the admin about a product, supplier, or transaction`}
          </p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding:'9px 12px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, fontFamily:'inherit', colorScheme: darkMode ? 'dark' : 'light' }}>
            <option style={{ background: T.bgCard, color: T.text }} value="all">All Status</option>
            <option style={{ background: T.bgCard, color: T.text }} value="open">Open</option>
            <option style={{ background: T.bgCard, color: T.text }} value="answered">Answered</option>
            <option style={{ background: T.bgCard, color: T.text }} value="closed">Closed</option>
          </select>
          <button onClick={load} style={{ padding:'9px 14px', borderRadius:9, border:`1px solid ${T.border}`, background:'transparent', color:T.textMid, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>🔄 Refresh</button>
          {!isAdmin && (
            <button onClick={() => setComposeOpen(true)} style={{ padding:'9px 18px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${T.a1},${T.a2})`, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>+ New Message</button>
          )}
        </div>
      </div>

      {loading && <div style={{ textAlign:'center', padding:60, color:T.textSub }}>Loading messages…</div>}
      {error   && <div style={{ textAlign:'center', padding:60, color:T.red }}>⚠ {error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ ...card, textAlign:'center', padding:60 }}>
          <div style={{ fontSize:40, marginBottom:16 }}>💬</div>
          <div style={{ fontWeight:800, fontSize:17, color:T.text, marginBottom:8 }}>
            {isAdmin ? 'No messages from users yet' : "You haven't sent any messages yet"}
          </div>
          {!isAdmin && (
            <button onClick={() => setComposeOpen(true)}
              style={{ marginTop:10, padding:'10px 22px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${T.a1},${T.a2})`, color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>
              + Write a message
            </button>
          )}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <AnimatePresence>
            {filtered.map((m, i) => {
              const cat = catMeta(m.category);
              const sc = statusColor(m.status);
              const isOpen = expandedId === m.id;
              return (
                <motion.div key={m.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ delay:i*.03 }}
                  style={{ ...card, border:`1px solid ${sc}30` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:14 }}>
                    <div style={{ display:'flex', gap:12, flex:1 }}>
                      <div style={{ width:38, height:38, borderRadius:10, background:`${T.a1}18`, border:`1px solid ${T.a1}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{cat.icon}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:800, color:T.text }}>{m.subject}</div>
                        <div style={{ fontSize:11, color:T.textSub, marginTop:2 }}>
                          {isAdmin && <>{m.sender_name || m.sender_email} · </>}
                          {cat.label}{m.reference ? ` · ${m.reference}` : ''} · {m.created_at ? new Date(m.created_at).toLocaleString() : ''}
                        </div>
                        <div style={{ fontSize:13, color:T.textMid, marginTop:8, lineHeight:1.5 }}>{m.body}</div>

                        {m.admin_reply && (
                          <div style={{ marginTop:12, padding:'10px 14px', borderRadius:10, background: darkMode?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)', borderLeft:`3px solid ${T.green}` }}>
                            <div style={{ fontSize:11, fontWeight:700, color:T.green, marginBottom:4 }}>
                              Admin reply{m.replied_by_name ? ` · ${m.replied_by_name}` : ''}
                            </div>
                            <div style={{ fontSize:13, color:T.textMid, lineHeight:1.5 }}>{m.admin_reply}</div>
                          </div>
                        )}

                        {isAdmin && isOpen && (
                          <div style={{ marginTop:12 }}>
                            <textarea value={replyDraft} onChange={e => setReplyDraft(e.target.value)}
                              placeholder="Type your reply…" rows={3}
                              style={{ width:'100%', padding:'10px 14px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit', resize:'vertical', boxSizing:'border-box' }} />
                            <div style={{ display:'flex', gap:8, marginTop:8, justifyContent:'flex-end' }}>
                              <button onClick={() => setExpandedId(null)} style={{ padding:'8px 16px', borderRadius:8, border:`1px solid ${T.border}`, background:'transparent', color:T.textMid, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                              <button onClick={() => handleReply(m.id)} disabled={replying} style={{ padding:'8px 18px', borderRadius:8, border:'none', background:`linear-gradient(135deg,${T.a1},${T.a2})`, color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', opacity: replying?.7:1 }}>
                                {replying ? 'Sending…' : 'Send Reply'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, flexShrink:0 }}>
                      <span style={{ fontSize:11, padding:'4px 10px', borderRadius:99, background:`${sc}18`, color:sc, fontWeight:700, border:`1px solid ${sc}33`, textTransform:'capitalize' }}>{m.status}</span>
                      <div style={{ display:'flex', gap:6 }}>
                        {isAdmin && m.status !== 'closed' && !isOpen && (
                          <button onClick={() => openReply(m)} style={{ padding:'6px 12px', borderRadius:7, border:`1px solid ${T.border}`, background:'transparent', color:T.textMid, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                            {m.admin_reply ? '✏️ Edit reply' : '↩️ Reply'}
                          </button>
                        )}
                        {isAdmin && m.status === 'answered' && (
                          <button onClick={() => handleClose(m.id)} style={{ padding:'6px 12px', borderRadius:7, border:`1px solid ${T.border}`, background:'transparent', color:T.textMid, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Close</button>
                        )}
                        {(isAdmin || m.status === 'open') && (
                          <button onClick={() => handleDelete(m.id)} style={{ padding:'6px 10px', borderRadius:7, border:`1px solid ${T.red}44`, background:'transparent', color:T.red, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>🗑</button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {composeOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
            onClick={() => setComposeOpen(false)}>
            <motion.div initial={{ scale:.92, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:.92 }}
              onClick={e => e.stopPropagation()}
              style={{ background:T.bgCard, borderRadius:16, padding:28, width:480, boxShadow:'0 24px 64px rgba(0,0,0,.5)', border:`1px solid ${T.border}` }}>
              <div style={{ fontWeight:900, fontSize:16, color:T.text, marginBottom:20 }}>+ New Message to Admin</div>

              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.textSub, marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>Category</div>
                <div style={{ display:'flex', gap:8 }}>
                  {CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => setForm(p => ({ ...p, category:c.id, reference: c.id === 'supplier' ? '' : p.reference }))}
                      style={{ flex:1, padding:'9px 0', borderRadius:9, border:`1px solid ${form.category===c.id?T.a1:T.border}`, background: form.category===c.id?`${T.a1}18`:'transparent', color: form.category===c.id?T.a1:T.textMid, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Users have no Suppliers page/list, so don't ask them to reference one by name/ID */}
              {form.category !== 'supplier' && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textSub, marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>Reference (optional)</div>
                  <input value={form.reference} onChange={e => setForm(p => ({ ...p, reference:e.target.value }))}
                    placeholder="e.g. SKU-1023, Order #45"
                    style={{ width:'100%', padding:'10px 14px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
                </div>
              )}

              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.textSub, marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>Subject *</div>
                <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject:e.target.value }))}
                  placeholder="Short summary of your question"
                  style={{ width:'100%', padding:'10px 14px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
              </div>

              <div style={{ marginBottom:6 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.textSub, marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>Message *</div>
                <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body:e.target.value }))}
                  placeholder="Describe your question in detail…" rows={4}
                  style={{ width:'100%', padding:'10px 14px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit', resize:'vertical', boxSizing:'border-box' }} />
              </div>

              <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
                <button onClick={() => setComposeOpen(false)} style={{ padding:'10px 20px', borderRadius:9, border:`1px solid ${T.border}`, background:'transparent', cursor:'pointer', fontSize:13, color:T.textMid, fontFamily:'inherit' }}>Cancel</button>
                <button onClick={handleSend} disabled={saving} style={{ padding:'10px 24px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${T.a1},${T.a2})`, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', opacity: saving?.7:1 }}>
                  {saving ? 'Sending…' : 'Send Message'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}