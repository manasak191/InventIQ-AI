import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../api/api';
import { tokenStorage } from '../api/api';

/* ── shared input ────────────────────────────────────────── */
const FInput = ({ label, type = 'text', value, onChange, placeholder, icon, T, darkMode, rightSlot }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textSub, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {icon && <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none' }}>{icon}</span>}
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ width: '100%', padding: icon ? '11px 40px 11px 36px' : '11px 14px', borderRadius: 9, border: `1.5px solid ${focused ? T.a1 : T.border}`, background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: T.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxShadow: focused ? `0 0 0 3px ${T.a1}22` : 'none', transition: 'all .2s' }} />
        {rightSlot && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>{rightSlot}</span>}
      </div>
    </div>
  );
};

/* ── modal wrapper ───────────────────────────────────────── */
const Modal = ({ title, icon, onClose, children, T }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    onClick={onClose}>
    <motion.div initial={{ scale: .92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .92, opacity: 0 }}
      onClick={e => e.stopPropagation()}
      style={{ background: T.bgCard, borderRadius: 18, padding: 28, width: 460, boxShadow: '0 24px 64px rgba(0,0,0,.55)', border: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <div style={{ fontSize: 22 }}>{icon}</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: T.text }}>{title}</div>
        <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: T.textSub, padding: 4 }}>✕</button>
      </div>
      {children}
    </motion.div>
  </motion.div>
);

