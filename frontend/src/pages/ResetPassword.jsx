import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import authService from '../api/authService';

/* ── tokens — identical to LoginPage ────────────────────── */
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

/* ── animated particle background — same as LoginPage ───── */
const Particles = ({ dark }) => {
  const ref = useRef(null);
  useEffect(() => {
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

/* ── reusable input — identical to LoginPage ─────────────── */
const Input = ({ label, type='text', placeholder, value, onChange, error, icon, dark, rightSlot, autoFocus }) => {
  const T = dark ? DARK : LIGHT;
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:18 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:700, color:T.textMid, marginBottom:7, letterSpacing:'.02em' }}>{label}</label>
      <div style={{ position:'relative' }}>
        <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:16, pointerEvents:'none', zIndex:1 }}>{icon}</span>
        <input type={type} placeholder={placeholder} value={value} autoFocus={autoFocus}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ width:'100%', padding:'13px 44px 13px 42px', background: dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', border:`1.5px solid ${error?T.red:focused?T.a1:T.border}`, borderRadius:10, fontSize:14, color:T.text, outline:'none', fontFamily:'inherit', transition:'border-color .2s, box-shadow .2s', boxShadow: focused?`0 0 0 3px ${T.a1}22`:'none' }} />
        {rightSlot && <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', zIndex:1 }}>{rightSlot}</span>}
      </div>
      <AnimatePresence>
        {error && <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }} style={{ fontSize:11, color:T.red, marginTop:5, display:'flex', alignItems:'center', gap:4 }}>⚠ {error}</motion.div>}
      </AnimatePresence>
    </div>
  );
};

