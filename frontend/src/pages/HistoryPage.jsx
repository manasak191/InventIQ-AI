import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { historyService } from '../api/inventoryService';

export default function HistoryPage({ T, darkMode }) {
  const [events, setEvents]     = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');

  const card = { background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: 22 };
  const typeColor = t => t === 'IN' ? T.green : t === 'OUT' ? T.red : T.a3;
  const typeIcon  = t => t === 'IN' ? '📥' : t === 'OUT' ? '📤' : '🔄';

  const load = async () => {
    setLoading(true); setError(null);
    const [evRes, sumRes] = await Promise.all([
      historyService.getAll(filter !== 'all' ? { type: filter } : {}),
      historyService.getSummary(),
    ]);
    if (evRes.error) { setError(evRes.error); setLoading(false); return; }
    setEvents(Array.isArray(evRes.data) ? evRes.data : []);
    setSummary(sumRes.data || null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const filtered = events.filter(e =>
    e.sku?.toLowerCase().includes(search.toLowerCase()) ||
    e.product?.toLowerCase().includes(search.toLowerCase()) ||
    e.user?.toLowerCase().includes(search.toLowerCase())
  );

  // Group events by date for timeline display
  const grouped = filtered.reduce((acc, e) => {
    const d = e.date || 'Unknown';
    acc[d] = acc[d] || [];
    acc[d].push(e);
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:'1.4rem', fontWeight:900, color:T.text, letterSpacing:'-.03em' }}>Audit History</h1>
          <p style={{ fontSize:13, color:T.textSub, marginTop:3 }}>
            Complete log of every stock movement across the system · Admin only
          </p>
        </div>
        <button onClick={load}
          style={{ padding:'9px 16px', borderRadius:9, border:`1px solid ${T.border}`, background:'transparent', color:T.textMid, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
          🔄 Refresh
        </button>
      </div>

      {loading && <div style={{ textAlign:'center', padding:60, color:T.textSub }}>Loading history…</div>}
      {error   && <div style={{ ...card, textAlign:'center', padding:48, color:T.red }}>⚠ {error}</div>}

      {!loading && !error && (
        <>
          {/* Summary KPIs */}
          {summary && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
              {[
                { label:'Total Events',   v:summary.total_events,  c:T.a1,   icon:'📋' },
                { label:'Stock IN',       v:summary.in_events,     c:T.green,icon:'📥' },
                { label:'Stock OUT',      v:summary.out_events,    c:T.red,  icon:'📤' },
                { label:'Active Users',   v:summary.unique_users,  c:T.a2,   icon:'👥' },
              ].map((k, i) => (
                <motion.div key={k.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.06 }}
                  style={{ ...card, border:`1px solid ${k.c}28`, display:'flex', alignItems:'center', gap:14, padding:'16px 20px' }}>
                  <div style={{ width:42, height:42, borderRadius:11, background:`${k.c}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{k.icon}</div>
                  <div>
                    <div style={{ fontSize:'1.5rem', fontWeight:900, color:k.c }}>{k.v}</div>
                    <div style={{ fontSize:11, color:T.textSub, marginTop:2 }}>{k.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Top active users */}
          {summary?.top_users?.length > 0 && (
            <div style={{ ...card, marginBottom:20 }}>
              <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:14 }}>Most Active Users</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>
                {summary.top_users.map((u, i) => (
                  <div key={u.user} style={{ padding:'12px 14px', borderRadius:10, background: darkMode?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)', border:`1px solid ${T.border}` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:`linear-gradient(135deg,${T.a1},${T.a2})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color:'#fff' }}>
                        {u.user[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontSize:13, fontWeight:700, color:T.text }}>{u.user}</span>
                    </div>
                    <div style={{ display:'flex', gap:10, fontSize:11 }}>
                      <span style={{ color:T.green }}>↓{u.in} IN</span>
                      <span style={{ color:T.red }}>↑{u.out} OUT</span>
                      <span style={{ color:T.a3 }}>⇄{u.trf} TRF</span>
                      <span style={{ color:T.textSub, marginLeft:'auto' }}>{u.total} total</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap' }}>
            {[{id:'all',l:'All Events'},{id:'IN',l:'Stock In'},{id:'OUT',l:'Stock Out'},{id:'TRF',l:'Transfers'}].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                style={{ padding:'6px 14px', borderRadius:99, border:`1px solid ${filter===f.id?T.a1:T.border}`, background:filter===f.id?`${T.a1}18`:'transparent', color:filter===f.id?T.a1:T.textMid, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                {f.l}
              </button>
            ))}
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search SKU, product, or user…"
              style={{ marginLeft:'auto', padding:'6px 14px', borderRadius:9, border:`1px solid ${T.border}`, background:darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit', width:240 }} />
          </div>

          {/* Timeline */}
          {dates.length === 0 ? (
            <div style={{ ...card, textAlign:'center', padding:60 }}>
              <div style={{ fontSize:36, marginBottom:12 }}>📋</div>
              <div style={{ fontWeight:700, fontSize:16, color:T.text, marginBottom:8 }}>No history yet</div>
              <div style={{ fontSize:13, color:T.textSub }}>Stock movements will appear here as they happen.</div>
            </div>
          ) : (
            <div style={{ position:'relative' }}>
              {dates.map((date, di) => (
                <div key={date} style={{ marginBottom:24 }}>
                  {/* Date header */}
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                    <div style={{ fontSize:12, fontWeight:800, color:T.text, padding:'4px 12px', borderRadius:8, background: darkMode?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)' }}>
                      {new Date(date).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                    </div>
                    <div style={{ flex:1, height:1, background:T.border }} />
                    <span style={{ fontSize:11, color:T.textSub }}>{grouped[date].length} event{grouped[date].length !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Timeline items */}
                  <div style={{ position:'relative', paddingLeft:24 }}>
                    <div style={{ position:'absolute', left:7, top:4, bottom:4, width:2, background: darkMode?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)' }} />
                    {grouped[date].map((e, i) => (
                      <motion.div key={e.id || i} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*.03 }}
                        style={{ position:'relative', marginBottom:10 }}>
                        <div style={{ position:'absolute', left:-22, top:14, width:14, height:14, borderRadius:'50%', background:typeColor(e.type), border:`3px solid ${T.bg}` }} />
                        <div style={{ ...card, padding:'14px 16px', display:'flex', alignItems:'center', gap:14 }}>
                          <div style={{ width:38, height:38, borderRadius:10, background:`${typeColor(e.type)}18`, border:`1px solid ${typeColor(e.type)}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                            {typeIcon(e.type)}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                              <span style={{ fontSize:11, padding:'2px 9px', borderRadius:99, background:`${typeColor(e.type)}18`, color:typeColor(e.type), fontWeight:800 }}>
                                {e.type === 'IN' ? 'Stock In' : e.type === 'OUT' ? 'Stock Out' : 'Transfer'}
                              </span>
                              <span style={{ fontSize:13, fontWeight:700, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                {e.product || e.sku}
                              </span>
                            </div>
                            <div style={{ fontSize:11, color:T.textSub }}>
                              SKU: <span style={{ color:T.a2, fontWeight:600 }}>{e.sku}</span> · Qty: <strong style={{ color:T.text }}>{e.qty}</strong> · ₹{Number(e.value||0).toLocaleString()} · {e.warehouse || 'No warehouse'}
                            </div>
                            {e.note && <div style={{ fontSize:11, color:T.textSub, marginTop:3, fontStyle:'italic' }}>"{e.note}"</div>}
                          </div>
                          <div style={{ textAlign:'right', flexShrink:0 }}>
                            <div style={{ fontSize:12, fontWeight:700, color:T.text }}>{e.user || 'Unknown'}</div>
                            <div style={{ fontSize:11, color:T.textSub, marginTop:2 }}>{e.time}</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}