/* ════════════════════════════════════════════════════════════
   PROFILE MODAL
════════════════════════════════════════════════════════════ */
export function ProfileModal({ T, darkMode, onClose }) {
  const user = tokenStorage.getUser() || {};
  const [form, setForm] = useState({
    first_name:   user.first_name  || '',
    last_name:    user.last_name   || '',
    email:        user.email       || '',
    phone:        user.phone       || '',
    company_name: user.company_name || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/admin/users/${user.id}`, form);
      tokenStorage.setUser({ ...user, ...form });
      toast.success('Profile updated!');
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to update profile');
    }
    setSaving(false);
  };

  const accentGrad = `linear-gradient(135deg,${T.a1},${T.a2})`;

  return (
    <Modal title="My Profile" icon="👤" onClose={onClose} T={T}>
      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `1px solid ${T.border}`, marginBottom: 20 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: accentGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
          {(form.first_name?.[0] || '?').toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{form.first_name} {form.last_name}</div>
          <div style={{ fontSize: 12, color: T.a1, fontWeight: 700, marginTop: 2, textTransform: 'capitalize' }}>{user.role}</div>
          <div style={{ fontSize: 11, color: T.textSub }}>{form.email}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        <FInput label="First Name" value={form.first_name} onChange={v => setForm(p => ({ ...p, first_name: v }))} icon="👤" T={T} darkMode={darkMode} />
        <div style={{ width: 14 }} />
        <FInput label="Last Name"  value={form.last_name}  onChange={v => setForm(p => ({ ...p, last_name: v }))}  icon="👤" T={T} darkMode={darkMode} />
      </div>
      <FInput label="Email (read-only)" value={form.email} onChange={() => {}} icon="📧" T={T} darkMode={darkMode} />
      <FInput label="Phone"        value={form.phone}        onChange={v => setForm(p => ({ ...p, phone: v }))}        icon="📱" placeholder="+91 98765 43210" T={T} darkMode={darkMode} />
      <FInput label="Company Name" value={form.company_name} onChange={v => setForm(p => ({ ...p, company_name: v }))} icon="🏢" placeholder="Your company" T={T} darkMode={darkMode} />

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 9, border: `1px solid ${T.border}`, background: 'transparent', cursor: 'pointer', fontSize: 13, color: T.textMid, fontFamily: 'inherit' }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{ padding: '10px 24px', borderRadius: 9, border: 'none', background: accentGrad, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? .7 : 1 }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════
   SETTINGS MODAL
════════════════════════════════════════════════════════════ */
export function SettingsModal({ T, darkMode, onClose, onToggleDarkMode }) {
  const [emailNotif, setEmailNotif] = useState(true);
  const [lowStockNotif, setLowStockNotif] = useState(true);

  const Toggle = ({ value, onChange, label, desc }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1px solid ${T.border}` }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{label}</div>
        <div style={{ fontSize: 11, color: T.textSub, marginTop: 3 }}>{desc}</div>
      </div>
      <div onClick={() => onChange(!value)}
        style={{ width: 44, height: 24, borderRadius: 99, background: value ? T.a1 : T.border, cursor: 'pointer', position: 'relative', transition: 'all .25s', flexShrink: 0 }}>
        <motion.div animate={{ x: value ? 22 : 2 }} transition={{ duration: .2 }}
          style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, boxShadow: '0 1px 4px rgba(0,0,0,.3)' }} />
      </div>
    </div>
  );

  return (
    <Modal title="Settings" icon="⚙️" onClose={onClose} T={T}>
      <Toggle value={darkMode} onChange={onToggleDarkMode} label="Dark Mode" desc="Switch between dark and light theme" />
      <Toggle value={emailNotif} onChange={setEmailNotif} label="Email Notifications" desc="Receive system alerts via email" />
      <Toggle value={lowStockNotif} onChange={setLowStockNotif} label="Low Stock Alerts" desc="Get notified when items fall below reorder point" />
      <div style={{ marginTop: 20, padding: '12px 14px', borderRadius: 10, background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 11, color: T.textSub, lineHeight: 1.6 }}>
          ⚠ Email and notification preferences are saved locally in this session. Backend preference storage can be added later.
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
        <button onClick={() => { toast.success('Settings saved!'); onClose(); }}
          style={{ padding: '10px 24px', borderRadius: 9, border: 'none', background: `linear-gradient(135deg,${T.a1},${T.a2})`, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          Save Settings
        </button>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════
   CHANGE PASSWORD MODAL
════════════════════════════════════════════════════════════ */
export function ChangePasswordModal({ T, darkMode, onClose }) {
  const [form, setForm]     = useState({ current: '', newPw: '', confirm: '' });
  const [showCurr, setShowCurr] = useState(false);
  const [showNew, setShowNew]   = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [errors, setErrors]     = useState({});

  const checks = [form.newPw.length >= 8, /[A-Z]/.test(form.newPw), /[0-9]/.test(form.newPw), /[^A-Za-z0-9]/.test(form.newPw)];
  const score  = checks.filter(Boolean).length;
  const colors = ['', T.red, '#F59E0B', '#EAB308', T.green];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  const handleSave = async () => {
    const e = {};
    if (!form.current)            e.current = 'Required';
    if (form.newPw.length < 8)    e.newPw   = 'At least 8 characters';
    if (form.newPw !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSaving(true);
    try {
      await api.post('/auth/change-password', {
        old_password: form.current,
        new_password: form.newPw,
      });

      toast.success('Password changed successfully!');
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to change password. Check your current password.');
    }

    setSaving(false);
  };

  const showBtn = (show, setShow) => (
    <button onClick={() => setShow(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: T.textSub, padding: 0 }}>{show ? '🙈' : '👁️'}</button>
  );

  return (
    <Modal title="Change Password" icon="🔑" onClose={onClose} T={T}>
      <FInput label="Current Password" type={showCurr ? 'text' : 'password'} value={form.current}
        onChange={v => setForm(p => ({ ...p, current: v }))} icon="🔒" T={T} darkMode={darkMode}
        rightSlot={showBtn(showCurr, setShowCurr)} placeholder="Your current password" />
      {errors.current && <div style={{ fontSize: 11, color: T.red, marginTop: -12, marginBottom: 12 }}>⚠ {errors.current}</div>}

      <FInput label="New Password" type={showNew ? 'text' : 'password'} value={form.newPw}
        onChange={v => setForm(p => ({ ...p, newPw: v }))} icon="🔒" T={T} darkMode={darkMode}
        rightSlot={showBtn(showNew, setShowNew)} placeholder="Create a strong password" />
      {errors.newPw && <div style={{ fontSize: 11, color: T.red, marginTop: -12, marginBottom: 12 }}>⚠ {errors.newPw}</div>}

      {/* Strength bar */}
      {form.newPw && (
        <div style={{ marginBottom: 16, marginTop: -8 }}>
          <div style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i <= score ? colors[score] : T.border, transition: 'background .3s' }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: colors[score], fontWeight: 700 }}>{labels[score]}</span>
        </div>
      )}

      <FInput label="Confirm New Password" type={showConf ? 'text' : 'password'} value={form.confirm}
        onChange={v => setForm(p => ({ ...p, confirm: v }))} icon="🔒" T={T} darkMode={darkMode}
        rightSlot={showBtn(showConf, setShowConf)} placeholder="Repeat your new password" />
      {errors.confirm && <div style={{ fontSize: 11, color: T.red, marginTop: -12, marginBottom: 12 }}>⚠ {errors.confirm}</div>}

      {form.confirm && (
        <div style={{ fontSize: 12, color: form.newPw === form.confirm ? T.green : T.red, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
          {form.newPw === form.confirm ? '✓ Passwords match' : '✗ Passwords do not match'}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 9, border: `1px solid ${T.border}`, background: 'transparent', cursor: 'pointer', fontSize: 13, color: T.textMid, fontFamily: 'inherit' }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{ padding: '10px 24px', borderRadius: 9, border: 'none', background: `linear-gradient(135deg,${T.a1},${T.a2})`, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? .7 : 1 }}>
          {saving ? 'Saving…' : 'Change Password'}
        </button>
      </div>
    </Modal>
  );
}