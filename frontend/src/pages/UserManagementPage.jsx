import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { userService } from '../api/inventoryService';
import { tokenStorage } from '../api/api';

export default function UserManagementPage({ T, darkMode }) {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');
  const [toast, setToast]     = useState(null);

  const card = { background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: 22 };
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  // Get current logged-in admin id so we don't show them in the list
  const currentUser = tokenStorage.getUser();

  const load = async () => {
    setLoading(true); setError(null);
    const { data, error: err } = await userService.getAll();
    if (err) { setError(err); setLoading(false); return; }
    const all = Array.isArray(data) ? data : [];
    // Exclude the currently logged-in admin from the list
    setUsers(all.filter(u => u.id !== currentUser?.id));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u => {
    const matchSearch =
      u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all'      ? true :
      filter === 'active'   ? u.is_active :
      filter === 'suspended'? !u.is_active :
      u.role === filter;
    return matchSearch && matchFilter;
  });

  const handleSuspend = async (id) => {
    if (!window.confirm('Suspend this user? They will not be able to log in.')) return;
    const { error: err } = await userService.suspend(id);
    if (err) { showToast(err, 'error'); return; }
    showToast('User suspended'); load();
  };

  const handleRestore = async (id) => {
    const { error: err } = await userService.restore(id);
    if (err) { showToast(err, 'error'); return; }
    showToast('User restored'); load();
  };

  const roleColor = (r) => r === 'admin' ? T.a2 : T.a1;

  return (
    <div>
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 20px', borderRadius: 10, background: toast.type === 'error' ? T.red : T.green, color: '#fff', fontWeight: 700, fontSize: 14, boxShadow: '0 8px 24px rgba(0,0,0,.3)' }}>
            {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: T.text, letterSpacing: '-.03em' }}>User Management</h1>
          <p style={{ fontSize: 13, color: T.textSub, marginTop: 2 }}>
            {users.length} registered user{users.length !== 1 ? 's' : ''} (excluding you)
          </p>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…"
          style={{ padding: '9px 14px', borderRadius: 9, border: `1px solid ${T.border}`, background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: T.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', width: 220 }} />
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { l: 'Total Users',  v: users.length,                           c: T.a1 },
          { l: 'Active',       v: users.filter(u => u.is_active).length,   c: T.green },
          { l: 'Suspended',    v: users.filter(u => !u.is_active).length,  c: T.red },
          { l: 'Admins',       v: users.filter(u => u.role === 'admin').length, c: T.a2 },
        ].map(s => (
          <div key={s.l} style={{ ...card, border: `1px solid ${s.c}28`, textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 12, color: T.textSub, marginTop: 4 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {[
          { id: 'all',       l: 'All' },
          { id: 'active',    l: 'Active' },
          { id: 'suspended', l: 'Suspended' },
          { id: 'admin',     l: 'Admins' },
          { id: 'user',      l: 'Users' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{ padding: '6px 16px', borderRadius: 99, border: `1px solid ${filter === f.id ? T.a1 : T.border}`, background: filter === f.id ? `${T.a1}18` : 'transparent', color: filter === f.id ? T.a1 : T.textMid, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {f.l}
          </button>
        ))}
      </div>

      <div style={card}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: T.textSub }}>Loading users…</div>}
        {error   && <div style={{ textAlign: 'center', padding: 40, color: T.red }}>⚠ {error}</div>}

        {!loading && !error && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['User', 'Email', 'Role', 'Company', 'Verified', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSub, letterSpacing: '.05em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="row-hover"
                  style={{ borderBottom: `1px solid ${T.border}`, transition: 'background .15s', opacity: u.is_active ? 1 : 0.65 }}>
                  <td style={{ padding: '13px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg,${roleColor(u.role)},${T.a2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                        {(u.first_name?.[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{u.first_name} {u.last_name}</div>
                        {u.phone && <div style={{ fontSize: 11, color: T.textSub }}>{u.phone}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 14px', fontSize: 12, color: T.textMid }}>{u.email}</td>
                  <td style={{ padding: '13px 14px' }}>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: `${roleColor(u.role)}18`, color: roleColor(u.role), fontWeight: 700, border: `1px solid ${roleColor(u.role)}33`, textTransform: 'capitalize' }}>
                      {u.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 14px', fontSize: 12, color: T.textMid }}>{u.company_name || '—'}</td>
                  <td style={{ padding: '13px 14px' }}>
                    <span style={{ fontSize: 12, color: u.email_verified ? T.green : T.yellow, fontWeight: 700 }}>
                      {u.email_verified ? '✅ Yes' : '⏳ No'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 14px' }}>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: u.is_active ? `${T.green}18` : `${T.red}18`, color: u.is_active ? T.green : T.red, fontWeight: 700, border: `1px solid ${u.is_active ? T.green : T.red}33` }}>
                      {u.is_active ? '● Active' : '● Suspended'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 14px', fontSize: 11, color: T.textSub }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '13px 14px' }}>
                    {u.is_active
                      ? <button onClick={() => handleSuspend(u.id)} style={{ fontSize: 11, padding: '5px 12px', borderRadius: 7, border: `1px solid ${T.red}44`, background: `${T.red}0E`, cursor: 'pointer', color: T.red, fontFamily: 'inherit', fontWeight: 600 }}>Suspend</button>
                      : <button onClick={() => handleRestore(u.id)} style={{ fontSize: 11, padding: '5px 12px', borderRadius: 7, border: `1px solid ${T.green}44`, background: `${T.green}0E`, cursor: 'pointer', color: T.green, fontFamily: 'inherit', fontWeight: 600 }}>Restore</button>
                    }
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: T.textSub }}>No users found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}