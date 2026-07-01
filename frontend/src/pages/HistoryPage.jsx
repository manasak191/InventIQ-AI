import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { historyService } from '../api/inventoryService';

export default function HistoryPage({ T, darkMode }) {
  const [events, setEvents]     = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [moduleFilter, setModuleFilter] = useState('all'); // NEW: all | transaction | product | supplier | user | warehouse
  const [typeFilter, setTypeFilter]     = useState('all'); // only applies when moduleFilter === 'transaction'
  const [search, setSearch]     = useState('');

  const card = { background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: 22 };

  // Color/icon now depend on BOTH module and type, since audit_log events
  // (product/supplier/user/warehouse) use CREATE/UPDATE/DELETE instead of IN/OUT/TRF
  const typeColor = (e) => {
    if (e.module === 'transaction') {
      return e.type === 'IN' ? T.green : e.type === 'OUT' ? T.red : T.a3;
    }
    // audit log coloring
    if (e.type === 'CREATE') return T.green;
    if (e.type === 'DELETE') return T.red;
    return T.a2; // UPDATE
  };

  const typeIcon = (e) => {
    if (e.module === 'transaction') {
      return e.type === 'IN' ? '📥' : e.type === 'OUT' ? '📤' : '🔄';
    }
    if (e.type === 'CREATE') return '➕';
    if (e.type === 'DELETE') return '🗑️';
    return '✏️'; // UPDATE
  };

  const moduleLabel = (m) => ({
    transaction: 'Transaction',
    product:     'Product',
    supplier:    'Supplier',
    user:        'User',
    warehouse:   'Warehouse',
  }[m] || m);

  const load = async () => {
    setLoading(true); setError(null);
    const params = {};
    if (moduleFilter !== 'all') params.module = moduleFilter;
    if (moduleFilter === 'transaction' && typeFilter !== 'all') params.type = typeFilter;

    const [evRes, sumRes] = await Promise.all([
      historyService.getAll(params),
      historyService.getSummary(),
    ]);
    if (evRes.error) { setError(evRes.error); setLoading(false); return; }
    setEvents(Array.isArray(evRes.data) ? evRes.data : []);
    setSummary(sumRes.data || null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [moduleFilter, typeFilter]);

  const filtered = events.filter(e => {
    const haystack = `${e.sku || ''} ${e.product || ''} ${e.label || ''} ${e.user || ''}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

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
            Complete log of every change across the system — stock, products, suppliers, users, warehouses · Admin only
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
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, marginBottom:20 }}>
              {[
                { label:'Total Events',   v:summary.total_events,       c:T.a1,    icon:'📋' },
                { label:'Stock IN',       v:summary.in_events,          c:T.green, icon:'📥' },
                { label:'Stock OUT',      v:summary.out_events,         c:T.red,   icon:'📤' },
                { label:'Audit Events',   v:summary.audit_events,       c:T.a2,    icon:'🛠️' },
                { label:'Active Users',   v:summary.unique_users,       c:T.a3,    icon:'👥' },
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

          {/* Module breakdown (NEW) */}
          {summary?.module_breakdown && Object.keys(summary.module_breakdown).length > 0 && (
            <div style={{ ...card, marginBottom:20 }}>
              <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:14 }}>Changes by Module</div>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                {Object.entries(summary.module_breakdown).map(([mod, count]) => (
                  <div key={mod} style={{ padding:'10px 16px', borderRadius:10, background: darkMode?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)', border:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:T.text }}>{moduleLabel(mod)}</span>
                    <span style={{ fontSize:12, color:T.textSub }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top active users */}
          {summary?.top_users?.length > 0 && (
            <div style={{ ...card, marginBottom:20 }}>
              <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:14 }}>Most Active Users</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>
                {summary.top_users.map((u) => (
                  <div key={u.user} style={{ padding:'12px 14px', borderRadius:10, background: darkMode?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)', border:`1px solid ${T.border}` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:`linear-gradient(135deg,${T.a1},${T.a2})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color:'#fff' }}>
                        {u.user[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontSize:13, fontWeight:700, color:T.text }}>{u.user}</span>
                    </div>
                    <div style={{ display:'flex', gap:10, fontSize:11, flexWrap:'wrap' }}>
                      <span style={{ color:T.green }}>↓{u.in} IN</span>
                      <span style={{ color:T.red }}>↑{u.out} OUT</span>
                      <span style={{ color:T.a3 }}>⇄{u.trf} TRF</span>
                      <span style={{ color:T.a2 }}>🛠️{u.other} other</span>
                      <span style={{ color:T.textSub, marginLeft:'auto' }}>{u.total} total</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
            {/* Module filter (NEW) */}
            {[
              { id:'all',         l:'All' },
              { id:'transaction', l:'Transactions' },
              { id:'product',     l:'Products' },
              { id:'supplier',    l:'Suppliers' },
              { id:'user',        l:'Users' },
              { id:'warehouse',   l:'Warehouses' },
            ].map(f => (
              <button key={f.id} onClick={() => { setModuleFilter(f.id); setTypeFilter('all'); }}
                style={{ padding:'6px 14px', borderRadius:99, border:`1px solid ${moduleFilter===f.id?T.a1:T.border}`, background:moduleFilter===f.id?`${T.a1}18`:'transparent', color:moduleFilter===f.id?T.a1:T.textMid, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                {f.l}
              </button>
            ))}

            {/* Type filter — only meaningful when viewing transactions */}
            {moduleFilter === 'transaction' && (
              <>
                <div style={{ width:1, height:18, background:T.border, margin:'0 4px' }} />
                {[{id:'all',l:'All Types'},{id:'IN',l:'Stock In'},{id:'OUT',l:'Stock Out'},{id:'TRF',l:'Transfers'}].map(f => (
                  <button key={f.id} onClick={() => setTypeFilter(f.id)}
                    style={{ padding:'6px 14px', borderRadius:99, border:`1px solid ${typeFilter===f.id?T.a2:T.border}`, background:typeFilter===f.id?`${T.a2}18`:'transparent', color:typeFilter===f.id?T.a2:T.textMid, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                    {f.l}
                  </button>
                ))}
              </>
            )}

            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search SKU, product, supplier, or user…"
              style={{ marginLeft:'auto', padding:'6px 14px', borderRadius:9, border:`1px solid ${T.border}`, background:darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit', width:240 }} />
          </div>

          {/* Timeline */}
          {dates.length === 0 ? (
            <div style={{ ...card, textAlign:'center', padding:60 }}>
              <div style={{ fontSize:36, marginBottom:12 }}>📋</div>
              <div style={{ fontWeight:700, fontSize:16, color:T.text, marginBottom:8 }}>No history yet</div>
              <div style={{ fontSize:13, color:T.textSub }}>Changes across the system will appear here as they happen.</div>
            </div>
          ) : (
            <div style={{ position:'relative' }}>
              {dates.map((date) => (
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
                    {grouped[date].map((e, i) => {
                      const isTxn = e.module === 'transaction';
                      return (
                        <motion.div key={`${e.source}-${e.record_id || e.sku}-${i}`} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*.03 }}
                          style={{ position:'relative', marginBottom:10 }}>
                          <div style={{ position:'absolute', left:-22, top:14, width:14, height:14, borderRadius:'50%', background:typeColor(e), border:`3px solid ${T.bg}` }} />
                          <div style={{ ...card, padding:'14px 16px', display:'flex', alignItems:'center', gap:14 }}>
                            <div style={{ width:38, height:38, borderRadius:10, background:`${typeColor(e)}18`, border:`1px solid ${typeColor(e)}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                              {typeIcon(e)}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
                                {/* Module badge — NEW, so it's clear at a glance what kind of event this is */}
                                <span style={{ fontSize:10, padding:'2px 8px', borderRadius:99, background: darkMode?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)', color:T.textSub, fontWeight:700 }}>
                                  {moduleLabel(e.module)}
                                </span>
                                <span style={{ fontSize:11, padding:'2px 9px', borderRadius:99, background:`${typeColor(e)}18`, color:typeColor(e), fontWeight:800 }}>
                                  {isTxn
                                    ? (e.type === 'IN' ? 'Stock In' : e.type === 'OUT' ? 'Stock Out' : 'Transfer')
                                    : (e.type === 'CREATE' ? 'Created' : e.type === 'DELETE' ? 'Deleted' : 'Updated')}
                                </span>
                                <span style={{ fontSize:13, fontWeight:700, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                  {isTxn ? (e.product || e.sku) : e.label}
                                </span>
                              </div>

                              {/* Detail line differs by event type */}
                              {isTxn ? (
                                <div style={{ fontSize:11, color:T.textSub }}>
                                  SKU: <span style={{ color:T.a2, fontWeight:600 }}>{e.sku}</span> · Qty: <strong style={{ color:T.text }}>{e.qty}</strong> · ₹{Number(e.value||0).toLocaleString()} · {e.warehouse || 'No warehouse'}
                                </div>
                              ) : (
                                <div style={{ fontSize:11, color:T.textSub }}>
                                  {e.detail || `${moduleLabel(e.module)} #${e.record_id}`}
                                </div>
                              )}

                              {e.note && <div style={{ fontSize:11, color:T.textSub, marginTop:3, fontStyle:'italic' }}>"{e.note}"</div>}
                            </div>
                            <div style={{ textAlign:'right', flexShrink:0 }}>
                              <div style={{ fontSize:12, fontWeight:700, color:T.text }}>{e.user || 'Unknown'}</div>
                              <div style={{ fontSize:11, color:T.textSub, marginTop:2 }}>{e.time}</div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
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