import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DARK, LIGHT, globalStyles } from '../theme';
import { LineChart } from '../components/Charts';
import { dashboardService, notificationService, searchService, aiService, transactionService } from '../api/inventoryService';
import { ProfileModal, SettingsModal, ChangePasswordModal } from '../components/ProfileModal';

import ProductsPage      from './ProductsPage';
import TransactionsPage  from './TransactionsPage';
import NotificationsPage from './NotificationsPage';
import ReportsPage       from './ReportsPage';
import AIAssistantPage   from './AIAssistantPage';
import MessagesPage      from './MessagesPage';

// User nav — intentionally fewer items than admin (no suppliers/warehouses/users management)
const USER_NAV = [
  { id:'overview',      icon:'🏠', label:'Overview' },
  { id:'transactions',  icon:'🔄', label:'My Transactions' },
  { id:'stock-lookup',  icon:'🔍', label:'Stock Lookup' },
  { id:'reports',       icon:'📊', label:'Reports' },
  { id:'notifications', icon:'🔔', label:'Notifications' },
  { id:'messages',      icon:'💬', label:'Messages' },
  { id:'ai',            icon:'✨', label:'AI Assistant' },
];

export default function UserDashboard({ darkMode, onToggleDarkMode, onLogout, userName = 'User' }) {
  const T = darkMode ? DARK : LIGHT;
  const [active, setActive]     = useState('overview');
  const [sideOpen, setSideOpen] = useState(true);
  const [kpis, setKpis]         = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);

  // Search
  const [searchVal, setSearchVal]         = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching]         = useState(false);
  const [profileOpen, setProfileOpen]     = useState(false);
  const [notifOpen, setNotifOpen]         = useState(false);
  const searchTimer = useRef(null);

  // 👇 NEW: refs for click-outside-to-close
  const profileRef = useRef(null);
  const notifRef   = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Inline AI on overview
  const [aiInput, setAiInput]   = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReply, setAiReply]   = useState('');

  // User uses teal/green accent — clearly different from admin purple/blue
  const accentGrad = `linear-gradient(135deg,${T.a3},${T.a1})`;
  const C = { background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [kpiRes, notifRes] = await Promise.all([
        dashboardService.getUserKPIs(),
        notificationService.getAll(),
      ]);
      if (kpiRes.data)   setKpis(kpiRes.data);
      if (notifRes.data) setNotifications(
        Array.isArray(notifRes.data) ? notifRes.data : notifRes.data?.notifications || []
      );
      setLoading(false);
    };
    fetchAll();
  }, []);

  // Debounced search
  const handleSearch = (q) => {
    setSearchVal(q);
    clearTimeout(searchTimer.current);
    if (!q.trim()) { setSearchResults(null); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      const { data } = await searchService.search(q);
      setSearchResults(data?.results || []);
      setSearching(false);
    }, 350);
  };

  const handleResultClick = (r) => {
    // Users can only access products and transactions
    if (r.page === 'products') setActive('stock-lookup');
    else if (r.page === 'transactions') setActive('transactions');
    setSearchVal(''); setSearchResults(null);
  };

  // Inline AI ask
  const handleAskAI = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const q = aiInput.trim();
    setAiInput(''); setAiLoading(true); setAiReply('');
    const { data } = await aiService.chat(q, []);
    setAiReply(data?.response || '⚠ Could not reach AI backend. Make sure the server is running.');
    setAiLoading(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const typeColor = (t) => t === 'IN' ? T.green : t === 'OUT' ? T.red : T.a3;

  return (
    <div style={{ display:'flex', height:'100vh', background:T.bg, color:T.text, fontFamily:'"DM Sans","Inter",system-ui,sans-serif', overflow:'hidden' }}>
      <style>{globalStyles(T, darkMode)}</style>

      {/* ── SIDEBAR — teal accent, fewer nav items ── */}
      <motion.aside
        animate={{ width: sideOpen ? 240 : 64 }}
        transition={{ duration:.28, ease:[.22,1,.36,1] }}
        style={{ background: T.bgCard2, borderRight:`1px solid ${T.border}`, display:'flex', flexDirection:'column', height:'100vh', flexShrink:0, overflow:'hidden', zIndex:50 }}>

        {/* Logo */}
        <div style={{ padding:'0 12px', height:64, display:'flex', alignItems:'center', gap:10, borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:accentGrad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>📦</div>
          <AnimatePresence>{sideOpen && (
            <motion.div initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-8 }}>
              <div style={{ fontWeight:900, fontSize:14, color:T.text, whiteSpace:'nowrap' }}>InventIQ AI</div>
              <div style={{ fontSize:10, color:T.a3, fontWeight:700 }}>Inventory User</div>
            </motion.div>
          )}</AnimatePresence>
        </div>

        {/* Nav */}
        <div style={{ flex:1, overflowY:'auto', padding:'10px 8px' }}>
          {USER_NAV.map(n => {
            const isActive = active === n.id;
            return (
              <motion.button key={n.id} whileTap={{ scale:.97 }} onClick={() => setActive(n.id)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 10px', borderRadius:10, border:'none', cursor:'pointer', fontFamily:'inherit', marginBottom:3, background: isActive?`${T.a3}18`:'transparent', transition:'background .15s', position:'relative' }}>
                <span style={{ fontSize:17, flexShrink:0, width:24, textAlign:'center' }}>{n.icon}</span>
                <AnimatePresence>{sideOpen && (
                  <motion.span initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-6 }}
                    style={{ fontSize:13, fontWeight: isActive?700:500, color: isActive?T.a3:T.textMid, whiteSpace:'nowrap' }}>
                    {n.label}
                  </motion.span>
                )}</AnimatePresence>
                {isActive && <motion.div layoutId="userBar" style={{ position:'absolute', left:0, top:6, bottom:6, width:3, borderRadius:99, background:T.a3 }} />}
                {n.id === 'notifications' && unreadCount > 0 && sideOpen && (
                  <span style={{ marginLeft:'auto', background:T.red, color:'#fff', borderRadius:99, padding:'1px 7px', fontSize:10, fontWeight:700 }}>{unreadCount}</span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Bottom */}
        <div style={{ borderTop:`1px solid ${T.border}`, flexShrink:0 }}>
          <button onClick={() => setSideOpen(v => !v)}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'12px 16px', border:'none', cursor:'pointer', fontFamily:'inherit', background:'transparent', color:T.textSub, fontSize:12 }}>
            <span style={{ fontSize:14, width:24, textAlign:'center' }}>{sideOpen ? '◀' : '▶'}</span>
            {sideOpen && <span style={{ fontSize:12, color:T.textSub }}>Collapse</span>}
          </button>
          {sideOpen && (
            <button onClick={onLogout}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'12px 16px', border:'none', cursor:'pointer', fontFamily:'inherit', background:'transparent', color:T.red, fontSize:13, fontWeight:600, borderTop:`1px solid ${T.border}` }}>
              <span style={{ width:24, textAlign:'center' }}>🚪</span>
              <span>Logout</span>
            </button>
          )}
        </div>
      </motion.aside>

      {/* ── MAIN COLUMN ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, height:'100vh', overflow:'hidden' }}>

        {/* ── TOPBAR ── */}
        <header style={{ height:64, background:T.bgCard, borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', flexShrink:0, zIndex:40 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:900, color:T.text, letterSpacing:'-.02em' }}>
              {greeting}, {userName} 👋
            </div>
            <div style={{ fontSize:11, color:T.textSub }}>
              Inventory User · Let's get your work done · {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Search */}
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:13, pointerEvents:'none' }}>🔍</span>
              <input
                value={searchVal}
                onChange={e => handleSearch(e.target.value)}
                onKeyDown={e => { if(e.key==='Escape'){setSearchVal('');setSearchResults(null);} }}
                placeholder="Search products, SKUs…"
                style={{ padding:'8px 32px 8px 30px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)', color:T.text, fontSize:13, width:220, outline:'none', fontFamily:'inherit' }}
              />
              {searchVal && (
                <button onClick={() => { setSearchVal(''); setSearchResults(null); }}
                  style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:13, color:T.textSub }}>✕</button>
              )}
              <AnimatePresence>
                {searchResults !== null && (
                  <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                    style={{ position:'absolute', top:44, left:0, width:340, background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:12, boxShadow:'0 16px 40px rgba(0,0,0,.4)', zIndex:500, overflow:'hidden', maxHeight:300, overflowY:'auto' }}>
                    {searching && <div style={{ padding:'14px 16px', color:T.textSub, fontSize:13 }}>Searching…</div>}
                    {!searching && searchResults.length === 0 && <div style={{ padding:'14px 16px', color:T.textSub, fontSize:13 }}>No results for "{searchVal}"</div>}
                    {!searching && searchResults.map((r,i) => (
                      <button key={i} onClick={() => handleResultClick(r)}
                        style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'10px 16px', border:'none', background:'transparent', cursor:'pointer', fontFamily:'inherit', borderBottom:`1px solid ${T.border}`, textAlign:'left' }}>
                        <span style={{ fontSize:18, flexShrink:0 }}>{r.icon}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.title}</div>
                          <div style={{ fontSize:11, color:T.textSub }}>{r.subtitle}</div>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={onToggleDarkMode}
              style={{ background: darkMode?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.06)', border:`1px solid ${T.border}`, borderRadius:8, padding:'7px 11px', cursor:'pointer', fontSize:15 }}>
              {darkMode ? '☀️' : '🌙'}
            </button>

            {/* Notifications */}
            <div ref={notifRef} style={{ position:'relative' }}>
              <button onClick={() => { setNotifOpen(v=>!v); setProfileOpen(false); }}
                style={{ background: darkMode?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.06)', border:`1px solid ${T.border}`, borderRadius:8, padding:'7px 11px', cursor:'pointer', fontSize:15, position:'relative' }}>
                🔔
                {unreadCount > 0 && <span style={{ position:'absolute', top:3, right:3, width:8, height:8, borderRadius:'50%', background:T.red, border:`2px solid ${T.bgCard}` }} />}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                    style={{ position:'absolute', right:0, top:46, width:300, background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, boxShadow:'0 16px 40px rgba(0,0,0,.35)', zIndex:300, overflow:'hidden' }}>
                    <div style={{ padding:'12px 14px', borderBottom:`1px solid ${T.border}`, fontWeight:800, fontSize:13, color:T.text, display:'flex', justifyContent:'space-between' }}>
                      Notifications <span style={{ fontSize:11, color:T.red }}>{unreadCount} new</span>
                    </div>
                    {notifications.length === 0 && <div style={{ padding:'14px', fontSize:13, color:T.textSub, textAlign:'center' }}>No notifications yet</div>}
                    {notifications.slice(0,4).map((n,i) => (
                      <div key={i} style={{ padding:'10px 14px', borderBottom:`1px solid ${T.border}`, display:'flex', gap:10 }}>
                        <span style={{ fontSize:15 }}>{n.icon || '🔔'}</span>
                        <div>
                          <div style={{ fontSize:12, color:T.textMid, lineHeight:1.4 }}>{n.message}</div>
                          <div style={{ fontSize:10, color:T.textSub, marginTop:2 }}>{n.time || n.created_at}</div>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => { setActive('notifications'); setNotifOpen(false); }}
                      style={{ width:'100%', padding:'10px', background:'transparent', border:'none', borderTop:`1px solid ${T.border}`, cursor:'pointer', fontSize:12, color:T.a3, fontWeight:700, fontFamily:'inherit' }}>
                      View all →
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ═══ Profile dropdown — polished SaaS style ═══ */}
            <div ref={profileRef} style={{ position:'relative' }}>
              <button onClick={() => { setProfileOpen(v=>!v); setNotifOpen(false); }}
                style={{
                  display:'flex', alignItems:'center', gap:8,
                  background: profileOpen ? `${T.a3}0E` : 'none',
                  border: `1px solid ${profileOpen ? T.a3 + '55' : 'transparent'}`,
                  borderRadius:99, cursor:'pointer', padding:'5px 10px 5px 5px', transition:'all .15s', fontFamily:'inherit',
                }}>
                <div style={{ position:'relative', width:34, height:34, flexShrink:0 }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', background:accentGrad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900, color:'#fff' }}>
                    {(userName||'U')[0].toUpperCase()}
                  </div>
                  <div style={{ position:'absolute', bottom:-1, right:-1, width:10, height:10, borderRadius:'50%', background:T.green, border:`2px solid ${T.bgCard}` }} />
                </div>
                <div style={{ textAlign:'left' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:T.text }}>{userName}</div>
                  <div style={{ fontSize:10, color:T.a3, fontWeight:700 }}>Inventory User</div>
                </div>
                <span style={{ fontSize:9, color:T.textSub, marginLeft:2, transform: profileOpen?'rotate(180deg)':'none', transition:'transform .2s' }}>▾</span>
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div initial={{ opacity:0, y:8, scale:.96 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:8 }}
                    transition={{ duration:.15 }}
                    style={{ position:'absolute', right:0, top:48, width:230, background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, boxShadow:'0 16px 44px rgba(0,0,0,.4)', zIndex:300, overflow:'hidden' }}>

                    {/* Header block */}
                    <div style={{ padding:'16px 16px 14px', borderBottom:`1px solid ${T.border}` }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ width:38, height:38, borderRadius:'50%', background:accentGrad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color:'#fff', flexShrink:0 }}>
                          {(userName||'U')[0].toUpperCase()}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:800, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{userName}</div>
                        </div>
                      </div>
                      <div style={{ display:'inline-flex', alignItems:'center', gap:5, marginTop:10, padding:'3px 9px', borderRadius:99, background:`${T.a3}18`, fontSize:10.5, fontWeight:700, color:T.a3 }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:T.a3 }} />
                        Inventory User
                      </div>
                    </div>

                    {/* Account actions */}
                    <div style={{ padding:8 }}>
                      {[
                        { icon:'👤', label:'My Profile',     action:() => { setModal('profile');  setProfileOpen(false); } },
                        { icon:'⚙️', label:'Settings',        action:() => { setModal('settings'); setProfileOpen(false); } },
                        { icon:'🔑', label:'Change Password', action:() => { setModal('password'); setProfileOpen(false); } },
                      ].map(item => (
                        <button key={item.label} onClick={item.action}
                          style={{ width:'100%', display:'flex', alignItems:'center', gap:11, padding:'10px 12px', borderRadius:9, border:'none', background:'transparent', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600, color:T.textMid, textAlign:'left', transition:'background .15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = darkMode?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.045)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <span style={{ fontSize:15, width:18, textAlign:'center' }}>{item.icon}</span>{item.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ height:1, background:T.border, margin:'2px 0' }} />

                    {/* Sign out */}
                    <div style={{ padding:8 }}>
                      <button onClick={() => { setProfileOpen(false); onLogout(); }}
                        style={{ width:'100%', display:'flex', alignItems:'center', gap:11, padding:'10px 12px', borderRadius:9, border:'none', background:'transparent', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600, color:T.red, textAlign:'left', transition:'background .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = `${T.red}12`}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <span style={{ fontSize:15, width:18, textAlign:'center' }}>🚪</span>Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ── SCROLLABLE MAIN CONTENT ── */}
        <main style={{ flex:1, overflowY:'auto', padding:'22px 26px' }}>
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:.18 }}>

              {/* ════ OVERVIEW ════ */}
              {active === 'overview' && (
                <div>
                  {loading && <div style={{ textAlign:'center', padding:60, color:T.textSub }}>Loading dashboard…</div>}

                  {!loading && !kpis && (
                    <div style={{ ...C, textAlign:'center', padding:60 }}>
                      <div style={{ fontSize:36, marginBottom:12 }}>⚠️</div>
                      <div style={{ fontWeight:700, fontSize:16, color:T.text, marginBottom:8 }}>Cannot connect to backend</div>
                      <div style={{ fontSize:13, color:T.textSub }}>Make sure FastAPI is running at http://127.0.0.1:8000</div>
                    </div>
                  )}

                  {!loading && kpis && (
                    <>
                      {/* ── Row 1: 4 KPI cards ── */}
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:18 }}>
                        {[
                          { label:'Stock-In Today',   value: kpis.today_stock_in,   sub:'View details',   color:T.green,  icon:'📥', page:'transactions' },
                          { label:'Stock-Out Today',  value: kpis.today_stock_out,  sub:'View details',   color:T.red,    icon:'📤', page:'transactions' },
                          { label:'My Transactions',  value: kpis.my_transactions,  sub:'All time',       color:T.a3,     icon:'🔄', page:'transactions' },
                          { label:'Low Stock Alerts', value: kpis.low_stock_alerts, sub:'Need attention', color:T.yellow, icon:'⚠️', page:'notifications' },
                        ].map((k,i) => (
                          <motion.div key={k.label} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.06 }}
                            onClick={() => k.page && setActive(k.page)}
                            style={{ ...C, border:`1px solid ${k.color}30`, cursor:'pointer' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                              <div style={{ fontSize:11, color:T.textSub, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', lineHeight:1.4 }}>{k.label}</div>
                              <div style={{ width:32, height:32, borderRadius:9, background:`${k.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>{k.icon}</div>
                            </div>
                            <div style={{ fontSize:'1.9rem', fontWeight:900, color:k.color, marginBottom:4 }}>{k.value}</div>
                            <div style={{ fontSize:11, color:T.a3, fontWeight:600 }}>{k.sub}</div>
                          </motion.div>
                        ))}
                      </div>

                      {/* ── Row 2: Recent Transactions + Stock Alerts ── */}
                      <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:14, marginBottom:18 }}>
                        {/* Recent Transactions — real data */}
                        <div style={C}>
                          <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:14 }}>Recent Transactions</div>
                          {kpis.recent_transactions?.length > 0 ? (
                            <>
                              {kpis.recent_transactions.map((t,i) => (
                                <div key={t.id||i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom: i < kpis.recent_transactions.length-1 ? `1px solid ${T.border}` : 'none' }}>
                                  <div style={{ width:34, height:34, borderRadius:10, background:`${typeColor(t.type)}14`, border:`1px solid ${typeColor(t.type)}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                                    {t.type==='IN'?'📥':t.type==='OUT'?'📤':'🔄'}
                                  </div>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ fontSize:12, fontWeight:700, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                      {t.type==='IN'?'Stock In':'Stock Out'} — {t.sku || `INV-${String(t.id).padStart(4,'0')}`}
                                    </div>
                                    <div style={{ fontSize:11, color:T.textSub, marginTop:1 }}>{t.product}</div>
                                  </div>
                                  <div style={{ textAlign:'right', flexShrink:0 }}>
                                    <div style={{ fontSize:11, color:T.textSub }}>{t.time}</div>
                                    <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99, background:`${T.green}18`, color:T.green, fontWeight:700 }}>Completed</span>
                                  </div>
                                </div>
                              ))}
                              <button onClick={() => setActive('transactions')} style={{ marginTop:10, background:'none', border:'none', color:T.a3, cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'inherit' }}>
                                View all transactions →
                              </button>
                            </>
                          ) : (
                            <div style={{ textAlign:'center', padding:32, color:T.textSub, fontSize:12 }}>
                              No transactions yet.<br />
                              <button onClick={() => setActive('transactions')} style={{ marginTop:8, background:'none', border:'none', color:T.a3, cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700 }}>
                                Log your first transaction →
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Stock Alerts — real data */}
                        <div style={C}>
                          <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:14 }}>Stock Alerts</div>
                          {kpis.stock_alerts?.length > 0 ? (
                            <>
                              {kpis.stock_alerts.map((a,i) => {
                                const sc = a.status === 'critical' ? T.red : T.yellow;
                                return (
                                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom: i < kpis.stock_alerts.length-1 ? `1px solid ${T.border}` : 'none' }}>
                                    <div style={{ width:32, height:32, borderRadius:9, background:`${sc}14`, border:`1px solid ${sc}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                                      {a.status==='critical'?'🔴':'🟡'}
                                    </div>
                                    <div style={{ flex:1, minWidth:0 }}>
                                      <div style={{ fontSize:12, fontWeight:700, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</div>
                                      <div style={{ fontSize:10, color:T.textSub, marginTop:1 }}>{a.warehouse}</div>
                                    </div>
                                    <span style={{ fontSize:11, color:sc, fontWeight:700, flexShrink:0, whiteSpace:'nowrap' }}>Only {a.stock} left</span>
                                  </div>
                                );
                              })}
                              <button onClick={() => setActive('notifications')} style={{ marginTop:10, background:'none', border:'none', color:T.a3, cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'inherit' }}>
                                View all alerts →
                              </button>
                            </>
                          ) : (
                            <div style={{ textAlign:'center', padding:32, color:T.textSub }}>
                              <div style={{ fontSize:28, marginBottom:8 }}>✅</div>
                              <div style={{ fontSize:12 }}>All stock levels are healthy!</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ── Row 3: Quick Actions + Inline AI ── */}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                        {/* Quick Actions */}
                        <div style={C}>
                          <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:14 }}>Quick Actions</div>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                            {[
                              { icon:'📥', label:'Stock In',      action: () => setActive('transactions') },
                              { icon:'📤', label:'Stock Out',     action: () => setActive('transactions') },
                              { icon:'🔍', label:'Stock Lookup',  action: () => setActive('stock-lookup') },
                              { icon:'📊', label:'Reports',       action: () => setActive('reports') },
                            ].map(a => (
                              <button key={a.label} onClick={a.action}
                                style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, padding:'14px 8px', borderRadius:12, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)', cursor:'pointer', fontFamily:'inherit', transition:'all .18s' }}>
                                <span style={{ fontSize:24 }}>{a.icon}</span>
                                <span style={{ fontSize:11, color:T.textMid, fontWeight:600, textAlign:'center', lineHeight:1.3 }}>{a.label}</span>
                              </button>
                            ))}
                          </div>

                          {/* Low stock warning banner */}
                          {kpis.low_stock_alerts > 0 && (
                            <div style={{ marginTop:14, padding:'12px 14px', borderRadius:10, background:`${T.yellow}0E`, border:`1px solid ${T.yellow}33`, display:'flex', alignItems:'center', gap:10 }}>
                              <span style={{ fontSize:18 }}>⚠️</span>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:12, fontWeight:700, color:T.text }}>{kpis.low_stock_alerts} item(s) running low</div>
                                <div style={{ fontSize:11, color:T.textSub, marginTop:1 }}>Check notifications to alert admin.</div>
                              </div>
                              <button onClick={() => setActive('notifications')}
                                style={{ padding:'6px 12px', borderRadius:8, border:'none', background:T.yellow, color:'#000', fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                                View →
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Inline AI Assistant — connected to real backend */}
                        <div style={{ ...C, border:`1px solid ${T.a3}28` }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                            <div style={{ width:30, height:30, borderRadius:9, background:accentGrad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>✨</div>
                            <div style={{ fontWeight:800, fontSize:14, color:T.text }}>AI Assistant</div>
                            <span style={{ marginLeft:'auto', fontSize:10, padding:'2px 8px', borderRadius:99, background:`${T.green}18`, color:T.green, fontWeight:700 }}>● Online</span>
                          </div>

                          {aiReply && (
                            <div style={{ padding:'10px 12px', borderRadius:10, background: darkMode?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.04)', border:`1px solid ${T.border}`, marginBottom:12, fontSize:12, color:T.textMid, lineHeight:1.65, maxHeight:100, overflowY:'auto' }}>
                              {aiReply}
                            </div>
                          )}

                          <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                            <input value={aiInput} onChange={e => setAiInput(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleAskAI()}
                              placeholder="Ask anything about inventory…"
                              style={{ flex:1, padding:'10px 12px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:12, outline:'none', fontFamily:'inherit' }} />
                            <button onClick={handleAskAI} disabled={aiLoading || !aiInput.trim()}
                              style={{ padding:'10px 16px', borderRadius:9, border:'none', background: (aiLoading||!aiInput.trim())?T.border:accentGrad, color:'#fff', fontWeight:700, fontSize:13, cursor:(aiLoading||!aiInput.trim())?'not-allowed':'pointer', fontFamily:'inherit', whiteSpace:'nowrap', flexShrink:0 }}>
                              {aiLoading ? '…' : 'Ask'}
                            </button>
                          </div>

                          {/* Quick prompts */}
                          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                            {["What to reorder?", "Low stock items", "Today's summary"].map(q => (
                              <button key={q} onClick={() => setAiInput(q)}
                                style={{ padding:'4px 10px', borderRadius:99, border:`1px solid ${T.a3}44`, background:`${T.a3}0E`, color:T.a3, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                                {q}
                              </button>
                            ))}
                          </div>

                          <button onClick={() => setActive('ai')}
                            style={{ marginTop:12, background:'none', border:'none', color:T.a3, cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'inherit', display:'block' }}>
                            Open full AI Assistant →
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {active === 'stock-lookup'  && <ProductsPage      T={T} darkMode={darkMode} isAdmin={false} />}
              {active === 'transactions'  && <TransactionsPage  T={T} darkMode={darkMode} isAdmin={false} />}
              {active === 'reports'       && <ReportsPage       T={T} darkMode={darkMode} />}
              {active === 'ai'            && <AIAssistantPage   T={T} darkMode={darkMode} isAdmin={false} />}
              {active === 'notifications' && <NotificationsPage T={T} darkMode={darkMode} isAdmin={false} />}
              {active === 'messages'      && <MessagesPage      T={T} darkMode={darkMode} isAdmin={false} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Profile/Settings/Password Modals */}
      <AnimatePresence>
        {modal === 'profile'  && <ProfileModal        T={T} darkMode={darkMode} onClose={() => setModal(null)} />}
        {modal === 'settings' && <SettingsModal       T={T} darkMode={darkMode} onClose={() => setModal(null)} onToggleDarkMode={onToggleDarkMode} />}
        {modal === 'password' && <ChangePasswordModal T={T} darkMode={darkMode} onClose={() => setModal(null)} />}
      </AnimatePresence>
    </div>
  );
}