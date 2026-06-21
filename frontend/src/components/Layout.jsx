import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Sidebar = ({ nav, active, setActive, sideOpen, setSideOpen, darkMode, T, accentGrad, logoIcon, consoleLabel }) => (
  <motion.aside animate={{ width: sideOpen ? 230 : 64 }} transition={{ duration: .3, ease: [.22,1,.36,1] }}
    style={{ background: T.bgCard2, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, flexShrink: 0, overflow: 'hidden', zIndex: 50 }}>

    <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${T.border}`, height: 64 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: accentGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0, boxShadow: `0 0 14px ${T.g1}` }}>{logoIcon}</div>
      <AnimatePresence>{sideOpen && (
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
          <div style={{ fontWeight: 900, fontSize: 13, color: T.text, letterSpacing: '-.02em', whiteSpace: 'nowrap' }}>InventIQ AI</div>
          {consoleLabel && <div style={{ fontSize: 10, color: T.a2, fontWeight: 700 }}>{consoleLabel}</div>}
        </motion.div>
      )}</AnimatePresence>
    </div>

    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
      {nav.map(n => {
        const isActive = active === n.id;
        return (
          <motion.button key={n.id} className="nav-item" whileTap={{ scale: .97 }} onClick={() => setActive(n.id)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 4, background: isActive ? `${T.a1}18` : 'transparent', transition: 'all .18s', position: 'relative' }}>
            <span style={{ fontSize: 17, flexShrink: 0, width: 24, textAlign: 'center' }}>{n.icon}</span>
            <AnimatePresence>{sideOpen && (
              <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? T.a1 : T.textMid, whiteSpace: 'nowrap' }}>{n.label}</motion.span>
            )}</AnimatePresence>
            {isActive && <motion.div layoutId="activeBar" style={{ position: 'absolute', left: 0, top: 6, bottom: 6, width: 3, borderRadius: 99, background: T.a1 }} />}
            {n.badge && sideOpen && (
              <span style={{ marginLeft: 'auto', background: T.red, color: '#fff', borderRadius: 99, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>{n.badge}</span>
            )}
          </motion.button>
        );
      })}
    </div>

    <div style={{ padding: '12px 8px', borderTop: `1px solid ${T.border}` }}>
      <button className="nav-item" onClick={() => setSideOpen(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: 'transparent' }}>
        <span style={{ fontSize: 16, flexShrink: 0, width: 24, textAlign: 'center' }}>{sideOpen ? '◀' : '▶'}</span>
        <AnimatePresence>{sideOpen && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ fontSize: 12, color: T.textSub, whiteSpace: 'nowrap' }}>Collapse</motion.span>
        )}</AnimatePresence>
      </button>
    </div>
  </motion.aside>
);

export const Topbar = ({ nav, active, T, darkMode, onToggleDarkMode, onLogout, userName, roleLabel, notifications, unreadCount, accentGrad }) => {
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);

  return (
    <header style={{ height: 64, background: T.bgCard, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', flexShrink: 0, position: 'sticky', top: 0, zIndex: 40 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.text, letterSpacing: '-.02em' }}>
          {nav.find(n => n.id === active)?.icon} {nav.find(n => n.id === active)?.label}
        </div>
        <div style={{ fontSize: 11, color: T.textSub }}>{new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13 }}>🔍</span>
          <input placeholder="Search SKU, order…" style={{ padding: '8px 14px 8px 32px', borderRadius: 9, border: `1px solid ${T.border}`, background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: T.text, fontSize: 13, width: 200, outline: 'none', fontFamily: 'inherit' }} />
        </div>

        <button onClick={onToggleDarkMode} style={{ background: darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 11px', cursor: 'pointer', fontSize: 15 }}>
          {darkMode ? '☀️' : '🌙'}
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); }}
            style={{ background: darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 11px', cursor: 'pointer', fontSize: 15, position: 'relative' }}>
            🔔
            {unreadCount > 0 && <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: T.red, border: `2px solid ${T.bgCard}` }} />}
          </button>
          <AnimatePresence>{notifOpen && (
            <motion.div initial={{ opacity: 0, y: 8, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: .96 }}
              style={{ position: 'absolute', right: 0, top: 44, width: 330, background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, boxShadow: `0 16px 48px rgba(0,0,0,.35)`, zIndex: 200, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, fontWeight: 800, fontSize: 13, color: T.text, display: 'flex', justifyContent: 'space-between' }}>
                Notifications <span style={{ fontSize: 11, color: T.red, fontWeight: 700 }}>{unreadCount} new</span>
              </div>
              {(notifications || []).slice(0, 5).map((a, i) => {
                const c = a.type === 'critical' ? T.red : a.type === 'warning' ? T.yellow : T.green;
                return (
                  <div key={i} style={{ padding: '11px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{a.icon || (a.type === 'critical' ? '🚨' : a.type === 'warning' ? '⚠️' : '✅')}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.4 }}>{a.msg || a.message}</div>
                      <div style={{ fontSize: 10, color: T.textSub, marginTop: 2 }}>{a.time || a.created_at}</div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}</AnimatePresence>
        </div>

        {/* Profile */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: accentGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
              {(userName || 'U')[0]}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{userName}</div>
              <div style={{ fontSize: 10, color: T.a2, fontWeight: 700 }}>{roleLabel}</div>
            </div>
          </button>
          <AnimatePresence>{profileOpen && (
            <motion.div initial={{ opacity: 0, y: 8, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: .96 }}
              style={{ position: 'absolute', right: 0, top: 46, width: 200, background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: `0 16px 40px rgba(0,0,0,.3)`, zIndex: 200, overflow: 'hidden' }}>
              {[{ icon: '👤', label: 'My Profile' }, { icon: '⚙️', label: 'Settings' }, { icon: '🔑', label: 'Change Password' }].map(item => (
                <button key={item.label} className="nav-item" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: T.textMid }}>
                  <span>{item.icon}</span>{item.label}
                </button>
              ))}
              <div style={{ borderTop: `1px solid ${T.border}` }}>
                <button className="nav-item" onClick={onLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: T.red }}>
                  <span>🚪</span>Sign Out
                </button>
              </div>
            </motion.div>
          )}</AnimatePresence>
        </div>
      </div>
    </header>
  );
};
