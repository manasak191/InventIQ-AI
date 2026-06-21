import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import authService from '../api/authService';

/* ── tokens ─────────────────────────────────────────────── */
const DARK = {
  bg:'#070B14',bgCard:'#0D1526',bgCard2:'#0A1020',
  border:'rgba(255,255,255,0.08)',text:'#EEF2FF',textMid:'#8A9BB8',textSub:'#4A6080',
  a1:'#4F8EF7',a2:'#9B6DFF',a3:'#00D4B4',a4:'#FF6B35',
  green:'#22D67A',red:'#FF4D6D',
  g1:'rgba(79,142,247,0.22)',g2:'rgba(155,109,255,0.18)',
};
const LIGHT = {
  bg:'#F4F7FF',bgCard:'#FFFFFF',bgCard2:'#EEF2FF',
  border:'rgba(0,0,0,0.09)',text:'#0D1526',textMid:'#334766',textSub:'#6B82A0',
  a1:'#2B6FF5',a2:'#7C3AED',a3:'#00A896',a4:'#E85D20',
  green:'#16A855',red:'#E62B4E',
  g1:'rgba(43,111,245,0.14)',g2:'rgba(124,58,237,0.12)',
};

/* ── particles ──────────────────────────────────────────── */
const Particles = ({ dark }) => {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    let W = c.width = window.innerWidth, H = c.height = window.innerHeight;
    const col = dark ? '79,142,247' : '43,111,245';
    const pts = Array.from({ length: 50 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3,
      r: Math.random() * 1.3 + .3, a: Math.random() * .38 + .08,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col},${p.a})`; ctx.fill();
      });
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 90) { ctx.beginPath(); ctx.strokeStyle = `rgba(${col},${.06 * (1 - d / 90)})`; ctx.lineWidth = .5; ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke(); }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [dark]);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />;
};

/* ── reusable input ─────────────────────────────────────── */
const Input = ({ label, type = 'text', placeholder, value, onChange, error, icon, dark, rightSlot }) => {
  const T = dark ? DARK : LIGHT;
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textMid, marginBottom: 7, letterSpacing: '.02em' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none', zIndex: 1 }}>{icon}</span>
        <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ width: '100%', padding: '13px 44px 13px 42px', background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: `1.5px solid ${error ? T.red : focused ? T.a1 : T.border}`, borderRadius: 10, fontSize: 14, color: T.text, outline: 'none', fontFamily: 'inherit', transition: 'border-color .2s, box-shadow .2s', boxShadow: focused ? `0 0 0 3px ${T.a1}22` : 'none' }} />
        {rightSlot && <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}>{rightSlot}</span>}
      </div>
      <AnimatePresence>
        {error && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ fontSize: 11, color: T.red, marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>⚠ {error}</motion.div>}
      </AnimatePresence>
    </div>
  );
};

/* ── password strength ──────────────────────────────────── */
const StrengthMeter = ({ password, dark }) => {
  const T = dark ? DARK : LIGHT;
  const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)];
  const score = checks.filter(Boolean).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', T.red, T.a4, '#EAB308', T.green];
  if (!password) return null;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
        {[1, 2, 3, 4].map(i => <motion.div key={i} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} style={{ flex: 1, height: 4, borderRadius: 99, background: i <= score ? colors[score] : T.border, transition: 'background .3s', transformOrigin: 'left' }} />)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: colors[score], fontWeight: 700 }}>{labels[score]}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['8+ chars', checks[0]], ['Uppercase', checks[1]], ['Number', checks[2]], ['Symbol', checks[3]]].map(([l, ok]) => (
            <span key={l} style={{ fontSize: 10, color: ok ? T.green : T.textSub }}>{ok ? '✓' : '○'} {l}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── role card ──────────────────────────────────────────── */
const RoleCard = ({ role, selected, onSelect, dark }) => {
  const T = dark ? DARK : LIGHT;
  const accent = role === 'admin' ? T.a2 : T.a1;
  const info = role === 'admin' ? { icon: '🛡️', title: 'Admin', desc: 'Full system control, user management & analytics' } : { icon: '👤', title: 'User', desc: 'Manage inventory, orders & warehouse operations' };
  return (
    <motion.div whileHover={{ y: -3 }} whileTap={{ scale: .98 }} onClick={onSelect}
      style={{ flex: 1, padding: '20px 18px', borderRadius: 14, cursor: 'pointer', position: 'relative', overflow: 'hidden', background: selected ? (dark ? `${accent}14` : `${accent}0D`) : (dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'), border: `2px solid ${selected ? accent : T.border}`, boxShadow: selected ? `0 0 24px ${accent}33` : 'none', transition: 'all .22s' }}>
      {selected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff' }}>✓</motion.div>}
      <div style={{ fontSize: 28, marginBottom: 10 }}>{info.icon}</div>
      <div style={{ fontWeight: 800, fontSize: 15, color: T.text, marginBottom: 5 }}>{info.title}</div>
      <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.5 }}>{info.desc}</div>
    </motion.div>
  );
};

/* ── OTP boxes ──────────────────────────────────────────── */
const OtpInput = ({ value, onChange, error, dark }) => {
  const T = dark ? DARK : LIGHT;
  const refs = Array.from({ length: 6 }, () => useRef(null));
  const digits = value.padEnd(6, '').split('').slice(0, 6);
  const handleKey = (i, e) => {
    if (e.key === 'Backspace') { onChange(digits[i] ? value.slice(0, i) : value.slice(0, i - 1)); if (!digits[i] && i > 0) refs[i - 1].current?.focus(); return; }
    if (e.key === 'ArrowLeft' && i > 0) refs[i - 1].current?.focus();
    if (e.key === 'ArrowRight' && i < 5) refs[i + 1].current?.focus();
  };
  const handleChange = (i, v) => {
    const digit = v.replace(/\D/g, '').slice(-1); if (!digit) return;
    const arr = digits.slice(); arr[i] = digit;
    onChange(arr.join('').slice(0, 6));
    if (i < 5) setTimeout(() => refs[i + 1].current?.focus(), 10);
  };
  const handlePaste = (e) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(p); setTimeout(() => refs[Math.min(p.length, 5)].current?.focus(), 10);
  };
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 10 }}>
        {Array.from({ length: 6 }, (_, i) => {
          const filled = !!digits[i];
          return (
            <motion.div key={i} whileTap={{ scale: .94 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .06 }}>
              <input ref={refs[i]} type="text" inputMode="numeric" maxLength={1}
                value={digits[i] || ''} onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKey(i, e)} onPaste={handlePaste} onFocus={e => e.target.select()}
                style={{ width: 52, height: 60, textAlign: 'center', fontSize: 22, fontWeight: 900, fontFamily: 'inherit', background: filled ? (dark ? `${T.a1}18` : `${T.a1}12`) : (dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'), border: `2px solid ${error ? T.red : filled ? T.a1 : T.border}`, borderRadius: 12, color: T.text, outline: 'none', boxShadow: filled ? `0 0 14px ${T.a1}44` : 'none', transition: 'all .18s', caretColor: 'transparent' }} />
            </motion.div>
          );
        })}
      </div>
      <AnimatePresence>
        {error && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ fontSize: 12, color: T.red, textAlign: 'center', marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>⚠ {error}</motion.div>}
      </AnimatePresence>
    </div>
  );
};

/* ── countdown ──────────────────────────────────────────── */
const Countdown = ({ seconds, onEnd }) => {
  const [left, setLeft] = useState(seconds);
  const ended = useRef(false);
  useEffect(() => {
    ended.current = false; setLeft(seconds);
    const t = setInterval(() => { setLeft(l => { if (l <= 1) { clearInterval(t); if (!ended.current) { ended.current = true; onEnd(); } return 0; } return l - 1; }); }, 1000);
    return () => clearInterval(t);
  }, [seconds]);
  const m = Math.floor(left / 60), s = left % 60;
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{m}:{s.toString().padStart(2, '0')}</span>;
};

/* ════════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════════ */
const RegisterPage = ({ darkMode, onToggleDarkMode, onNavigateLogin, onNavigateLanding }) => {
  const T = darkMode ? DARK : LIGHT;

  const [step, setStep] = useState(1);
  const [role, setRole] = useState('user');
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', company: '', phone: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendActive, setResendActive] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [timerKey, setTimerKey] = useState(0);

  const accentGrad = `linear-gradient(135deg,${T.a1},${T.a2})`;
  const stepLabels = ['Choose role', 'Your details', 'Verify email'];
  const progressWidth = step === 1 ? '33%' : step === 2 ? '66%' : '100%';

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim()) e.lastName = 'Last name is required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Enter a valid email address';
    if (role === 'admin' && !form.company.trim()) e.company = 'Company name is required for admin';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!agreed) e.agreed = 'You must accept the terms to continue';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    const { error } = await authService.register({
      first_name: form.firstName,
      last_name: form.lastName,
      email: form.email,
      password: form.password,
      role,
      company_name: form.company || undefined,
      phone: form.phone || undefined,
      terms_accepted: true,
    });
    setLoading(false);
    if (error) {
      toast.error(error, { position: 'top-right', autoClose: 4000 });
      return;
    }
    toast.success('Account created! Verification email sent 📬', { position: 'top-right', autoClose: 4000 });
    setOtp(''); setOtpError(''); setResendActive(false); setTimerKey(k => k + 1);
    setStep(3);
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      setOtpError('Please enter the complete 6-digit code');
      return;
    }
    setOtpError('');
    setOtpLoading(true);
    try {
      const vResult = await authService.verifyOtp(form.email, otp); if (vResult.error) throw new Error(vResult.error);
      toast.success('Email verified successfully! ✅', { position: 'top-right', autoClose: 3000 });
      setStep(4);
    } catch (error) {
      setOtpError(error?.response?.data?.detail || 'Invalid OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    if (!resendActive) return;
    try {
      const rResult = await authService.resendOtp(form.email); if (rResult.error) throw new Error(rResult.error);
      setResendCount(c => c + 1);
      setOtp('');
      setOtpError('');
      setResendActive(false);
      setTimerKey(k => k + 1);
      toast.success('New OTP sent to your email 📧', { position: 'top-right', autoClose: 3000 });
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Failed to resend OTP');
    }
  };

  const bullets = [
    { icon: '⚡', text: 'AI-powered inventory forecasting' },
    { icon: '🏭', text: 'Multi-warehouse real-time tracking' },
    { icon: '📊', text: 'Executive analytics & dashboards' },
    { icon: '🔔', text: 'Smart alerts before stockouts occur' },
    { icon: '🤖', text: 'Conversational AI assistant' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: '"DM Sans","Inter",system-ui,sans-serif', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        input::placeholder{color:${T.textSub};font-family:inherit;}
        input{color-scheme:${darkMode ? 'dark' : 'light'};}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(.85)}}
        .social-btn:hover{border-color:${T.a1}!important;transform:translateY(-1px);}
        .check-box:hover{border-color:${T.a1}!important;}
        .btnP:hover{box-shadow:0 0 36px ${T.g1}!important;transform:translateY(-1px);}
      `}</style>

      <Particles dark={darkMode} />

      {/* ── LEFT PANEL ────────────────────────────────── */}
      <motion.div initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: .8, ease: [.22, 1, .36, 1] }}
        style={{ width: '42%', minHeight: '100vh', background: darkMode ? 'rgba(13,21,38,0.96)' : 'rgba(238,242,255,0.96)', backdropFilter: 'blur(24px)', borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 48px', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: -100, left: -100, width: 380, height: 380, borderRadius: '50%', background: `radial-gradient(circle,${T.g1},transparent 70%)`, filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -60, right: -60, width: 260, height: 260, borderRadius: '50%', background: `radial-gradient(circle,${T.g2},transparent 70%)`, filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div>
          <button onClick={onNavigateLanding} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: 0, marginBottom: 52 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: accentGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: `0 0 18px ${T.g1}` }}>⚡</div>
            <span style={{ fontWeight: 900, fontSize: 17, color: T.text, letterSpacing: '-.02em' }}>InventIQ AI</span>
          </button>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.16em', color: T.a2, marginBottom: 14 }}>JOIN 2,000+ TEAMS</div>
            <h2 style={{ fontSize: 'clamp(1.8rem,2.8vw,2.4rem)', fontWeight: 900, letterSpacing: '-.04em', lineHeight: 1.08, color: T.text, marginBottom: 14 }}>The smarter way<br />to run inventory.</h2>
            <p style={{ fontSize: 14, color: T.textMid, lineHeight: 1.7, maxWidth: 320 }}>Join teams who replaced guesswork with AI-driven precision. Set up in minutes.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {bullets.map((b, i) => (
              <motion.div key={b.text} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .3 + i * .1 }} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{b.icon}</div>
                <span style={{ fontSize: 13, color: T.textMid, fontWeight: 500 }}>{b.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
        
      </motion.div>

      {/* ── RIGHT PANEL ───────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px' }}>
          <div style={{ fontSize: 13, color: T.textSub }}>
            Already have an account?{' '}
            <button onClick={onNavigateLogin} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.a1, fontWeight: 700, fontSize: 13, fontFamily: 'inherit', padding: 0 }}>Sign in →</button>
          </div>
          <button onClick={onToggleDarkMode} style={{ background: darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 15, color: T.text, fontFamily: 'inherit', transition: 'all .2s' }}>
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 48px 48px' }}>
          <div style={{ width: '100%', maxWidth: 480 }}>
            <AnimatePresence mode="wait">

              {/* ══ STEP 4 — SUCCESS ══════════════════════════ */}
              {step === 4 && (
                <motion.div key="success" initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '32px 0' }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ duration: .6, ease: 'backOut' }}
                    style={{ width: 84, height: 84, borderRadius: '50%', background: `${T.green}18`, border: `2px solid ${T.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 38 }}>✅</motion.div>
                  <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-.04em', color: T.text, marginBottom: 10 }}>Email Verified!</h2>
                  <p style={{ fontSize: 15, color: T.textMid, lineHeight: 1.7, marginBottom: 8 }}>
                    Your <strong style={{ color: role === 'admin' ? T.a2 : T.a1 }}>{role === 'admin' ? 'Admin' : 'User'}</strong> account is ready.
                  </p>
                  <p style={{ fontSize: 14, color: T.a1, fontWeight: 700, marginBottom: 28 }}>{form.email}</p>
                  <div style={{ padding: '18px 22px', borderRadius: 14, background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `1px solid ${T.border}`, marginBottom: 28, textAlign: 'left' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: T.textSub, marginBottom: 12 }}>WHAT'S NEXT</div>
                    {['Account fully verified & active', 'Complete your warehouse setup', 'Invite your team members', 'Explore the AI assistant'].map((s, i) => (
                      <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${T.green}18`, border: `1px solid ${T.green}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: T.green, flexShrink: 0 }}>{i + 1}</div>
                        <span style={{ fontSize: 13, color: T.textMid }}>{s}</span>
                      </div>
                    ))}
                  </div>
                  <button className="btnP" onClick={onNavigateLogin}
                    style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${T.a1},${T.a2})`, color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 0 28px ${T.g1}`, transition: 'all .2s' }}>
                    Go to Sign In →
                  </button>
                </motion.div>
              )}

              {/* ══ STEPS 1–3 ═════════════════════════════════ */}
              {step !== 4 && (
                <motion.div key="form" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
                  <div style={{ marginBottom: 24 }}>
                    <h1 style={{ fontSize: 'clamp(1.5rem,2.5vw,2rem)', fontWeight: 900, letterSpacing: '-.04em', color: T.text, marginBottom: 6 }}>Create your account</h1>
                    <p style={{ fontSize: 14, color: T.textMid }}>Free 14-day trial. No credit card required.</p>
                  </div>

                  <div style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      {stepLabels.map((s, i) => (
                        <span key={s} style={{ fontSize: 11, fontWeight: 700, color: step >= i + 1 ? T.a1 : T.textSub, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {step > i + 1 ? <span style={{ color: T.green }}>✓</span> : null}{s}
                        </span>
                      ))}
                    </div>
                    <div style={{ height: 4, borderRadius: 99, background: T.border, overflow: 'hidden' }}>
                      <motion.div animate={{ width: progressWidth }} transition={{ duration: .4 }} style={{ height: '100%', background: `linear-gradient(90deg,${T.a1},${T.a2})`, borderRadius: 99 }} />
                    </div>
                  </div>

                  <AnimatePresence mode="wait">

                    {/* ─ STEP 1 — Role ────────────────────── */}
                    {step === 1 && (
                      <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.textMid, marginBottom: 12 }}>Select your account type</div>
                        <div style={{ display: 'flex', gap: 14, marginBottom: 22 }}>
                          <RoleCard role="user" selected={role === 'user'} onSelect={() => setRole('user')} dark={darkMode} />
                          <RoleCard role="admin" selected={role === 'admin'} onSelect={() => setRole('admin')} dark={darkMode} />
                        </div>
                        <AnimatePresence mode="wait">
                          <motion.div key={role} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                            style={{ padding: '14px 18px', borderRadius: 12, background: darkMode ? `${role === 'admin' ? T.a2 : T.a1}12` : `${role === 'admin' ? T.a2 : T.a1}0D`, border: `1px solid ${role === 'admin' ? T.a2 : T.a1}33`, marginBottom: 24 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: role === 'admin' ? T.a2 : T.a1, marginBottom: 4 }}>{role === 'admin' ? '🛡️ Admin access includes:' : '👤 User access includes:'}</div>
                            <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.6 }}>{role === 'admin' ? 'Full system config, user management, billing controls, all dashboards and AI model settings.' : 'Inventory ops, warehouse management, purchase orders, reporting and AI assistant access.'}</div>
                          </motion.div>
                        </AnimatePresence>
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                            <div style={{ flex: 1, height: 1, background: T.border }} /><span style={{ fontSize: 11, color: T.textSub, fontWeight: 600 }}>or continue with email</span><div style={{ flex: 1, height: 1, background: T.border }} />
                          </div>
                        </div>
                        <button className="btnP" onClick={() => setStep(2)}
                          style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${T.a1},${T.a2})`, color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 0 24px ${T.g1}`, transition: 'all .2s' }}>
                          Continue as {role === 'admin' ? 'Admin' : 'User'} →
                        </button>
                      </motion.div>
                    )}

                    {/* ─ STEP 2 — Details ─────────────────── */}
                    {step === 2 && (
                      <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: role === 'admin' ? `${T.a2}12` : `${T.a1}12`, border: `1px solid ${role === 'admin' ? T.a2 : T.a1}33`, marginBottom: 20 }}>
                          <span style={{ fontSize: 18 }}>{role === 'admin' ? '🛡️' : '👤'}</span>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: role === 'admin' ? T.a2 : T.a1 }}>Registering as {role === 'admin' ? 'Admin' : 'User'}</div>
                            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: T.textSub, fontFamily: 'inherit', padding: 0 }}>← Change role</button>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                          <Input label="First name" placeholder="Raj" value={form.firstName} onChange={set('firstName')} error={errors.firstName} icon="👤" dark={darkMode} />
                          <Input label="Last name" placeholder="Sharma" value={form.lastName} onChange={set('lastName')} error={errors.lastName} icon="👤" dark={darkMode} />
                        </div>
                        <Input label="Email address" type="email" placeholder="raj@company.com" value={form.email} onChange={set('email')} error={errors.email} icon="📧" dark={darkMode} />
                        {role === 'admin' && <Input label="Company name" placeholder="Acme Logistics Pvt. Ltd." value={form.company} onChange={set('company')} error={errors.company} icon="🏢" dark={darkMode} />}
                        <Input label="Phone (optional)" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} icon="📱" dark={darkMode} />
                        <Input label="Password" type={showPw ? 'text' : 'password'} placeholder="Create a strong password"
                          value={form.password} onChange={set('password')} error={errors.password} icon="🔒" dark={darkMode}
                          rightSlot={<button onClick={() => setShowPw(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: T.textSub, padding: 0, fontFamily: 'inherit' }}>{showPw ? '🙈' : '👁️'}</button>} />
                        <StrengthMeter password={form.password} dark={darkMode} />
                        <Input label="Confirm password" type={showCpw ? 'text' : 'password'} placeholder="Repeat your password"
                          value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} icon="🔒" dark={darkMode}
                          rightSlot={<button onClick={() => setShowCpw(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: T.textSub, padding: 0, fontFamily: 'inherit' }}>{showCpw ? '🙈' : '👁️'}</button>} />
                        <div style={{ marginBottom: 22 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }} onClick={() => setAgreed(v => !v)}>
                            <div className="check-box" style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${agreed ? T.a1 : errors.agreed ? T.red : T.border}`, background: agreed ? T.a1 : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all .2s' }}>
                              {agreed && <span style={{ fontSize: 10, color: '#fff', fontWeight: 900 }}>✓</span>}
                            </div>
                            <span style={{ fontSize: 12, color: T.textMid, lineHeight: 1.55 }}>
                              I agree to the <span style={{ color: T.a1, fontWeight: 700 }}>Terms of Service</span> and <span style={{ color: T.a1, fontWeight: 700 }}>Privacy Policy</span>.
                              {role === 'admin' && ' Admin accounts are subject to additional review.'}
                            </span>
                          </div>
                          {errors.agreed && <div style={{ fontSize: 11, color: T.red, marginTop: 5 }}>⚠ {errors.agreed}</div>}
                        </div>
                        <motion.button whileTap={{ scale: .98 }} onClick={handleSubmit} disabled={loading}
                          style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: loading ? T.border : `linear-gradient(135deg,${T.a1},${T.a2})`, color: loading ? T.textSub : '#fff', fontWeight: 800, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: loading ? 'none' : `0 0 28px ${T.g1}`, transition: 'all .25s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                          {loading ? <><div style={{ width: 16, height: 16, border: `2px solid ${T.textSub}`, borderTopColor: T.a1, borderRadius: '50%', animation: 'spin .7s linear infinite' }} />Sending verification email…</> : 'Create Account & Send OTP ✉️'}
                        </motion.button>
                      </motion.div>
                    )}

                    {/* ─ STEP 3 — OTP ─────────────────────── */}
                    {step === 3 && (
                      <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                          style={{ padding: '14px 18px', borderRadius: 12, background: `${T.a3}12`, border: `1px solid ${T.a3}44`, display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 28 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: `${T.a3}18`, border: `1px solid ${T.a3}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📬</div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 13, color: T.a3, marginBottom: 4 }}>Verification email sent</div>
                            <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.5 }}>We sent a 6-digit code to<br /><span style={{ fontWeight: 700, color: T.text }}>{form.email}</span></div>
                          </div>
                        </motion.div>
                        <div style={{ textAlign: 'center', marginBottom: 28 }}>
                          <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
                          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-.03em', color: T.text, marginBottom: 6 }}>Verify your email</h2>
                          <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.6 }}>Enter the 6-digit code from your inbox to confirm your email.</p>
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: T.textMid, marginBottom: 14, textAlign: 'center' }}>Enter verification code</div>
                          <OtpInput value={otp} onChange={v => { setOtp(v); setOtpError(''); }} error={otpError} dark={darkMode} />
                        </div>
                        <motion.button whileTap={{ scale: .98 }} onClick={handleVerifyOtp} disabled={otpLoading || otp.length < 6}
                          style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: otpLoading || otp.length < 6 ? T.border : `linear-gradient(135deg,${T.a1},${T.a2})`, color: otpLoading || otp.length < 6 ? T.textSub : '#fff', fontWeight: 800, fontSize: 15, cursor: otpLoading || otp.length < 6 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: otpLoading || otp.length < 6 ? 'none' : `0 0 28px ${T.g1}`, transition: 'all .25s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
                          {otpLoading ? <><div style={{ width: 16, height: 16, border: `2px solid ${T.textSub}`, borderTopColor: T.a1, borderRadius: '50%', animation: 'spin .7s linear infinite' }} />Verifying…</> : '✓ Verify & Activate Account'}
                        </motion.button>
                        <div style={{ textAlign: 'center' }}>
                          {!resendActive ? (
                            <div style={{ fontSize: 13, color: T.textSub }}>
                              Code expires in{' '}
                              <span style={{ fontWeight: 700, color: T.a1 }}>
                                <Countdown key={timerKey} seconds={120} onEnd={() => setResendActive(true)} />
                              </span>
                            </div>
                          ) : (
                            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                              <div style={{ fontSize: 13, color: T.red, marginBottom: 10 }}>⏰ Code expired</div>
                              <button onClick={handleResend} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: T.a1, fontWeight: 700, fontFamily: 'inherit', textDecoration: 'underline' }}>
                                Resend new code {resendCount > 0 ? `(${resendCount})` : ''}
                              </button>
                            </motion.div>
                          )}
                        </div>
                        <div style={{ textAlign: 'center', marginTop: 16 }}>
                          <button onClick={() => { setStep(2); setOtp(''); setOtpError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: T.textSub, fontFamily: 'inherit' }}>← Wrong email? Go back and change it</button>
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
