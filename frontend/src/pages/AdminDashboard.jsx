import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DARK, LIGHT, globalStyles } from '../theme';
import { LineChart, BarChart, DonutChart } from '../components/Charts';
import { dashboardService, reportService, notificationService, searchService } from '../api/inventoryService';
import { ProfileModal, SettingsModal, ChangePasswordModal } from '../components/ProfileModal';

import ProductsPage       from './ProductsPage';
import SuppliersPage      from './SuppliersPage';
import TransactionsPage   from './TransactionsPage';
import NotificationsPage  from './NotificationsPage';
import ReportsPage        from './ReportsPage';
import AIAssistantPage    from './AIAssistantPage';
import WarehousePage      from './WarehousePage';
import UserManagementPage from './UserManagementPage';
import MessagesPage       from './MessagesPage';
import HistoryPage        from './HistoryPage';

const ADMIN_NAV = [
  { id:'overview',      icon:'🏠', label:'Overview' },
  { id:'products',      icon:'📦', label:'Products' },
  { id:'suppliers',     icon:'🤝', label:'Suppliers' },
  { id:'warehouses',    icon:'🏭', label:'Warehouses' },
  { id:'transactions',  icon:'🔄', label:'Transactions' },
  { id:'reports',       icon:'📊', label:'Reports' },
  { id:'users',         icon:'👥', label:'Users' },
  { id:'notifications', icon:'🔔', label:'Alerts & Notifications' },
  { id:'history',       icon:'📜', label:'Audit History' },
  { id:'messages',      icon:'💬', label:'User Messages' },
  { id:'ai',            icon:'✨', label:'AI Assistant' },
];

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DONUT_COLORS = ['#4F8EF7','#9B6DFF','#00D4B4','#FF6B35','#F59E0B'];

const fmt = (v) => {
  if (!v) return '₹0';
  if (v >= 10000000) return `₹${(v/10000000).toFixed(1)}Cr`;
  if (v >= 100000)   return `₹${(v/100000).toFixed(1)}L`;
  if (v >= 1000)     return `₹${(v/1000).toFixed(1)}K`;
  return `₹${v}`;
};