/* ── password strength meter — same style as RegisterPage ── */
const StrengthMeter = ({ password, dark }) => {
  const T = dark ? DARK : LIGHT;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', T.red, '#F59E0B', '#EAB308', T.green];
  if (!password) return null;
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ display:'flex', gap:5, marginBottom:6 }}>
        {[1,2,3,4].map(i => (
          <motion.div key={i} initial={{ scaleX:0 }} animate={{ scaleX:1 }}
            style={{ flex:1, height:4, borderRadius:99, background: i<=score ? colors[score] : T.border, transition:'background .3s', transformOrigin:'left' }} />
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:11, color:colors[score], fontWeight:700 }}>{labels[score]}</span>
        <div style={{ display:'flex', gap:8 }}>
          {[['8+ chars',checks[0]],['Uppercase',checks[1]],['Number',checks[2]],['Symbol',checks[3]]].map(([l,ok]) => (
            <span key={l} style={{ fontSize:10, color: ok?T.green:T.textSub }}>{ok?'✓':'○'} {l}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   MAIN — ResetPasswordPage
════════════════════════════════════════════════════════════ */
export default function ResetPasswordPage({ darkMode, onToggleDarkMode, onNavigateLogin }) {
  const T = darkMode ? DARK : LIGHT;

  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw]               = useState(false);
  const [showCpw, setShowCpw]             = useState(false);
  const [errors, setErrors]               = useState({});
  const [loading, setLoading]             = useState(false);
  const [done, setDone]                   = useState(false);

  // Read token from URL query string: ?token=xxxxx
  const token = new URLSearchParams(window.location.search).get('token');
  const accentGrad = `linear-gradient(135deg,${T.a1},${T.a2})`;

  const validate = () => {
    const e = {};
    if (!token)               e.general  = 'Invalid or missing reset token. Please request a new link.';
    if (password.length < 8)  e.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleReset = async () => {
    if (!validate()) return;
    setLoading(true);
    const { data, error } = await authService.resetPassword(token, password);
    setLoading(false);
    if (error) {
      setErrors({ general: error });
      toast.error(error, { position:'top-right', autoClose:4000 });
      return;
    }
    toast.success('Password reset successfully! Redirecting to login… ✅', { position:'top-right', autoClose:3000 });
    setDone(true);
    setTimeout(() => onNavigateLogin?.(), 500);
  };

  const leftFeatures = [
    { icon:'🔒', text:'End-to-end encrypted reset flow' },
    { icon:'⚡', text:'Instant access after resetting' },
    { icon:'🛡️', text:'Tokens expire after 30 minutes' },
    { icon:'📧', text:'Secure link sent only to your email' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:'"DM Sans","Inter",system-ui,sans-serif', display:'flex', position:'relative', overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        input::placeholder{color:${T.textSub};font-family:inherit;}
        input{color-scheme:${darkMode?'dark':'light'};}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
      `}</style>

      <Particles dark={darkMode} />

      {/* ── LEFT PANEL — matches LoginPage exactly ─── */}
      <motion.div initial={{ x:-60, opacity:0 }} animate={{ x:0, opacity:1 }} transition={{ duration:.8, ease:[.22,1,.36,1] }}
        style={{ width:'44%', minHeight:'100vh', background: darkMode?'rgba(13,21,38,0.97)':'rgba(238,242,255,0.97)', backdropFilter:'blur(24px)', borderRight:`1px solid ${T.border}`, display:'flex', flexDirection:'column', padding:'40px 48px', position:'relative', zIndex:1, overflow:'hidden' }}>

        {/* glow blobs — same as LoginPage */}
        <div style={{ position:'absolute', bottom:-80, left:-80, width:340, height:340, borderRadius:'50%', background:`radial-gradient(circle,${T.g1},transparent 70%)`, filter:'blur(40px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:-40, right:-40, width:240, height:240, borderRadius:'50%', background:`radial-gradient(circle,${T.g2},transparent 70%)`, filter:'blur(36px)', pointerEvents:'none' }} />

        {/* Logo */}
        <button onClick={onNavigateLogin} style={{ background:'none', border:'none', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:10, padding:0, marginBottom:52, width:'fit-content' }}>
          <div style={{ width:32, height:32, borderRadius:8, background:accentGrad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, boxShadow:`0 0 18px ${T.g1}` }}>⚡</div>
          <span style={{ fontWeight:900, fontSize:17, color:T.text, letterSpacing:'-.02em' }}>InventIQ AI</span>
        </button>

        {/* Heading */}
        <div style={{ marginBottom:36 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.16em', color:T.a2, marginBottom:14 }}>ACCOUNT SECURITY</div>
          <h2 style={{ fontSize:'clamp(1.8rem,2.6vw,2.3rem)', fontWeight:900, letterSpacing:'-.04em', lineHeight:1.08, color:T.text, marginBottom:14 }}>
            Create a new<br />secure password.
          </h2>
          <p style={{ fontSize:14, color:T.textMid, lineHeight:1.7, maxWidth:300 }}>
            Your account is protected. Set a strong password to get back in.
          </p>
        </div>

        {/* Security features list */}
        <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:36 }}>
          {leftFeatures.map((f,i) => (
            <motion.div key={f.text} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:.3+i*.1 }}
              style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)', border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{f.icon}</div>
              <span style={{ fontSize:13, color:T.textMid, fontWeight:500 }}>{f.text}</span>
            </motion.div>
          ))}
        </div>

        {/* About card — like RegisterPage testimonial */}
        <div style={{ marginTop:'auto', padding:'20px 22px', borderRadius:14, background: darkMode?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.04)', border:`1px solid ${T.border}` }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.12em', color:T.textSub, marginBottom:10 }}>ABOUT INVENTIQ AI</div>
          <p style={{ fontSize:13, color:T.textMid, lineHeight:1.65 }}>
            AI-powered inventory management — real-time tracking, smart reorder alerts, demand forecasting, and a conversational AI assistant. All in one platform.
          </p>
        </div>
      </motion.div>

      {/* ── RIGHT PANEL ──────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:'100vh', position:'relative', zIndex:1 }}>

        {/* Top bar — same as LoginPage */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'24px 48px' }}>
          <div style={{ fontSize:13, color:T.textSub }}>
            Remember your password?{' '}
            <button onClick={onNavigateLogin} style={{ background:'none', border:'none', cursor:'pointer', color:T.a1, fontWeight:700, fontSize:13, fontFamily:'inherit', padding:0 }}>
              Sign in →
            </button>
          </div>
          <button onClick={onToggleDarkMode} style={{ background: darkMode?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.07)', border:`1px solid ${T.border}`, borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:15, color:T.text, fontFamily:'inherit', transition:'all .2s' }}>
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>

        {/* Center form */}
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'10px 48px 48px' }}>
          <div style={{ width:'100%', maxWidth:460 }}>

            <AnimatePresence mode="wait">

              {/* ── SUCCESS STATE ─────────────────────── */}
              {done && (
                <motion.div key="success" initial={{ opacity:0, scale:.9 }} animate={{ opacity:1, scale:1 }} style={{ textAlign:'center', paddingTop:20 }}>
                  <motion.div initial={{ scale:0 }} animate={{ scale:[0,1.2,1] }} transition={{ duration:.55, ease:'backOut' }}
                    style={{ width:80, height:80, borderRadius:'50%', background:`${T.green}18`, border:`2px solid ${T.green}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, margin:'0 auto 24px' }}>
                    ✅
                  </motion.div>
                  <h2 style={{ fontSize:'1.7rem', fontWeight:900, letterSpacing:'-.04em', color:T.text, marginBottom:10 }}>Password Reset!</h2>
                  <p style={{ fontSize:14, color:T.textMid, lineHeight:1.7, marginBottom:28 }}>
                    Your password has been updated successfully.<br />Redirecting you to sign in…
                  </p>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, color:T.textSub, fontSize:13 }}>
                    <div style={{ width:16, height:16, border:`2px solid ${T.a1}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
                    Taking you to the login page…
                  </div>
                </motion.div>
              )}

              {/* ── FORM STATE ────────────────────────── */}
              {!done && (
                <motion.div key="form" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }} transition={{ duration:.45 }}>

                  {/* Heading */}
                  <div style={{ marginBottom:28 }}>
                    <div style={{ width:52, height:52, borderRadius:14, background:`${T.a1}18`, border:`1px solid ${T.a1}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, marginBottom:18 }}>🔑</div>
                    <h1 style={{ fontSize:'clamp(1.6rem,2.5vw,2.1rem)', fontWeight:900, letterSpacing:'-.04em', color:T.text, marginBottom:6 }}>Set new password</h1>
                    <p style={{ fontSize:14, color:T.textMid }}>Must be at least 8 characters with a number and uppercase letter.</p>
                  </div>

                  {/* No-token warning */}
                  {!token && (
                    <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
                      style={{ padding:'14px 16px', borderRadius:10, background:`${T.red}14`, border:`1px solid ${T.red}44`, marginBottom:20, display:'flex', alignItems:'flex-start', gap:10 }}>
                      <span style={{ fontSize:18 }}>⚠️</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:T.red, marginBottom:4 }}>Invalid reset link</div>
                        <div style={{ fontSize:12, color:T.textMid }}>This link is missing a token. Please go back and request a new password reset email.</div>
                      </div>
                    </motion.div>
                  )}

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

                  {/* Divider */}
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:22 }}>
                    <div style={{ flex:1, height:1, background:T.border }} />
                    <span style={{ fontSize:11, color:T.textSub, fontWeight:600 }}>enter your new password</span>
                    <div style={{ flex:1, height:1, background:T.border }} />
                  </div>

                  {/* Password field */}
                  <Input label="New password" type={showPw?'text':'password'} placeholder="Create a strong password"
                    value={password} onChange={v => { setPassword(v); setErrors(e => ({ ...e, password:undefined, general:undefined })); }}
                    error={errors.password} icon="🔒" dark={darkMode} autoFocus
                    rightSlot={
                      <button onClick={() => setShowPw(v => !v)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:15, color:T.textSub, padding:0, fontFamily:'inherit' }}>
                        {showPw ? '🙈' : '👁️'}
                      </button>
                    } />

                  {/* Strength meter */}
                  <StrengthMeter password={password} dark={darkMode} />

                  {/* Confirm field */}
                  <Input label="Confirm new password" type={showCpw?'text':'password'} placeholder="Repeat your password"
                    value={confirmPassword} onChange={v => { setConfirmPassword(v); setErrors(e => ({ ...e, confirmPassword:undefined })); }}
                    error={errors.confirmPassword} icon="🔒" dark={darkMode}
                    rightSlot={
                      <button onClick={() => setShowCpw(v => !v)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:15, color:T.textSub, padding:0, fontFamily:'inherit' }}>
                        {showCpw ? '🙈' : '👁️'}
                      </button>
                    } />

                  {/* Password match indicator */}
                  {confirmPassword && (
                    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                      style={{ fontSize:12, color: password===confirmPassword ? T.green : T.red, marginTop:-10, marginBottom:18, display:'flex', alignItems:'center', gap:5 }}>
                      {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </motion.div>
                  )}

                  {/* Submit button */}
                  <motion.button whileTap={{ scale:.98 }} onClick={handleReset} disabled={loading || !token}
                    style={{ width:'100%', padding:'14px', borderRadius:10, border:'none', background: (loading||!token) ? T.border : accentGrad, color: (loading||!token) ? T.textSub : '#fff', fontWeight:800, fontSize:15, cursor: (loading||!token) ? 'not-allowed' : 'pointer', fontFamily:'inherit', boxShadow: (loading||!token) ? 'none' : `0 0 28px ${T.g1}`, transition:'all .25s', display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:20 }}>
                    {loading
                      ? <><div style={{ width:16, height:16, border:`2px solid ${T.textSub}`, borderTopColor:T.a1, borderRadius:'50%', animation:'spin .7s linear infinite' }} />Resetting password…</>
                      : 'Reset Password →'
                    }
                  </motion.button>

                  {/* Back to login */}
                  <div style={{ textAlign:'center' }}>
                    <button onClick={onNavigateLogin} style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:T.textSub, fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:5 }}>
                      ← Back to sign in
                    </button>
                  </div>

                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

        {/* Footer — same as LoginPage */}
        <div style={{ padding:'16px 48px', borderTop:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:12, color:T.textSub }}>© 2026 InventIQ AI</span>
          <div style={{ display:'flex', gap:20 }}>
            {['Privacy','Terms','Security'].map(l => (
              <a key={l} href="#" style={{ fontSize:12, color:T.textSub, textDecoration:'none' }}
                onMouseEnter={e => e.currentTarget.style.color=T.text}
                onMouseLeave={e => e.currentTarget.style.color=T.textSub}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}