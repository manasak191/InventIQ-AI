import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationService, inventoryService } from '../api/inventoryService';

export default function NotificationsPage({ T, darkMode }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [filter, setFilter]     = useState('all');
  const [sending, setSending]   = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [toast, setToast]       = useState(null);

  const card = { background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:22 };
  const tc = (t) => t==='critical'?T.red:t==='warning'?T.yellow:T.green;
  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const load = async () => {
    setLoading(true); setError(null);
    const { data, error: err } = await notificationService.getAll();
    if (err) { setError(err); setLoading(false); return; }
    setNotifications(Array.isArray(data) ? data : data?.notifications || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const unread = notifications.filter(n => !n.read).length;

  const markRead = async (id) => {
    await notificationService.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read:true } : n));
  };

  const markAllRead = async () => {
    await notificationService.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, read:true })));
    showToast('All notifications marked as read');
  };

  const handleSendLowStockEmail = async () => {
    setSending(true);
    const { data: lowData } = await inventoryService.getLowStock();
    const lowItems = Array.isArray(lowData) ? lowData : [];
    if (lowItems.length === 0) {
      showToast('No low stock items found — nothing to alert!', 'error');
      setSending(false);
      return;
    }
    const ids = lowItems.map(i => i.id).filter(Boolean);
    const { data, error: err } = await notificationService.sendLowStockAlert(ids);
    if (err) { showToast(err, 'error'); setSending(false); return; }
    setEmailSent(true);
    showToast(`Low stock alert sent for ${lowItems.length} product(s) 📧`);
    setSending(false);
    load(); // reload to show new notification records
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
          <h1 style={{ fontSize:'1.4rem', fontWeight:900, color:T.text, letterSpacing:'-.03em' }}>Notifications</h1>
          <p style={{ fontSize:13, color:T.textSub, marginTop:2 }}>{unread} unread · {notifications.length} total</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          {unread > 0 && (
            <button onClick={markAllRead} style={{ padding:'9px 18px', borderRadius:9, border:`1px solid ${T.border}`, background:'transparent', color:T.textMid, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              ✓ Mark all read
            </button>
          )}
          <button onClick={handleSendLowStockEmail} disabled={sending || emailSent}
            style={{ padding:'9px 18px', borderRadius:9, border: emailSent?`1px solid ${T.green}44`:'none', background: emailSent?`${T.green}22`:`linear-gradient(135deg,${T.red},${T.a4})`, color: emailSent?T.green:'#fff', fontSize:13, fontWeight:700, cursor:(sending||emailSent)?'not-allowed':'pointer', fontFamily:'inherit', opacity: sending?.7:1 }}>
            {sending ? '⏳ Sending…' : emailSent ? '✅ Alert Sent' : '📧 Send Low Stock Alert'}
          </button>
        </div>
      </div>

      {/* Critical banner */}
      {notifications.filter(n => n.type==='critical' && !n.read).length > 0 && (
        <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
          style={{ padding:'14px 20px', borderRadius:12, background:`${T.red}10`, border:`1px solid ${T.red}40`, display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
          <span style={{ fontSize:22 }}>🚨</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:T.text }}>
              {notifications.filter(n => n.type==='critical' && !n.read).length} critical stock alerts need attention
            </div>
            <div style={{ fontSize:12, color:T.textSub, marginTop:2 }}>Low stock items may cause stockouts. Click "Send Low Stock Alert" to email the admin.</div>
          </div>
        </motion.div>
      )}

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:10, marginBottom:18 }}>
        {[
          { id:'all',      l:'All',      count:notifications.length },
          { id:'unread',   l:'Unread',   count:unread },
          { id:'critical', l:'Critical', count:notifications.filter(n=>n.type==='critical').length },
          { id:'warning',  l:'Warning',  count:notifications.filter(n=>n.type==='warning').length },
          { id:'info',     l:'Info',     count:notifications.filter(n=>n.type==='info').length },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{ padding:'7px 16px', borderRadius:99, border:`1px solid ${filter===f.id?T.a1:T.border}`, background: filter===f.id?`${T.a1}18`:'transparent', color: filter===f.id?T.a1:T.textMid, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', gap:6, alignItems:'center' }}>
            {f.l}
            <span style={{ background: filter===f.id?T.a1:T.border, color: filter===f.id?'#fff':T.textSub, borderRadius:99, padding:'0 6px', fontSize:10, fontWeight:800 }}>{f.count}</span>
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign:'center', padding:40, color:T.textSub }}>Loading notifications…</div>}
      {error   && <div style={{ textAlign:'center', padding:40, color:T.red }}>⚠ {error}</div>}

      {!loading && !error && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map(n => (
            <motion.div key={n.id} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
              style={{ ...card, border:`1px solid ${tc(n.type)}${n.read?'18':'40'}`, display:'flex', alignItems:'center', gap:14, padding:'16px 20px', opacity: n.read?0.75:1 }}>
              <div style={{ width:42, height:42, borderRadius:11, background:`${tc(n.type)}18`, border:`1px solid ${tc(n.type)}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                {n.icon || (n.type==='critical'?'🚨':n.type==='warning'?'⚠️':'✅')}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, color:T.text, fontWeight: n.read?500:700 }}>{n.message}</div>
                <div style={{ fontSize:11, color:T.textSub, marginTop:3 }}>{n.source||'System'} · {n.time||n.created_at}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {!n.read && <div style={{ width:8, height:8, borderRadius:'50%', background:tc(n.type), flexShrink:0 }} />}
                <span style={{ fontSize:11, padding:'3px 10px', borderRadius:99, background:`${tc(n.type)}18`, color:tc(n.type), fontWeight:700, border:`1px solid ${tc(n.type)}33`, textTransform:'capitalize' }}>{n.type}</span>
                {!n.read && (
                  <button onClick={() => markRead(n.id)} style={{ padding:'5px 12px', borderRadius:7, border:`1px solid ${T.border}`, background:'transparent', cursor:'pointer', fontSize:11, color:T.textMid, fontFamily:'inherit' }}>Mark Read</button>
                )}
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:48, color:T.textSub }}>
              <div style={{ fontSize:32, marginBottom:10 }}>🔔</div>
              No notifications yet. They will appear here automatically when stock is low.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
