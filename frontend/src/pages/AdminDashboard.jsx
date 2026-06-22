import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DARK, LIGHT, globalStyles } from '../theme';
import { Sidebar, Topbar } from '../components/Layout';
import { LineChart, BarChart } from '../components/Charts';
import { dashboardService, reportService, notificationService } from '../api/inventoryService';

import ProductsPage       from './ProductsPage';
import SuppliersPage      from './SuppliersPage';
import TransactionsPage   from './TransactionsPage';
import NotificationsPage  from './NotificationsPage';
import ReportsPage        from './ReportsPage';
import AIAssistantPage    from './AIAssistantPage';
import WarehousePage      from './WarehousePage';
import UserManagementPage from './UserManagementPage';

const ADMIN_NAV = [
  { id:'overview',    icon:'🏠', label:'Overview' },
  { id:'products',    icon:'📦', label:'Products' },
  { id:'suppliers',   icon:'🤝', label:'Suppliers' },
  { id:'warehouses',  icon:'🏭', label:'Warehouses' },
  { id:'transactions',icon:'🔄', label:'Transactions' },
  { id:'reports',     icon:'📊', label:'Reports' },
  { id:'users',       icon:'👥', label:'User Management' },
  { id:'ai',          icon:'✨', label:'AI Assistant' },
  { id:'notifications',icon:'🔔',label:'Notifications' },
];

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AdminDashboard({ darkMode, onToggleDarkMode, onLogout, adminName = 'Admin' }) {
  const T = darkMode ? DARK : LIGHT;
  const [active, setActive]       = useState('overview');
  const [sideOpen, setSideOpen]   = useState(true);
  const [kpis, setKpis]           = useState(null);
  const [revData, setRevData]     = useState([]);
  const [stockData, setStockData] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Admin accent — purple/blue gradient (different from user green/blue)
  const accentGrad = `linear-gradient(135deg,${T.a2},${T.a1})`;
  const card = { background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: 22 };

  useEffect(() => {
    const fetchAll = async () => {
      setLoadingKpis(true);
      const [kpiRes, revRes, invRes, notifRes] = await Promise.all([
        dashboardService.getAdminKPIs(),
        reportService.getRevenueReport({ period: 'monthly' }),
        reportService.getInventoryReport({ period: 'monthly' }),
        notificationService.getAll(),
      ]);
      if (kpiRes.data)   setKpis(kpiRes.data);
      if (revRes.data)   setRevData(revRes.data.monthly || []);
      if (invRes.data)   setStockData(invRes.data.stock_in || []);
      if (notifRes.data) setNotifications(Array.isArray(notifRes.data) ? notifRes.data : notifRes.data?.notifications || []);
      setLoadingKpis(false);
    };
    fetchAll();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // When search is triggered from Topbar — navigate to products with query
  const handleSearch = (q) => {
    setSearchQuery(q);
    if (q.trim()) setActive('products');
  };

  const kpiCards = kpis ? [
    { label:'Total Products',   value: kpis.total_products,                                      color: T.a2,    icon:'📦', page:'products' },
    { label:'Stock Value',      value: `₹${((kpis.total_stock_value||0)/100000).toFixed(1)}L`,   color: T.a3,    icon:'💰', page:null },
    { label:'Critical Alerts',  value: kpis.critical_alerts,                                     color: T.red,   icon:'🚨', page:'notifications' },
    { label:'Total Suppliers',  value: kpis.total_suppliers,                                     color: T.a1,    icon:'🤝', page:'suppliers' },
    { label:'Pending Orders',   value: kpis.pending_orders,                                      color: T.yellow,icon:'📋', page:'transactions' },
    { label:'Active Users',     value: kpis.active_users,                                        color: T.green, icon:'👥', page:'users' },
  ] : [];

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:T.bg, color:T.text, fontFamily:'"DM Sans","Inter",system-ui,sans-serif', overflow:'hidden' }}>
      <style>{globalStyles(T, darkMode)}</style>

      <Sidebar nav={ADMIN_NAV} active={active} setActive={setActive} sideOpen={sideOpen} setSideOpen={setSideOpen}
        darkMode={darkMode} T={T} accentGrad={accentGrad} logoIcon="🛡️" consoleLabel="Admin Console" />

      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <Topbar nav={ADMIN_NAV} active={active} T={T} darkMode={darkMode}
          onToggleDarkMode={onToggleDarkMode} onLogout={onLogout}
          userName={adminName} roleLabel="Administrator"
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
                      Welcome back, {adminName} 🛡️
                    </h1>
                    <p style={{ fontSize:13, color:T.textSub, marginTop:4 }}>
                      Admin Console — full system control · {new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
                    </p>
                  </div>

                  {loadingKpis && (
                    <div style={{ textAlign:'center', padding:48, color:T.textSub }}>Loading dashboard…</div>
                  )}

                  {!loadingKpis && !kpis && (
                    <div style={{ ...card, textAlign:'center', padding:48, color:T.textSub }}>
                      <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
                      <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:8 }}>Cannot connect to backend</div>
                      <div style={{ fontSize:13 }}>Make sure FastAPI is running at http://127.0.0.1:8000</div>
                    </div>
                  )}

                  {!loadingKpis && kpis && (
                    <>
                      {/* KPI grid */}
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:14, marginBottom:24 }}>
                        {kpiCards.map((k,i) => (
                          <motion.div key={k.label} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.05 }}
                            onClick={() => k.page && setActive(k.page)}
                            style={{ ...card, border:`1px solid ${k.color}28`, textAlign:'center', padding:'18px 12px', cursor: k.page?'pointer':'default', transition:'transform .15s', ':hover':{ transform:'translateY(-2px)' } }}>
                            <div style={{ fontSize:22, marginBottom:6 }}>{k.icon}</div>
                            <div style={{ fontSize:'1.3rem', fontWeight:900, color:k.color }}>{k.value}</div>
                            <div style={{ fontSize:10.5, color:T.textSub, marginTop:3 }}>{k.label}</div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Charts row */}
                      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:18, marginBottom:18 }}>
                        <div style={card}>
                          <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:4 }}>Revenue Trend (₹L)</div>
                          <div style={{ fontSize:11, color:T.textSub, marginBottom:14 }}>Monthly revenue from stock-out transactions</div>
                          {revData.some(v => v > 0)
                            ? <LineChart series={[{ data:revData, color:T.a2, fill:true }]} h={140} labels={months} />
                            : <div style={{ textAlign:'center', padding:32, color:T.textSub, fontSize:12 }}>Log transactions to see revenue data.</div>
                          }
                        </div>
                        <div style={card}>
                          <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:4 }}>Stock IN This Year</div>
                          <div style={{ fontSize:11, color:T.textSub, marginBottom:14 }}>Monthly units received across all warehouses</div>
                          {stockData.some(v => v > 0)
                            ? <BarChart data={stockData} colors={[T.a1]} labels={months.map((m,i) => i%2===0?m:'')} h={140} />
                            : <div style={{ textAlign:'center', padding:32, color:T.textSub, fontSize:12 }}>Log stock-in transactions to populate.</div>
                          }
                        </div>
                      </div>

                      {/* Quick nav */}
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
                        {[
                          { id:'products',    icon:'📦', label:'Manage Products',    desc:`${kpis.total_products} SKUs tracked` },
                          { id:'warehouses',  icon:'🏭', label:'Warehouses',         desc:'View stock distribution' },
                          { id:'users',       icon:'👥', label:'User Management',    desc:`${kpis.active_users} active users` },
                          { id:'notifications',icon:'🔔',label:'Alerts',             desc:`${unreadCount} unread` },
                        ].map(s => (
                          <button key={s.id} onClick={() => setActive(s.id)}
                            style={{ ...card, textAlign:'left', cursor:'pointer', border:`1px solid ${T.border}`, transition:'all .2s', fontFamily:'inherit', color:'inherit' }}>
                            <div style={{ fontSize:24, marginBottom:10 }}>{s.icon}</div>
                            <div style={{ fontWeight:800, fontSize:13, color:T.text, marginBottom:4 }}>{s.label}</div>
                            <div style={{ fontSize:11, color:T.textSub }}>{s.desc}</div>
                          </button>
                        ))}
                      </div>

                      {/* Critical alert banner */}
                      {kpis.critical_alerts > 0 && (
                        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                          style={{ ...card, border:`1px solid ${T.red}44`, background:`${T.red}08`, display:'flex', alignItems:'center', gap:14, padding:'16px 20px', marginTop:18 }}>
                          <span style={{ fontSize:24 }}>🚨</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{kpis.critical_alerts} product(s) at critical stock level</div>
                            <div style={{ fontSize:12, color:T.textSub }}>Immediate reorder needed. Send a low-stock email alert from the Notifications page.</div>
                          </div>
                          <button onClick={() => setActive('notifications')}
                            style={{ padding:'8px 16px', borderRadius:8, border:'none', background:T.red, color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                            View Alerts →
                          </button>
                        </motion.div>
                      )}
                    </>
                  )}
                </div>
              )}

              {active === 'products'     && <ProductsPage       T={T} darkMode={darkMode} initialSearch={searchQuery} />}
              {active === 'suppliers'    && <SuppliersPage      T={T} darkMode={darkMode} />}
              {active === 'warehouses'   && <WarehousePage      T={T} darkMode={darkMode} />}
              {active === 'transactions' && <TransactionsPage   T={T} darkMode={darkMode} />}
              {active === 'reports'      && <ReportsPage        T={T} darkMode={darkMode} />}
              {active === 'users'        && <UserManagementPage T={T} darkMode={darkMode} />}
              {active === 'ai'           && <AIAssistantPage    T={T} darkMode={darkMode} isAdmin />}
              {active === 'notifications'&& <NotificationsPage  T={T} darkMode={darkMode} isAdmin />}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}