export default function AdminDashboard({ darkMode, onToggleDarkMode, onLogout, adminName = 'Admin' }) {
  const T = darkMode ? DARK : LIGHT;
  const [active, setActive]     = useState('overview');
  const [sideOpen, setSideOpen] = useState(true);
  const [kpis, setKpis]         = useState(null);
  const [revData, setRevData]   = useState(new Array(12).fill(0));
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // 'profile'|'settings'|'password'

  // Search state
  const [searchVal, setSearchVal]     = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching]     = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
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

  // Admin uses purple/blue — visually distinct from user teal/blue
  const accentGrad = `linear-gradient(135deg,${T.a2},${T.a1})`;
  const C = { background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [kpiRes, revRes, notifRes] = await Promise.all([
        dashboardService.getAdminKPIs(),
        reportService.getRevenueReport({ period: 'monthly' }),
        notificationService.getAll(),
      ]);
      if (kpiRes.data)   setKpis(kpiRes.data);
      if (revRes.data)   setRevData(revRes.data.monthly || new Array(12).fill(0));
      if (notifRes.data) setNotifications(Array.isArray(notifRes.data) ? notifRes.data : notifRes.data?.notifications || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  // Debounced global search
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
    setActive(r.page);
    setSearchVal('');
    setSearchResults(null);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const kpiCards = kpis ? [
    { label:'Total Revenue (This Month)', value: fmt(kpis.total_revenue_this_month), sub: '↑ From stock-out transactions', color: T.a1, icon:'💰', page:'reports' },
    { label:'Total Products',             value: kpis.total_products,                sub: 'Across all warehouses',          color: T.a2, icon:'📦', page:'products' },
    { label:'Low Stock Alerts',           value: kpis.low_stock_alerts,              sub: 'Needs immediate action',          color: T.red, icon:'⚠️', page:'notifications' },
    { label:'Total Users',                value: kpis.total_users,                   sub: `${kpis.active_users} active`,    color: T.green, icon:'👥', page:'users' },
  ] : [];

  return (
    <div style={{ display:'flex', height:'100vh', background:T.bg, color:T.text, fontFamily:'"DM Sans","Inter",system-ui,sans-serif', overflow:'hidden' }}>
      <style>{globalStyles(T, darkMode)}</style>

      {/* ── SIDEBAR ── fixed height, independent scroll */}
      <motion.aside
        animate={{ width: sideOpen ? 240 : 64 }}
        transition={{ duration:.28, ease:[.22,1,.36,1] }}
        style={{ background: T.bgCard2, borderRight:`1px solid ${T.border}`, display:'flex', flexDirection:'column', height:'100vh', flexShrink:0, overflow:'hidden', zIndex:50 }}>

        {/* Logo */}
        <div style={{ padding:'0 12px', height:64, display:'flex', alignItems:'center', gap:10, borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:accentGrad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🛡️</div>
          <AnimatePresence>{sideOpen && (
            <motion.div initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-8 }}>
              <div style={{ fontWeight:900, fontSize:14, color:T.text, whiteSpace:'nowrap' }}>InventIQ AI</div>
              <div style={{ fontSize:10, color:T.a2, fontWeight:700 }}>Admin Console</div>
            </motion.div>
          )}</AnimatePresence>
        </div>

        {/* Nav items — scrollable */}
        <div style={{ flex:1, overflowY:'auto', padding:'10px 8px' }}>
          {ADMIN_NAV.map(n => {
            const isActive = active === n.id;
            return (
              <motion.button key={n.id} whileTap={{ scale:.97 }} onClick={() => setActive(n.id)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 10px', borderRadius:10, border:'none', cursor:'pointer', fontFamily:'inherit', marginBottom:3, background: isActive?`${T.a2}18`:'transparent', transition:'background .15s', position:'relative' }}>
                <span style={{ fontSize:17, flexShrink:0, width:24, textAlign:'center' }}>{n.icon}</span>
                <AnimatePresence>{sideOpen && (
                  <motion.span initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-6 }}
                    style={{ fontSize:13, fontWeight: isActive?700:500, color: isActive?T.a2:T.textMid, whiteSpace:'nowrap' }}>
                    {n.label}
                  </motion.span>
                )}</AnimatePresence>
                {isActive && <motion.div layoutId="adminBar" style={{ position:'absolute', left:0, top:6, bottom:6, width:3, borderRadius:99, background:T.a2 }} />}
                {n.id === 'notifications' && unreadCount > 0 && sideOpen && (
                  <span style={{ marginLeft:'auto', background:T.red, color:'#fff', borderRadius:99, padding:'1px 7px', fontSize:10, fontWeight:700 }}>{unreadCount}</span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* System status + collapse */}
        <div style={{ borderTop:`1px solid ${T.border}`, flexShrink:0 }}>
          {sideOpen && (
            <div style={{ padding:'12px 16px', borderBottom:`1px solid ${T.border}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:T.textSub, marginBottom:6 }}>System Status</div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:T.green, animation:'pulse 2s infinite' }} />
                <span style={{ fontSize:11, color:T.green, fontWeight:600 }}>All Systems Operational</span>
              </div>
            </div>
          )}
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
              Welcome back, {adminName} 🛡️
            </div>
            <div style={{ fontSize:11, color:T.textSub }}>
              Administrator · Full system control · {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Working Search */}
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:13, pointerEvents:'none' }}>🔍</span>
              <input
                value={searchVal}
                onChange={e => handleSearch(e.target.value)}
                onKeyDown={e => { if(e.key==='Escape'){setSearchVal('');setSearchResults(null);} }}
                placeholder="Search anything…"
                style={{ padding:'8px 32px 8px 30px', borderRadius:9, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)', color:T.text, fontSize:13, width:230, outline:'none', fontFamily:'inherit' }}
              />
              {searchVal && (
                <button onClick={() => { setSearchVal(''); setSearchResults(null); }}
                  style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:13, color:T.textSub }}>✕</button>
              )}
              {/* Results dropdown */}
              <AnimatePresence>
                {searchResults !== null && (
                  <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:6 }}
                    style={{ position:'absolute', top:44, left:0, width:380, background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:12, boxShadow:'0 16px 40px rgba(0,0,0,.4)', zIndex:500, overflow:'hidden', maxHeight:320, overflowY:'auto' }}>
                    {searching && <div style={{ padding:'14px 16px', color:T.textSub, fontSize:13 }}>Searching…</div>}
                    {!searching && searchResults.length === 0 && (
                      <div style={{ padding:'14px 16px', color:T.textSub, fontSize:13 }}>No results for "{searchVal}"</div>
                    )}
                    {!searching && searchResults.map((r,i) => (
                      <button key={i} onClick={() => handleResultClick(r)}
                        style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'11px 16px', border:'none', background:'transparent', cursor:'pointer', fontFamily:'inherit', borderBottom:`1px solid ${T.border}`, textAlign:'left' }}>
                        <span style={{ fontSize:20, flexShrink:0 }}>{r.icon}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.title}</div>
                          <div style={{ fontSize:11, color:T.textSub, marginTop:1 }}>{r.subtitle}</div>
                        </div>
                        <span style={{ fontSize:10, padding:'2px 8px', borderRadius:99, background:`${T.a1}18`, color:T.a1, fontWeight:700, flexShrink:0, textTransform:'capitalize' }}>{r.type}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dark mode */}
            <button onClick={onToggleDarkMode}
              style={{ background: darkMode?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.06)', border:`1px solid ${T.border}`, borderRadius:8, padding:'7px 11px', cursor:'pointer', fontSize:15 }}>
              {darkMode ? '☀️' : '🌙'}
            </button>

            {/* Notifications bell */}
            <div ref={notifRef} style={{ position:'relative' }}>
              <button onClick={() => { setNotifOpen(v=>!v); setProfileOpen(false); }}
                style={{ background: darkMode?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.06)', border:`1px solid ${T.border}`, borderRadius:8, padding:'7px 11px', cursor:'pointer', fontSize:15, position:'relative' }}>
                🔔
                {unreadCount > 0 && <span style={{ position:'absolute', top:3, right:3, width:8, height:8, borderRadius:'50%', background:T.red, border:`2px solid ${T.bgCard}` }} />}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div initial={{ opacity:0, y:8, scale:.96 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:8 }}
                    style={{ position:'absolute', right:0, top:46, width:320, background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, boxShadow:'0 16px 40px rgba(0,0,0,.35)', zIndex:300, overflow:'hidden' }}>
                    <div style={{ padding:'14px 16px', borderBottom:`1px solid ${T.border}`, fontWeight:800, fontSize:13, color:T.text, display:'flex', justifyContent:'space-between' }}>
                      Notifications <span style={{ fontSize:11, color:T.red }}>{unreadCount} new</span>
                    </div>
                    {notifications.length === 0 && <div style={{ padding:'16px', fontSize:13, color:T.textSub, textAlign:'center' }}>No notifications yet</div>}
                    {notifications.slice(0,5).map((n,i) => (
                      <div key={i} style={{ padding:'10px 16px', borderBottom:`1px solid ${T.border}`, display:'flex', gap:10 }}>
                        <span style={{ fontSize:16 }}>{n.icon || (n.type==='critical'?'🚨':n.type==='warning'?'⚠️':'✅')}</span>
                        <div>
                          <div style={{ fontSize:12, color:T.textMid }}>{n.message}</div>
                          <div style={{ fontSize:10, color:T.textSub, marginTop:2 }}>{n.time || n.created_at}</div>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => { setActive('notifications'); setNotifOpen(false); }}
                      style={{ width:'100%', padding:'11px', background:'transparent', border:'none', borderTop:`1px solid ${T.border}`, cursor:'pointer', fontSize:12, color:T.a1, fontWeight:700, fontFamily:'inherit' }}>
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
                  background: profileOpen ? `${T.a2}0E` : 'none',
                  border: `1px solid ${profileOpen ? T.a2 + '55' : 'transparent'}`,
                  borderRadius:99, cursor:'pointer', padding:'5px 10px 5px 5px', transition:'all .15s', fontFamily:'inherit',
                }}>
                <div style={{ position:'relative', width:34, height:34, flexShrink:0 }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', background:accentGrad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900, color:'#fff' }}>
                    {(adminName||'A')[0].toUpperCase()}
                  </div>
                  <div style={{ position:'absolute', bottom:-1, right:-1, width:10, height:10, borderRadius:'50%', background:T.green, border:`2px solid ${T.bgCard}` }} />
                </div>
                <div style={{ textAlign:'left' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:T.text }}>{adminName}</div>
                  <div style={{ fontSize:10, color:T.a2, fontWeight:700 }}>Administrator</div>
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
                          {(adminName||'A')[0].toUpperCase()}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:800, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{adminName}</div>
                        </div>
                      </div>
                      <div style={{ display:'inline-flex', alignItems:'center', gap:5, marginTop:10, padding:'3px 9px', borderRadius:99, background:`${T.a2}18`, fontSize:10.5, fontWeight:700, color:T.a2 }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:T.a2 }} />
                        Administrator
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

        {/* ── MAIN CONTENT — scrollable ── */}
        <main style={{ flex:1, overflowY:'auto', padding:'22px 26px' }}>
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:.18 }}>

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
                      {/* KPI row */}
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:18 }}>
                        {kpiCards.map((k,i) => (
                          <motion.div key={k.label} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.06 }}
                            onClick={() => k.page && setActive(k.page)}
                            style={{ ...C, border:`1px solid ${k.color}30`, cursor:'pointer' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                              <div style={{ fontSize:11, color:T.textSub, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', lineHeight:1.4, maxWidth:120 }}>{k.label}</div>
                              <div style={{ width:34, height:34, borderRadius:10, background:`${k.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{k.icon}</div>
                            </div>
                            <div style={{ fontSize:'1.7rem', fontWeight:900, color:k.color, marginBottom:4 }}>{k.value}</div>
                            <div style={{ fontSize:11, color:T.textSub }}>{k.sub}</div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Revenue + Stock Value */}
                      <div style={{ display:'grid', gridTemplateColumns:'1.7fr 1fr', gap:14, marginBottom:18 }}>
                        <div style={C}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                            <div>
                              <div style={{ fontWeight:800, fontSize:14, color:T.text }}>Revenue Overview</div>
                              <div style={{ fontSize:11, color:T.textSub, marginTop:2 }}>Monthly revenue (₹L)</div>
                            </div>
                            <span style={{ fontSize:11, padding:'3px 10px', borderRadius:99, background:`${T.a1}18`, color:T.a1, fontWeight:700 }}>This Year</span>
                          </div>
                          {revData.some(v=>v>0)
                            ? <LineChart series={[{ data:revData, color:T.a1, fill:true }]} h={140} labels={months} />
                            : <div style={{ textAlign:'center', padding:36, color:T.textSub, fontSize:12 }}>Log stock-out transactions to see revenue.</div>
                          }
                        </div>

                        <div style={C}>
                          <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:4 }}>Stock Value</div>
                          <div style={{ fontSize:11, color:T.textSub, marginBottom:14 }}>By category</div>
                          {kpis.categories?.length > 0 ? (
                            <>
                              <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
                                <div style={{ position:'relative' }}>
                                  <DonutChart slices={kpis.categories.map((c,i)=>({ v:c.value||0.1, c:DONUT_COLORS[i%DONUT_COLORS.length] }))} size={120} />
                                  <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                                    <div style={{ fontSize:13, fontWeight:900, color:T.text }}>{fmt(kpis.total_stock_value)}</div>
                                    <div style={{ fontSize:9, color:T.textSub }}>Total Value</div>
                                  </div>
                                </div>
                              </div>
                              {kpis.categories.slice(0,4).map((c,i) => (
                                <div key={c.name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                                    <div style={{ width:8, height:8, borderRadius:'50%', background:DONUT_COLORS[i%DONUT_COLORS.length] }} />
                                    <span style={{ fontSize:11, color:T.textMid }}>{c.name}</span>
                                  </div>
                                  <span style={{ fontSize:11, fontWeight:700, color:T.text }}>₹{c.value}L</span>
                                </div>
                              ))}
                            </>
                          ) : (
                            <div style={{ textAlign:'center', padding:36, color:T.textSub, fontSize:12 }}>Add products with categories.</div>
                          )}
                        </div>
                      </div>

                      {/* Top Products + Warehouse Utilization */}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:18 }}>
                        <div style={C}>
                          <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:14 }}>Top Selling Products</div>
                          {kpis.top_products?.length > 0 ? (
                            <>
                              <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:'6px 12px', marginBottom:8 }}>
                                {['Product','Units Sold','Revenue'].map(h=>(
                                  <div key={h} style={{ fontSize:10, fontWeight:700, color:T.textSub, textTransform:'uppercase', letterSpacing:'.06em' }}>{h}</div>
                                ))}
                              </div>
                              {kpis.top_products.map((p,i) => (
                                <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:'6px 12px', padding:'8px 0', borderBottom:`1px solid ${T.border}`, alignItems:'center' }}>
                                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                    <div style={{ width:26, height:26, borderRadius:7, background:`${T.a1}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, flexShrink:0 }}>📦</div>
                                    <span style={{ fontSize:12, color:T.text, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</span>
                                  </div>
                                  <span style={{ fontSize:12, color:T.a1, fontWeight:700, textAlign:'right' }}>{p.units_sold}</span>
                                  <span style={{ fontSize:12, color:T.green, fontWeight:700, textAlign:'right' }}>{fmt(p.revenue)}</span>
                                </div>
                              ))}
                              <button onClick={()=>setActive('reports')} style={{ marginTop:10, background:'none', border:'none', color:T.a1, cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'inherit' }}>View full report →</button>
                            </>
                          ) : (
                            <div style={{ textAlign:'center', padding:32, color:T.textSub, fontSize:12 }}>Log stock-out transactions to see top products.</div>
                          )}
                        </div>

                        <div style={C}>
                          <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:14 }}>Warehouse Utilization</div>
                          {kpis.warehouses?.length > 0 ? (
                            <>
                              <BarChart
                                data={kpis.warehouses.map(w=>w.total_stock||0)}
                                colors={kpis.warehouses.map((_,i)=>DONUT_COLORS[i%DONUT_COLORS.length])}
                                labels={kpis.warehouses.map(w=>w.warehouse.length>6?w.warehouse.slice(0,6):w.warehouse)}
                                h={130} />
                              <div style={{ display:'flex', gap:12, marginTop:10, flexWrap:'wrap' }}>
                                {kpis.warehouses.map((w,i)=>(
                                  <div key={w.warehouse} style={{ display:'flex', alignItems:'center', gap:5 }}>
                                    <div style={{ width:8, height:8, borderRadius:'50%', background:DONUT_COLORS[i%DONUT_COLORS.length] }} />
                                    <span style={{ fontSize:10, color:T.textSub }}>{w.warehouse}</span>
                                  </div>
                                ))}
                              </div>
                              <button onClick={()=>setActive('warehouses')} style={{ marginTop:10, background:'none', border:'none', color:T.a1, cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'inherit' }}>View all warehouses →</button>
                            </>
                          ) : (
                            <div style={{ textAlign:'center', padding:32, color:T.textSub, fontSize:12 }}>Assign warehouses to products to see utilization.</div>
                          )}
                        </div>
                      </div>

                      {/* Recent Activity + AI Insights */}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:18 }}>
                        <div style={C}>
                          <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:14 }}>Recent System Activity</div>
                          {kpis.recent_activity?.length > 0 ? (
                            <>
                              {kpis.recent_activity.map((a,i)=>(
                                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:i<kpis.recent_activity.length-1?`1px solid ${T.border}`:'none' }}>
                                  <div style={{ width:30, height:30, borderRadius:8, background:`${T.a1}14`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>{a.icon}</div>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ fontSize:12, color:T.text, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.text}</div>
                                    <div style={{ fontSize:10, color:T.textSub, marginTop:1 }}>by {a.by}</div>
                                  </div>
                                  <div style={{ fontSize:10, color:T.textSub, whiteSpace:'nowrap', flexShrink:0 }}>{a.time}</div>
                                </div>
                              ))}
                              <button onClick={()=>setActive('transactions')} style={{ marginTop:10, background:'none', border:'none', color:T.a1, cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'inherit' }}>View all activities →</button>
                            </>
                          ) : (
                            <div style={{ textAlign:'center', padding:32, color:T.textSub, fontSize:12 }}>No recent activity yet.</div>
                          )}
                        </div>

                        <div style={{ ...C, border:`1px solid ${T.a2}28` }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                            <div style={{ width:30, height:30, borderRadius:9, background:accentGrad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>✨</div>
                            <div style={{ fontWeight:800, fontSize:14, color:T.text }}>AI Insights</div>
                          </div>
                          {[
                            kpis.low_stock_alerts > 0 && { icon:'⚠️', color:T.yellow, text:`${kpis.low_stock_alerts} products are low on stock.`, sub:'Reorder suggested.' },
                            kpis.warehouses?.length > 0 && { icon:'🏭', color:T.a3, text:`${kpis.warehouses[0]?.warehouse} has highest stock.`, sub:`${kpis.warehouses[0]?.total_stock?.toLocaleString()} units.` },
                            kpis.total_revenue_this_month > 0 && { icon:'📈', color:T.green, text:`${fmt(kpis.total_revenue_this_month)} revenue this month.`, sub:'From stock-out transactions.' },
                          ].filter(Boolean).map((ins,i) => ins && (
                            <div key={i} style={{ padding:'10px 12px', borderRadius:10, background:`${ins.color}0E`, border:`1px solid ${ins.color}28`, marginBottom:8 }}>
                              <div style={{ display:'flex', gap:8 }}>
                                <span style={{ fontSize:15 }}>{ins.icon}</span>
                                <div>
                                  <div style={{ fontSize:12, fontWeight:700, color:ins.color }}>{ins.text}</div>
                                  <div style={{ fontSize:11, color:T.textSub, marginTop:1 }}>{ins.sub}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {kpis.low_stock_alerts === 0 && (
                            <div style={{ padding:'10px 12px', borderRadius:10, background:`${T.green}0E`, border:`1px solid ${T.green}28` }}>
                              <div style={{ fontSize:12, fontWeight:700, color:T.green }}>✅ All stock levels are healthy!</div>
                              <div style={{ fontSize:11, color:T.textSub, marginTop:1 }}>No immediate reorders needed.</div>
                            </div>
                          )}
                          <button onClick={()=>setActive('ai')} style={{ marginTop:12, background:'none', border:'none', color:T.a2, cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'inherit' }}>Ask AI Assistant →</button>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div style={C}>
                        <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:14 }}>Quick Actions</div>
                        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                          {[
                            { icon:'📦', label:'Add Product',   page:'products' },
                            { icon:'🤝', label:'Add Supplier',  page:'suppliers' },
                            { icon:'📋', label:'Create PO',     page:'transactions' },
                            { icon:'📊', label:'Generate Report',page:'reports' },
                            { icon:'👥', label:'Manage Users',  page:'users' },
                            { icon:'⚙️', label:'Settings',       action:()=>setModal('settings') },
                          ].map(a => (
                            <button key={a.label} onClick={a.action||(() => setActive(a.page))}
                              style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 16px', borderRadius:10, border:`1px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)', cursor:'pointer', fontFamily:'inherit', color:T.text, fontSize:13, fontWeight:600 }}>
                              <span style={{ fontSize:16 }}>{a.icon}</span>{a.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {active === 'products'      && <ProductsPage       T={T} darkMode={darkMode} isAdmin={true} />}
              {active === 'suppliers'     && <SuppliersPage      T={T} darkMode={darkMode} isAdmin={true} />}
              {active === 'warehouses'    && <WarehousePage      T={T} darkMode={darkMode} />}
              {active === 'transactions'  && <TransactionsPage   T={T} darkMode={darkMode} isAdmin={true} />}
              {active === 'reports'       && <ReportsPage        T={T} darkMode={darkMode} />}
              {active === 'users'         && <UserManagementPage T={T} darkMode={darkMode} />}
              {active === 'ai'            && <AIAssistantPage    T={T} darkMode={darkMode} isAdmin={true} />}
              {active === 'notifications' && <NotificationsPage  T={T} darkMode={darkMode} isAdmin={true} />}
              {active === 'history'       && <HistoryPage        T={T} darkMode={darkMode} />}
              {active === 'messages'      && <MessagesPage       T={T} darkMode={darkMode} isAdmin={true} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Profile/Settings/Password Modals */}
      <AnimatePresence>
        {modal === 'profile'  && <ProfileModal       T={T} darkMode={darkMode} onClose={()=>setModal(null)} />}
        {modal === 'settings' && <SettingsModal      T={T} darkMode={darkMode} onClose={()=>setModal(null)} onToggleDarkMode={onToggleDarkMode} />}
        {modal === 'password' && <ChangePasswordModal T={T} darkMode={darkMode} onClose={()=>setModal(null)} />}
      </AnimatePresence>
    </div>
  );
}