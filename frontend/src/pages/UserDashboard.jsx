import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DARK, LIGHT, globalStyles } from '../theme';
import { Sidebar, Topbar } from '../components/Layout';
import { LineChart, BarChart } from '../components/Charts';
import { dashboardService, reportService, notificationService, transactionService } from '../api/inventoryService';

import ProductsPage      from './ProductsPage';
import TransactionsPage  from './TransactionsPage';
import NotificationsPage from './NotificationsPage';
import ReportsPage       from './ReportsPage';
import AIAssistantPage   from './AIAssistantPage';

// User dashboard has FEWER nav items than admin (no suppliers, warehouses, user mgmt)
const USER_NAV = [
  { id:'overview',     icon:'🏠', label:'Overview' },
  { id:'products',     icon:'📦', label:'Products' },
  { id:'transactions', icon:'🔄', label:'My Transactions' },
  { id:'reports',      icon:'📊', label:'Reports' },
  { id:'ai',           icon:'✨', label:'AI Assistant' },
  { id:'notifications',icon:'🔔', label:'Notifications' },
];

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function UserDashboard({ darkMode, onToggleDarkMode, onLogout, userName = 'User' }) {
  const T = darkMode ? DARK : LIGHT;
  const [active, setActive]     = useState('overview');
  const [sideOpen, setSideOpen] = useState(true);
  const [kpis, setKpis]         = useState(null);
  const [myTxns, setMyTxns]     = useState([]);
  const [stockIn, setStockIn]   = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // User accent — teal/blue gradient (different from admin purple)
  const accentGrad = `linear-gradient(135deg,${T.a3},${T.a1})`;
  const card = { background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: 22 };

  useEffect(() => {
    const fetchAll = async () => {
      setLoadingKpis(true);
      const [kpiRes, txnRes, invRes, notifRes] = await Promise.all([
        dashboardService.getUserKPIs(),
        transactionService.getAll(),
        reportService.getInventoryReport({ period: 'monthly' }),
        notificationService.getAll(),
      ]);
      if (kpiRes.data)   setKpis(kpiRes.data);
      if (txnRes.data) {
        const all = Array.isArray(txnRes.data) ? txnRes.data : txnRes.data?.transactions || [];
        setMyTxns(all.slice(0, 5)); // last 5 transactions
      }
      if (invRes.data)   setStockIn(invRes.data.stock_in || []);
      if (notifRes.data) setNotifications(Array.isArray(notifRes.data) ? notifRes.data : notifRes.data?.notifications || []);
      setLoadingKpis(false);
    };
    fetchAll();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSearch = (q) => {
    setSearchQuery(q);
    if (q.trim()) setActive('products');
  };

  const kpiCards = kpis ? [
    { label:'Total Products',   value: kpis.assigned_products, color: T.a1,    icon:'📦', page:'products' },
    { label:'Low Stock Alerts', value: kpis.low_stock_alerts,  color: T.red,   icon:'⚠️', page:'notifications' },
    { label:'My Transactions',  value: kpis.my_transactions,   color: T.a3,    icon:'🔄', page:'transactions' },
    { label:'Pending Orders',   value: kpis.pending_orders,    color: T.yellow,icon:'📋', page:'transactions' },
  ] : [];

  const txnTypeColor = (t) => t==='IN'?T.green:t==='OUT'?T.red:T.a3;

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:T.bg, color:T.text, fontFamily:'"DM Sans","Inter",system-ui,sans-serif', overflow:'hidden' }}>
      <style>{globalStyles(T, darkMode)}</style>

      <Sidebar nav={USER_NAV} active={active} setActive={setActive} sideOpen={sideOpen} setSideOpen={setSideOpen}
        darkMode={darkMode} T={T} accentGrad={accentGrad} logoIcon="📦" consoleLabel="User Console" />

      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <Topbar nav={USER_NAV} active={active} T={T} darkMode={darkMode}
          onToggleDarkMode={onToggleDarkMode} onLogout={onLogout}
          userName={userName} roleLabel="Inventory User"
          notifications={notifications} unreadCount={unreadCount}
          accentGrad={accentGrad}
          onSearch={handleSearch}
          setActivePage={setActive} />

        <main style={{ flex:1, overflowY:'auto', padding:'28px 32px' }}>
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:.2 }}>

              {/* ── OVERVIEW ───────────────────────────── */}
              {active === 'overview' && (
                <div>
                  <div style={{ marginBottom:24 }}>
                    <h1 style={{ fontSize:'1.5rem', fontWeight:900, color:T.text, letterSpacing:'-.03em' }}>
                      Good {new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'}, {userName} 👋
                    </h1>
                    <p style={{ fontSize:13, color:T.textSub, marginTop:4 }}>
                      Inventory User · Here's your workspace snapshot
                    </p>
                  </div>

                  {loadingKpis && <div style={{ textAlign:'center', padding:48, color:T.textSub }}>Loading dashboard…</div>}

                  {!loadingKpis && !kpis && (
                    <div style={{ ...card, textAlign:'center', padding:48, color:T.textSub }}>
                      <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
                      <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:8 }}>Cannot connect to backend</div>
                      <div style={{ fontSize:13 }}>Make sure FastAPI is running at http://127.0.0.1:8000</div>
                    </div>
                  )}

                  {!loadingKpis && kpis && (
                    <>
                      {/* KPI cards */}
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
                        {kpiCards.map((k,i) => (
                          <motion.div key={k.label} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.06 }}
                            onClick={() => k.page && setActive(k.page)}
                            style={{ ...card, border:`1px solid ${k.color}28`, textAlign:'center', padding:'22px 16px', cursor: k.page?'pointer':'default' }}>
                            <div style={{ fontSize:28, marginBottom:8 }}>{k.icon}</div>
                            <div style={{ fontSize:'1.8rem', fontWeight:900, color:k.color }}>{k.value}</div>
                            <div style={{ fontSize:12, color:T.textSub, marginTop:4 }}>{k.label}</div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Charts + Recent transactions */}
                      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:18, marginBottom:18 }}>
                        <div style={card}>
                          <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:4 }}>Stock IN This Year</div>
                          <div style={{ fontSize:11, color:T.textSub, marginBottom:14 }}>Units received across all warehouses</div>
                          {stockIn.some(v => v > 0)
                            ? <LineChart series={[{ data:stockIn, color:T.a3, fill:true }]} h={130} labels={months} />
                            : <div style={{ textAlign:'center', padding:28, color:T.textSub, fontSize:12 }}>Log stock-in transactions to see this chart.</div>
                          }
                        </div>

                        <div style={card}>
                          <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:16 }}>Recent Transactions</div>
                          {myTxns.length === 0 ? (
                            <div style={{ textAlign:'center', padding:24, color:T.textSub, fontSize:12 }}>
                              No transactions yet.<br />
                              <button onClick={() => setActive('transactions')} style={{ marginTop:10, background:'none', border:'none', color:T.a1, cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700 }}>Log your first transaction →</button>
                            </div>
                          ) : (
                            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                              {myTxns.map((t,i) => (
                                <div key={t.id||i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, background: darkMode?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)', border:`1px solid ${T.border}` }}>
                                  <span style={{ fontSize:11, padding:'2px 8px', borderRadius:99, background:`${txnTypeColor(t.type)}18`, color:txnTypeColor(t.type), fontWeight:800, flexShrink:0 }}>
                                    {t.type==='IN'?'↓ IN':t.type==='OUT'?'↑ OUT':'⇄ TRF'}
                                  </span>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ fontSize:12, fontWeight:700, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.sku} — {t.product}</div>
                                    <div style={{ fontSize:10, color:T.textSub }}>{t.date}</div>
                                  </div>
                                  <div style={{ fontSize:12, fontWeight:700, color:txnTypeColor(t.type), flexShrink:0 }}>×{t.qty}</div>
                                </div>
                              ))}
                              <button onClick={() => setActive('transactions')}
                                style={{ marginTop:6, background:'none', border:'none', color:T.a1, cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700, textAlign:'left' }}>
                                View all transactions →
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick actions */}
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
                        {[
                          { id:'products',     icon:'📦', label:'View Products',    desc:'Check stock levels and SKUs' },
                          { id:'transactions', icon:'🔄', label:'Log Transaction',  desc:'Record stock in / out movement' },
                          { id:'ai',           icon:'✨', label:'Ask AI Assistant', desc:'Reorder advice, forecasts & more' },
                        ].map(s => (
                          <button key={s.id} onClick={() => setActive(s.id)}
                            style={{ ...card, textAlign:'left', cursor:'pointer', border:`1px solid ${T.border}`, transition:'all .2s', fontFamily:'inherit', color:'inherit' }}>
                            <div style={{ fontSize:24, marginBottom:10 }}>{s.icon}</div>
                            <div style={{ fontWeight:800, fontSize:13, color:T.text, marginBottom:4 }}>{s.label}</div>
                            <div style={{ fontSize:11, color:T.textSub }}>{s.desc}</div>
                          </button>
                        ))}
                      </div>

                      {/* Low stock warning */}
                      {kpis.low_stock_alerts > 0 && (
                        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                          style={{ ...card, border:`1px solid ${T.yellow}44`, background:`${T.yellow}08`, display:'flex', alignItems:'center', gap:14, padding:'16px 20px', marginTop:18 }}>
                          <span style={{ fontSize:24 }}>⚠️</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{kpis.low_stock_alerts} item(s) are running low on stock</div>
                            <div style={{ fontSize:12, color:T.textSub }}>Check Products page for details or notify admin from Notifications.</div>
                          </div>
                          <button onClick={() => setActive('products')}
                            style={{ padding:'8px 16px', borderRadius:8, border:'none', background:T.yellow, color:'#000', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                            View Products →
                          </button>
                        </motion.div>
                      )}
                    </>
                  )}
                </div>
              )}

              {active === 'products'     && <ProductsPage      T={T} darkMode={darkMode} initialSearch={searchQuery} />}
              {active === 'transactions' && <TransactionsPage  T={T} darkMode={darkMode} />}
              {active === 'reports'      && <ReportsPage       T={T} darkMode={darkMode} />}
              {active === 'ai'           && <AIAssistantPage   T={T} darkMode={darkMode} />}
              {active === 'notifications'&& <NotificationsPage T={T} darkMode={darkMode} />}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}