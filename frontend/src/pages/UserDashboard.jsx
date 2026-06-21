import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DARK, LIGHT, globalStyles } from '../theme';
import { Sidebar, Topbar } from '../components/Layout';
import { BarChart, LineChart } from '../components/Charts';
import { dashboardService, reportService, notificationService } from '../api/inventoryService';

import ProductsPage from './ProductsPage';
import SuppliersPage from './SuppliersPage';
import TransactionsPage from './TransactionsPage';
import NotificationsPage from './NotificationsPage';
import ReportsPage from './ReportsPage';
import AIAssistantPage from './AIAssistantPage';

const NAV = [
  { id:'overview',      icon:'🏠', label:'Overview' },
  { id:'products',      icon:'📦', label:'Products' },
  { id:'suppliers',     icon:'🤝', label:'Suppliers' },
  { id:'transactions',  icon:'🔄', label:'Transactions' },
  { id:'reports',       icon:'📊', label:'Reports' },
  { id:'ai',            icon:'✨', label:'AI Assistant' },
  { id:'notifications', icon:'🔔', label:'Notifications' },
];

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function UserDashboard({ darkMode, onToggleDarkMode, onLogout, userName = 'User' }) {
  const T = darkMode ? DARK : LIGHT;
  const [active, setActive]     = useState('overview');
  const [sideOpen, setSideOpen] = useState(true);
  const [kpis, setKpis]         = useState(null);
  const [stockData, setStockData] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingKpis, setLoadingKpis] = useState(true);

  const accentGrad = `linear-gradient(135deg,${T.a1},${T.a2})`;
  const card = { background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:22 };

  useEffect(() => {
    const fetchAll = async () => {
      setLoadingKpis(true);
      const [kpiRes, invRes, notifRes] = await Promise.all([
        dashboardService.getUserKPIs(),
        reportService.getInventoryReport({ period:'monthly' }),
        notificationService.getAll(),
      ]);
      if (kpiRes.data)   setKpis(kpiRes.data);
      if (invRes.data)   setStockData(invRes.data.stock_in || []);
      if (notifRes.data) setNotifications(Array.isArray(notifRes.data) ? notifRes.data : notifRes.data?.notifications || []);
      setLoadingKpis(false);
    };
    fetchAll();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const kpiCards = kpis ? [
    { label:'Assigned Products', value:kpis.assigned_products, color:T.a1,    icon:'📦' },
    { label:'Low Stock Alerts',  value:kpis.low_stock_alerts,  color:T.red,   icon:'⚠️' },
    { label:'My Transactions',   value:kpis.my_transactions,   color:T.a3,    icon:'🔄' },
    { label:'Pending Orders',    value:kpis.pending_orders,    color:T.yellow, icon:'✍️' },
  ] : [];

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:T.bg, color:T.text, fontFamily:'"DM Sans","Inter",system-ui,sans-serif', overflow:'hidden' }}>
      <style>{globalStyles(T, darkMode)}</style>

      <Sidebar nav={NAV} active={active} setActive={setActive} sideOpen={sideOpen} setSideOpen={setSideOpen}
        darkMode={darkMode} T={T} accentGrad={accentGrad} logoIcon="📦" consoleLabel="User Console" />

      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <Topbar nav={NAV} active={active} T={T} darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} onLogout={onLogout}
          userName={userName} roleLabel="Inventory User" notifications={notifications} unreadCount={unreadCount} accentGrad={accentGrad} />

        <main style={{ flex:1, overflowY:'auto', padding:'28px 32px' }}>
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:.2 }}>

              {active === 'overview' && (
                <div>
                  <h1 style={{ fontSize:'1.4rem', fontWeight:900, color:T.text, letterSpacing:'-.03em', marginBottom:4 }}>Welcome back, {userName} 👋</h1>
                  <p style={{ fontSize:13, color:T.textSub, marginBottom:24 }}>Here's your inventory snapshot</p>

                  {loadingKpis && <div style={{ textAlign:'center', padding:40, color:T.textSub }}>Loading dashboard…</div>}

                  {!loadingKpis && kpis && (
                    <>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
                        {kpiCards.map((k,i) => (
                          <motion.div key={k.label} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.06 }}
                            style={{ ...card, border:`1px solid ${k.color}28`, textAlign:'center', padding:'20px 16px' }}>
                            <div style={{ fontSize:26, marginBottom:8 }}>{k.icon}</div>
                            <div style={{ fontSize:'1.5rem', fontWeight:900, color:k.color }}>{k.value}</div>
                            <div style={{ fontSize:11, color:T.textSub, marginTop:4 }}>{k.label}</div>
                          </motion.div>
                        ))}
                      </div>

                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>
                        <div style={card}>
                          <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:4 }}>Stock In This Year</div>
                          <div style={{ fontSize:11, color:T.textSub, marginBottom:14 }}>Monthly units received</div>
                          {stockData.length > 0
                            ? <LineChart series={[{ data:stockData, color:T.a3, fill:true }]} h={130} labels={months} />
                            : <div style={{ textAlign:'center', padding:32, color:T.textSub, fontSize:12 }}>Log transactions to see this chart populate.</div>
                          }
                        </div>
                        <div style={card}>
                          <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:4 }}>Quick Actions</div>
                          <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:12 }}>
                            {[
                              { id:'products',     icon:'📦', label:'View Products' },
                              { id:'transactions', icon:'🔄', label:'Log Transaction' },
                              { id:'ai',           icon:'✨', label:'Ask AI Assistant' },
                              { id:'notifications',icon:'🔔', label:`Notifications (${unreadCount})` },
                            ].map(s => (
                              <button key={s.id} onClick={() => setActive(s.id)}
                                style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderRadius:10, border:`1px solid ${T.border}`, background:'transparent', cursor:'pointer', fontFamily:'inherit', color:T.text, fontSize:13, fontWeight:600, textAlign:'left', transition:'all .2s' }}>
                                <span style={{ fontSize:16 }}>{s.icon}</span>{s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {kpis.low_stock_alerts > 0 && (
                        <div style={{ ...card, border:`1px solid ${T.yellow}44`, background:`${T.yellow}08`, display:'flex', alignItems:'center', gap:14, padding:'16px 20px' }}>
                          <span style={{ fontSize:24 }}>⚠️</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{kpis.low_stock_alerts} item(s) are running low on stock</div>
                            <div style={{ fontSize:12, color:T.textSub }}>Check the Products page for details or notify admin from Notifications.</div>
                          </div>
                          <button onClick={() => setActive('products')}
                            style={{ padding:'8px 16px', borderRadius:8, border:'none', background:T.yellow, color:'#000', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                            View Products →
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {!loadingKpis && !kpis && (
                    <div style={{ ...card, textAlign:'center', padding:48, color:T.textSub }}>
                      <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
                      <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:8 }}>Cannot connect to backend</div>
                      <div style={{ fontSize:13 }}>Make sure the FastAPI server is running at http://127.0.0.1:8000</div>
                    </div>
                  )}
                </div>
              )}

              {active === 'products'      && <ProductsPage T={T} darkMode={darkMode} />}
              {active === 'suppliers'     && <SuppliersPage T={T} darkMode={darkMode} />}
              {active === 'transactions'  && <TransactionsPage T={T} darkMode={darkMode} />}
              {active === 'reports'       && <ReportsPage T={T} darkMode={darkMode} />}
              {active === 'ai'            && <AIAssistantPage T={T} darkMode={darkMode} />}
              {active === 'notifications' && <NotificationsPage T={T} darkMode={darkMode} />}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
