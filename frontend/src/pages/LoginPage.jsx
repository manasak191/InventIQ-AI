import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import authService from '../api/authService';
import { useAuth } from '../context/AuthContext';

/* ── design tokens ──────────────────────────────────────── */
const DARK = {
  bg:'#070B14', bgCard:'#0D1526', bgCard2:'#0A1020',
  border:'rgba(255,255,255,0.08)', text:'#EEF2FF', textMid:'#8A9BB8', textSub:'#4A6080',
  a1:'#4F8EF7', a2:'#9B6DFF', a3:'#00D4B4', a4:'#FF6B35',
  green:'#22D67A', red:'#FF4D6D',
  g1:'rgba(79,142,247,0.22)', g2:'rgba(155,109,255,0.18)',
};
const LIGHT = {
  bg:'#F4F7FF', bgCard:'#FFFFFF', bgCard2:'#EEF2FF',
  border:'rgba(0,0,0,0.09)', text:'#0D1526', textMid:'#334766', textSub:'#6B82A0',
  a1:'#2B6FF5', a2:'#7C3AED', a3:'#00A896', a4:'#E85D20',
  green:'#16A855', red:'#E62B4E',
  g1:'rgba(43,111,245,0.14)', g2:'rgba(124,58,237,0.12)',
};

/* ── particle canvas background ─────────────────────────── */
const Particles = ({ dark }) => {
  const ref = useRef(null);
  React.useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    let W = c.width = window.innerWidth, H = c.height = window.innerHeight;
    const col = dark ? '79,142,247' : '43,111,245';
    const pts = Array.from({ length: 50 }, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-.5)*.28, vy: (Math.random()-.5)*.28,
      r: Math.random()*1.3+.3, a: Math.random()*.38+.08,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      pts.forEach(p => {
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x=W; if(p.x>W)p.x=0; if(p.y<0)p.y=H; if(p.y>H)p.y=0;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(${col},${p.a})`; ctx.fill();
      });
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
        const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y, d=Math.sqrt(dx*dx+dy*dy);
        if(d<90){ctx.beginPath();ctx.strokeStyle=`rgba(${col},${.06*(1-d/90)})`;ctx.lineWidth=.5;ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.stroke();}
      }
      raf=requestAnimationFrame(draw);
    };
    draw();
    const resize=()=>{W=c.width=window.innerWidth;H=c.height=window.innerHeight;};
    window.addEventListener('resize',resize);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);};
  },[dark]);
  return <canvas ref={ref} style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0}}/>;
};

/* ── reusable input ─────────────────────────────────────── */
const Input = ({ label, type='text', placeholder, value, onChange, error, icon, dark, rightSlot, autoFocus }) => {
  const T = dark ? DARK : LIGHT;
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:18 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:700, color:T.textMid, marginBottom:7, letterSpacing:'.02em' }}>{label}</label>
      <div style={{ position:'relative' }}>
        <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:16, pointerEvents:'none', zIndex:1 }}>{icon}</span>
        <input
          type={type} placeholder={placeholder} value={value} autoFocus={autoFocus}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ width:'100%', padding:'13px 44px 13px 42px', background: dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', border:`1.5px solid ${error?T.red:focused?T.a1:T.border}`, borderRadius:10, fontSize:14, color:T.text, outline:'none', fontFamily:'inherit', transition:'border-color .2s, box-shadow .2s', boxShadow:focused?`0 0 0 3px ${T.a1}22`:'none' }}
        />
        {rightSlot && <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', zIndex:1 }}>{rightSlot}</span>}
      </div>
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            style={{ fontSize:11, color:T.red, marginTop:5, display:'flex', alignItems:'center', gap:4 }}>
            ⚠ {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── role tab ────────────────────────────────────────────── */
const RoleTab = ({ role, active, onClick, dark }) => {
  const T = dark ? DARK : LIGHT;
  const accent = role === 'admin' ? T.a2 : T.a1;
  return (
    <motion.button whileTap={{ scale:.97 }} onClick={onClick}
      style={{ flex:1, padding:'11px 8px', borderRadius:10, border:`1.5px solid ${active?accent:T.border}`, background: active?(dark?`${accent}14`:`${accent}0D`):'transparent', color:active?accent:T.textMid, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', transition:'all .22s', display:'flex', alignItems:'center', justifyContent:'center', gap:7, boxShadow:active?`0 0 18px ${accent}33`:'none' }}>
      <span style={{ fontSize:16 }}>{role==='admin'?'🛡️':'👤'}</span>
      {role==='admin' ? 'Admin' : 'User'}
    </motion.button>
  );
};

/* ── forgot password panel ───────────────────────────────── */
const ForgotPanel = ({ dark, onBack }) => {
  const T = dark ? DARK : LIGHT;
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handle = async () => {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { setError('Enter a valid email address'); return; }
    setError(''); setLoading(true);
    const { error: err } = await authService.forgotPassword(email);
    setLoading(false);
    if (err) { toast.error(err, { position:'top-right', autoClose:4000 }); return; }
    toast.success('Reset link sent 📬', { position:'top-right', autoClose:4000 });
    setSent(true);
  };

  return (
    <motion.div key="forgot" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }} transition={{ duration:.4 }}>
      <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', color:T.textMid, fontSize:13, fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, padding:0, marginBottom:28 }}>
        ← Back to sign in
      </button>
      {!sent ? (
        <>
          <div style={{ marginBottom:28 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:`${T.a1}18`, border:`1px solid ${T.a1}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, marginBottom:18 }}>🔑</div>
            <h1 style={{ fontSize:'1.7rem', fontWeight:900, letterSpacing:'-.04em', color:T.text, marginBottom:8 }}>Forgot password?</h1>
            <p style={{ fontSize:14, color:T.textMid, lineHeight:1.65 }}>Enter your email and we'll send a reset link instantly.</p>
          </div>
          <Input label="Email address" type="email" placeholder="you@company.com" value={email} onChange={v => { setEmail(v); setError(''); }} error={error} icon="📧" dark={dark} autoFocus />
          <motion.button whileTap={{ scale:.98 }} onClick={handle} disabled={loading}
            style={{ width:'100%', padding:'14px', borderRadius:10, border:'none', background:loading?T.border:`linear-gradient(135deg,${T.a1},${T.a2})`, color:loading?T.textSub:'#fff', fontWeight:800, fontSize:15, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
            {loading
              ? <><div style={{ width:16, height:16, border:`2px solid ${T.textSub}`, borderTopColor:T.a1, borderRadius:'50%', animation:'spin .7s linear infinite' }} />Sending…</>
              : 'Send Reset Link'
            }
          </motion.button>
        </>
      ) : (
        <motion.div initial={{ opacity:0, scale:.9 }} animate={{ opacity:1, scale:1 }} style={{ textAlign:'center', paddingTop:20 }}>
          <motion.div initial={{ scale:0 }} animate={{ scale:[0,1.2,1] }} transition={{ duration:.55, ease:'backOut' }}
            style={{ width:72, height:72, borderRadius:'50%', background:`${T.green}18`, border:`2px solid ${T.green}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, margin:'0 auto 24px' }}>✅</motion.div>
          <h2 style={{ fontSize:'1.5rem', fontWeight:900, color:T.text, marginBottom:10 }}>Check your inbox!</h2>
          <p style={{ fontSize:14, color:T.textMid, lineHeight:1.7, marginBottom:8 }}>We've sent a password reset link to</p>
          <p style={{ fontSize:14, color:T.a1, fontWeight:700, marginBottom:28 }}>{email}</p>
          <div style={{ padding:'14px 18px', borderRadius:12, background:dark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.04)', border:`1px solid ${T.border}`, fontSize:13, color:T.textMid, lineHeight:1.6, marginBottom:24 }}>
            Didn't get it? Check your spam folder or{' '}
            <span style={{ color:T.a1, fontWeight:700, cursor:'pointer' }} onClick={() => setSent(false)}>resend the link.</span>
          </div>
          <button onClick={onBack}
            style={{ width:'100%', padding:'13px', borderRadius:10, border:`1.5px solid ${T.border}`, background:'transparent', color:T.textMid, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
            ← Back to sign in
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

/* ════════════════════════════════════════════════════════════
   MAIN LOGIN PAGE
════════════════════════════════════════════════════════════ */
export default function LoginPage({ darkMode, onToggleDarkMode, onNavigateRegister, onNavigateLanding, onLoginSuccess }) {
  const T = darkMode ? DARK : LIGHT;
  const { login } = useAuth();

  const [role, setRole]         = useState('user');
  const [view, setView]         = useState('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});
  const [shake, setShake]       = useState(false);

  const accentGrad = `linear-gradient(135deg,${T.a1},${T.a2})`;

  const validate = () => {
    const e = {};
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Enter a valid email address';
    if (password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) { setShake(true); setTimeout(() => setShake(false), 500); return; }
    setLoading(true);
    // Pass `remember` so AuthContext saves to correct storage
    const result = await login(email, password, role, remember);
    setLoading(false);

    if (!result.success) {
      setErrors({ general: result.error });
      setShake(true); setTimeout(() => setShake(false), 500);
      toast.error(result.error, { position:'top-right', autoClose:4000 });
      return;
    }

    toast.success('Welcome back! Redirecting… 🚀', { position:'top-right', autoClose:2000 });
    setTimeout(() => onLoginSuccess?.(result.role || role), 600);
  };

  // Features shown on the left panel — no dummy data, just feature descriptions
  const features = [
    { icon:'📦', title:'Real-time Inventory', desc:'Track every SKU across all warehouses with live stock levels.' },
    { icon:'🤖', title:'AI-powered Insights', desc:'Get reorder recommendations and demand forecasts from your actual data.' },
    { icon:'📧', title:'Low Stock Alerts',   desc:'Automatic email alerts to admin when stock falls below reorder point.' },
    { icon:'📊', title:'Live Reports',        desc:'Charts and KPIs calculated from your real transactions and orders.' },
    { icon:'🔐', title:'Role-based Access',   desc:'Admins manage everything. Users handle daily stock operations.' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:'"DM Sans","Inter",system-ui,sans-serif', display:'flex', position:'relative', overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        input::placeholder{color:${T.textSub};font-family:inherit;}
        input{color-scheme:${darkMode?'dark':'light'};}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
        .shake{animation:shake .45s ease;}
      `}</style>

      <Particles dark={darkMode} />

      {/* ── LEFT PANEL — branding + features only, no dummy data ── */}
      <motion.div
        initial={{ x:-60, opacity:0 }} animate={{ x:0, opacity:1 }} transition={{ duration:.8, ease:[.22,1,.36,1] }}
        style={{ width:'44%', minHeight:'100vh', background:darkMode?'rgba(13,21,38,0.97)':'rgba(238,242,255,0.97)', backdropFilter:'blur(24px)', borderRight:`1px solid ${T.border}`, display:'flex', flexDirection:'column', padding:'40px 48px', position:'relative', zIndex:1, overflow:'hidden' }}>

        {/* Glow blobs */}
        <div style={{ position:'absolute', bottom:-80, left:-80, width:340, height:340, borderRadius:'50%', background:`radial-gradient(circle,${T.g1},transparent 70%)`, filter:'blur(40px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:-40, right:-40, width:240, height:240, borderRadius:'50%', background:`radial-gradient(circle,${T.g2},transparent 70%)`, filter:'blur(36px)', pointerEvents:'none' }} />

        {/* Logo */}
        <button onClick={onNavigateLanding}
          style={{ background:'none', border:'none', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:10, padding:0, marginBottom:44, width:'fit-content' }}>
          <div style={{ width:36, height:36, borderRadius:10, background:accentGrad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, boxShadow:`0 0 18px ${T.g1}` }}>⚡</div>
          <span style={{ fontWeight:900, fontSize:18, color:T.text, letterSpacing:'-.02em' }}>InventIQ AI</span>
        </button>

        {/* Headline */}
        <div style={{ marginBottom:36 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.16em', color:T.a2, marginBottom:12 }}>WELCOME BACK</div>
          <h2 style={{ fontSize:'clamp(1.8rem,2.6vw,2.2rem)', fontWeight:900, letterSpacing:'-.04em', lineHeight:1.1, color:T.text, marginBottom:12 }}>
            Your inventory<br />is waiting for you.
          </h2>
          <p style={{ fontSize:14, color:T.textMid, lineHeight:1.7, maxWidth:300 }}>
            Sign in to access real-time stock tracking, AI-powered insights, and your team's live data.
          </p>
        </div>

        {/* Feature list — describes real system features, no made-up numbers */}
        <div style={{ display:'flex', flexDirection:'column', gap:14, flex:1 }}>
          {features.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:.3+i*.1 }}
              style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)', border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0, marginTop:1 }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:2 }}>{f.title}</div>
                <div style={{ fontSize:12, color:T.textSub, lineHeight:1.5 }}>{f.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom tagline */}
        <div style={{ marginTop:32, padding:'14px 16px', borderRadius:12, background:darkMode?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.04)', border:`1px solid ${T.border}` }}>
          <div style={{ fontSize:12, color:T.textMid, lineHeight:1.6 }}>
            🔒 <strong style={{ color:T.text }}>Secure & role-based.</strong> Admins have full control. Inventory users handle daily operations. All data is fetched live from your database.
          </div>
        </div>
      </motion.div>

      {/* ── RIGHT PANEL — login form ───────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:'100vh', position:'relative', zIndex:1 }}>

        {/* Top bar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'24px 48px' }}>
          <div style={{ fontSize:13, color:T.textSub }}>
            Don't have an account?{' '}
            <button onClick={onNavigateRegister}
              style={{ background:'none', border:'none', cursor:'pointer', color:T.a1, fontWeight:700, fontSize:13, fontFamily:'inherit', padding:0 }}>
              Create one →
            </button>
          </div>
          <button onClick={onToggleDarkMode}
            style={{ background:darkMode?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.07)', border:`1px solid ${T.border}`, borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:15, color:T.text, fontFamily:'inherit' }}>
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>

        {/* Form center */}
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'10px 48px 48px' }}>
          <div style={{ width:'100%', maxWidth:460 }}>
            <AnimatePresence mode="wait">

              {/* Forgot Password */}
              {view === 'forgot' && (
                <ForgotPanel key="forgot" dark={darkMode} onBack={() => setView('login')} />
              )}

              {/* Login Form */}
              {view === 'login' && (
                <motion.div key="login" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }} transition={{ duration:.4 }}>

                  <div style={{ marginBottom:28 }}>
                    <h1 style={{ fontSize:'clamp(1.6rem,2.5vw,2rem)', fontWeight:900, letterSpacing:'-.04em', color:T.text, marginBottom:6 }}>
                      Sign in to InventIQ
                    </h1>
                    <p style={{ fontSize:14, color:T.textMid }}>Enter your credentials to access your dashboard.</p>
                  </div>

                  {/* Role tabs */}
                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.textMid, marginBottom:10 }}>Sign in as</div>
                    <div style={{ display:'flex', gap:10 }}>
                      <RoleTab role="user"  active={role==='user'}  onClick={() => setRole('user')}  dark={darkMode} />
                      <RoleTab role="admin" active={role==='admin'} onClick={() => setRole('admin')} dark={darkMode} />
                    </div>
                  </div>

                  {/* Role info badge */}
                  <AnimatePresence mode="wait">
                    <motion.div key={role} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }} transition={{ duration:.2 }}
                      style={{ padding:'10px 14px', borderRadius:10, background:darkMode?`${role==='admin'?T.a2:T.a1}10`:`${role==='admin'?T.a2:T.a1}0A`, border:`1px solid ${role==='admin'?T.a2:T.a1}30`, marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:17 }}>{role==='admin'?'🛡️':'👤'}</span>
                      <span style={{ fontSize:12, color:T.textMid, lineHeight:1.5 }}>
                        {role==='admin'
                          ? 'Admin: full system control, user management, all analytics.'
                          : 'User: manage stock, log transactions, access AI assistant.'
                        }
                      </span>
                    </motion.div>
                  </AnimatePresence>

                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
                    <div style={{ flex:1, height:1, background:T.border }} />
                    <span style={{ fontSize:11, color:T.textSub, fontWeight:600 }}>sign in with email</span>
                    <div style={{ flex:1, height:1, background:T.border }} />
                  </div>

                  {/* General error */}
                  <AnimatePresence>
                    {errors.general && (
                      <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                        style={{ padding:'12px 16px', borderRadius:10, background:`${T.red}14`, border:`1px solid ${T.red}44`, marginBottom:18, display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:18 }}>🚫</span>
                        <span style={{ fontSize:13, color:T.red, fontWeight:600 }}>{errors.general}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Inputs */}
                  <div className={shake ? 'shake' : ''} onKeyDown={e => e.key==='Enter' && handleLogin()}>
                    <Input
                      label="Email address" type="email" placeholder="you@company.com"
                      value={email}
                      onChange={v => { setEmail(v); setErrors(e => ({ ...e, email:undefined, general:undefined })); }}
                      error={errors.email} icon="📧" dark={darkMode} autoFocus
                    />
                    <Input
                      label="Password" type={showPw?'text':'password'} placeholder="Your password"
                      value={password}
                      onChange={v => { setPassword(v); setErrors(e => ({ ...e, password:undefined, general:undefined })); }}
                      error={errors.password} icon="🔒" dark={darkMode}
                      rightSlot={
                        <button onClick={() => setShowPw(v=>!v)}
                          style={{ background:'none', border:'none', cursor:'pointer', fontSize:15, color:T.textSub, padding:0, fontFamily:'inherit' }}>
                          {showPw ? '🙈' : '👁️'}
                        </button>
                      }
                    />
                  </div>

                  {/* Remember me + Forgot */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                    <div
                      style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}
                      onClick={() => setRemember(v => !v)}>
                      <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${remember?T.a1:T.border}`, background:remember?T.a1:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .2s' }}>
                        {remember && <span style={{ fontSize:10, color:'#fff', fontWeight:900 }}>✓</span>}
                      </div>
                      <div>
                        <span style={{ fontSize:13, color:T.textMid }}>Remember me</span>
                        <div style={{ fontSize:10, color:T.textSub, marginTop:1 }}>
                          {remember ? 'Stay signed in across browser restarts' : 'Sign out when browser closes'}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setView('forgot')}
                      style={{ background:'none', border:'none', cursor:'pointer', color:T.a1, fontSize:13, fontWeight:700, fontFamily:'inherit', padding:0 }}>
                      Forgot password?
                    </button>
                  </div>

                  {/* Submit */}
                  <motion.button whileTap={{ scale:.98 }} onClick={handleLogin} disabled={loading}
                    style={{ width:'100%', padding:'14px', borderRadius:10, border:'none', background:loading?T.border:`linear-gradient(135deg,${T.a1},${T.a2})`, color:loading?T.textSub:'#fff', fontWeight:800, fontSize:15, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', boxShadow:loading?'none':`0 0 28px ${T.g1}`, transition:'all .25s', display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:20 }}>
                    {loading
                      ? <><div style={{ width:16, height:16, border:`2px solid ${T.textSub}`, borderTopColor:T.a1, borderRadius:'50%', animation:'spin .7s linear infinite' }} />Signing in…</>
                      : `Sign in as ${role==='admin'?'Admin':'User'} →`
                    }
                  </motion.button>

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'16px 48px', borderTop:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:12, color:T.textSub }}>© 2026 InventIQ AI</span>
          <div style={{ display:'flex', gap:20 }}>
            {['Privacy','Terms','Security'].map(l => (
              <a key={l} href="#"
                style={{ fontSize:12, color:T.textSub, textDecoration:'none' }}
                onMouseEnter={e => e.currentTarget.style.color=T.text}
                onMouseLeave={e => e.currentTarget.style.color=T.textSub}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}