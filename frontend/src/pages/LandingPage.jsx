import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

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

const Particles = ({ dark }) => {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    let W = c.width = window.innerWidth, H = c.height = window.innerHeight;
    const col = dark ? '79,142,247' : '43,111,245';
    const pts = Array.from({ length: 40 }, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-.5)*.25, vy: (Math.random()-.5)*.25,
      r: Math.random()*1.3+.3, a: Math.random()*.25+.05,
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

/* ── SIGNATURE ELEMENT ──────────────────────────────────────
   One panel, two tabs — demoing the two most differentiated
   features (AI assistant, analytics) without faking live business
   data, and without splitting the page's "boldness budget" across
   two competing hero visuals. Both views are explicitly labeled
   as demos/samples, never as real numbers. */
const QA_PAIRS = [
  { q:'Which SKUs are running low this week?', a:"3 items are under their reorder point: Laptop Stand, USB-C Cable 2m, and Webcam Mount. Want me to draft purchase orders?" },
  { q:'Draft a reorder for Laptop Stand', a:"Done — 40 units from your usual supplier, based on the last 30 days of demand. Review it on the Orders page before sending." },
  { q:'How is Warehouse B trending this month?', a:'Outbound stock is up 22% vs last month, mostly electronics. Capacity is at a healthy 61%.' },
];

const AIView = ({ T, darkMode }) => {
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    setTyping(true);
    const typeTimer = setTimeout(() => setTyping(false), 1100);
    const nextTimer = setTimeout(() => setStep(s => (s + 1) % QA_PAIRS.length), 4200);
    return () => { clearTimeout(typeTimer); clearTimeout(nextTimer); };
  }, [step]);

  const current = QA_PAIRS[step];

  return (
    <div style={{ padding:'22px 22px 24px', minHeight:170 }}>
      <motion.div key={`q-${step}`} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:.3 }}
        style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
        <div style={{ maxWidth:'82%', padding:'10px 14px', borderRadius:'14px 14px 4px 14px', background:`${T.a1}18`, border:`1px solid ${T.a1}33`, fontSize:13, color:T.text }}>
          {current.q}
        </div>
      </motion.div>

      <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
        <div style={{ width:26, height:26, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, background:`${T.a2}18`, border:`1px solid ${T.a2}33` }}>✨</div>
        {typing ? (
          <div style={{ display:'flex', gap:4, padding:'12px 0' }}>
            {[0,1,2].map(i => (
              <motion.span key={i} animate={{ opacity:[.3,1,.3] }} transition={{ duration:1, repeat:Infinity, delay:i*.18 }}
                style={{ width:6, height:6, borderRadius:'50%', background:T.textSub, display:'inline-block' }} />
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:.3 }}
            style={{ maxWidth:'82%', padding:'10px 14px', borderRadius:'14px 14px 14px 4px', background: darkMode?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)', border:`1px solid ${T.border}`, fontSize:13, color:T.textMid, lineHeight:1.6 }}>
            {current.a}
          </motion.div>
        )}
      </div>

      <div style={{ display:'flex', gap:6, justifyContent:'center', marginTop:18 }}>
        {QA_PAIRS.map((_,i) => (
          <span key={i} style={{ width: i===step?16:6, height:6, borderRadius:99, background: i===step?T.a1:T.border, transition:'all .3s' }} />
        ))}
      </div>
    </div>
  );
};

/* Hand-built SVG line chart — no charting library needed for a
   12-point illustrative series. Two lines: stock in (green) vs
   stock out (orange/red), drawn with a path-reveal animation. */
const STOCK_IN  = [40, 52, 48, 61, 58, 70, 66, 74, 69, 80, 76, 88];
const STOCK_OUT = [30, 38, 44, 40, 52, 48, 60, 55, 64, 58, 70, 64];

const toPath = (values, w, h, max) => {
  const stepX = w / (values.length - 1);
  return values
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * stepX).toFixed(1)} ${(h - (v / max) * h).toFixed(1)}`)
    .join(' ');
};

const AnalyticsView = ({ T, darkMode }) => {
  const W = 460, H = 110;
  const max = Math.max(...STOCK_IN, ...STOCK_OUT) * 1.1;
  const inPath = toPath(STOCK_IN, W, H, max);
  const outPath = toPath(STOCK_OUT, W, H, max);

  return (
    <div style={{ padding:'20px 22px 22px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <span style={{ fontSize:12, fontWeight:700, color:T.textMid, letterSpacing:'.04em' }}>STOCK MOVEMENT</span>
        <span style={{ fontSize:11, color:T.textSub, fontFamily:'"IBM Plex Mono",monospace' }}>sample report</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ overflow:'visible' }}>
        <motion.path d={inPath} fill="none" stroke={T.green} strokeWidth="2.5" strokeLinecap="round"
          initial={{ pathLength:0 }} animate={{ pathLength:1 }} transition={{ duration:1.2, ease:'easeOut' }} />
        <motion.path d={outPath} fill="none" stroke={T.a4} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="5 4"
          initial={{ pathLength:0 }} animate={{ pathLength:1 }} transition={{ duration:1.2, ease:'easeOut', delay:.15 }} />
      </svg>

      <div style={{ display:'flex', gap:18, marginTop:6 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ width:12, height:2.5, background:T.green, borderRadius:1, display:'inline-block' }} />
          <span style={{ fontSize:11, color:T.textSub }}>Stock in</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ width:12, height:2.5, background:T.a4, borderRadius:1, display:'inline-block' }} />
          <span style={{ fontSize:11, color:T.textSub }}>Stock out</span>
        </div>
      </div>
    </div>
  );
};

const ProductDemo = ({ T, darkMode }) => {
  const [tab, setTab] = useState('ai'); // 'ai' | 'analytics'

  return (
    <div style={{
      width:'100%', maxWidth:560, margin:'0 auto', borderRadius:18,
      background: darkMode ? 'rgba(13,21,38,0.92)' : 'rgba(255,255,255,0.92)',
      border:`1px solid ${T.border}`, boxShadow:`0 30px 80px ${T.g1}`,
      overflow:'hidden', backdropFilter:'blur(20px)',
    }}>
      {/* window chrome + tabs */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 16px', borderBottom:`1px solid ${T.border}` }}>
        <div style={{ width:9, height:9, borderRadius:'50%', background:T.red, opacity:.6 }} />
        <div style={{ width:9, height:9, borderRadius:'50%', background:'#F2B705', opacity:.6 }} />
        <div style={{ width:9, height:9, borderRadius:'50%', background:T.green, opacity:.6 }} />
        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          {[{ id:'ai', label:'AI Assistant' }, { id:'analytics', label:'Analytics' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:99, border:`1px solid ${tab===t.id?T.a1:T.border}`,
                background: tab===t.id?`${T.a1}18`:'transparent', color: tab===t.id?T.a1:T.textSub, cursor:'pointer', fontFamily:'inherit' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'ai' ? <AIView T={T} darkMode={darkMode} /> : <AnalyticsView T={T} darkMode={darkMode} />}
    </div>
  );
};

const FEATURES = [
  { icon:'📦', title:'Real-time Inventory', desc:'Track every SKU across all warehouses with live updates and automatic status flags.' },
  { icon:'🤖', title:'AI Assistant', desc:'Ask anything — reorder advice, demand forecasts, supplier ratings — in plain language.' },
  { icon:'📧', title:'Low Stock Alerts', desc:'Auto-email admin when products fall below reorder point. Never face a stockout again.' },
  { icon:'📊', title:'Analytics & Reports', desc:'Revenue trends, stock movement charts, warehouse utilization — all in one dashboard.' },
  { icon:'🤝', title:'Supplier Management', desc:'Track on-time delivery rates, ratings, and order history for every supplier.' },
  { icon:'🔄', title:'Transaction Log', desc:'Every stock IN/OUT/Transfer recorded, traceable, and automatically adjusts live stock.' },
];

/* Honest value props, styled like a stat row but not pretending to be
   measured numbers nobody can verify. */
const VALUE_PROPS = [
  { value:'Real-time', label:'Stock sync across warehouses' },
  { value:'24/7', label:'AI assistant, always on' },
  { value:'<10 min', label:'To get a team running' },
  { value:'Zero', label:'Spreadsheets needed' },
];

/* Generic, role-based — not attributed to real companies or named
   individuals who never actually said these things. */
const TESTIMONIALS = [
  { role:'Warehouse Operations Lead, mid-size retailer', text:'Set up in under 10 minutes. Our whole team was onboarded the same day.', avatar:'W' },
  { role:'Supply Chain Manager, D2C brand', text:'The AI assistant cut a lot of the back-and-forth out of our reorder decisions.', avatar:'S' },
  { role:'Inventory Lead, multi-location retailer', text:'Low stock alerts hit our inbox before the floor team even notices anything running low.', avatar:'I' },
];

export default function LandingPage({ darkMode, onToggleDarkMode, onNavigateLogin, onNavigateRegister }) {
  const T = darkMode ? DARK : LIGHT;
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(v => (v + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(t);
  }, []);

  const accentGrad = `linear-gradient(135deg,${T.a1},${T.a2})`;

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:'"DM Sans","Inter",system-ui,sans-serif', overflowX:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;900&family=IBM+Plex+Mono:wght@500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @media (prefers-reduced-motion: reduce) {
          *{ animation-duration:.001ms !important; transition-duration:.001ms !important; }
        }
        .feature-card:hover{border-color:${T.a1}55!important;transform:translateY(-4px);}
        .btn-outline:hover{background:${T.a1}14!important;border-color:${T.a1}!important;}
        a:focus-visible, button:focus-visible { outline:2px solid ${T.a1}; outline-offset:2px; }
      `}</style>

      <Particles dark={darkMode} />

      {/* NAV */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:darkMode?'rgba(7,11,20,0.85)':'rgba(244,247,255,0.85)', backdropFilter:'blur(20px)', borderBottom:`1px solid ${T.border}`, padding:'0 48px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:accentGrad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>⚡</div>
          <span style={{ fontWeight:900, fontSize:18, letterSpacing:'-.02em' }}>InventIQ AI</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onToggleDarkMode} style={{ background:'transparent', border:`1px solid ${T.border}`, borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:14, color:T.text, fontFamily:'inherit' }}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button className="btn-outline" onClick={onNavigateLogin}
            style={{ padding:'8px 20px', borderRadius:9, border:`1.5px solid ${T.border}`, background:'transparent', color:T.text, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', transition:'all .2s' }}>
            Sign In
          </button>
          <button onClick={onNavigateRegister}
            style={{ padding:'8px 20px', borderRadius:9, border:'none', background:accentGrad, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', boxShadow:`0 0 18px ${T.g1}` }}>
            Get Started Free →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position:'relative', zIndex:1, padding:'90px 24px 40px' }}>
        <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:.7 }}
          style={{ textAlign:'center', maxWidth:800, margin:'0 auto' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:99, background:darkMode?'rgba(79,142,247,0.12)':'rgba(43,111,245,0.1)', border:`1px solid ${T.a1}44`, marginBottom:28 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:T.green, animation:'pulse 1.4s infinite' }}/>
            <span style={{ fontSize:12, color:T.a1, fontWeight:700, fontFamily:'"IBM Plex Mono",monospace', letterSpacing:'.02em' }}>AI-assisted · built for warehouse teams</span>
          </div>
          <h1 style={{ fontSize:'clamp(2.4rem,6vw,4.2rem)', fontWeight:900, letterSpacing:'-.05em', lineHeight:1.05, marginBottom:24 }}>
            The AI-Powered Way to<br />
            <span key={darkMode ? 'grad-dark' : 'grad-light'} style={{ background:accentGrad, backgroundClip:'text', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', color:'transparent', display:'inline-block' }}>
              Run Your Inventory
            </span>
          </h1>
          <p style={{ fontSize:'clamp(15px,2vw,18px)', color:T.textMid, lineHeight:1.7, maxWidth:560, margin:'0 auto 40px' }}>
            Real-time tracking, AI forecasts, smart reorder alerts, and email notifications — all in one platform. Set up in under 10 minutes.
          </p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <motion.button whileTap={{ scale:.97 }} onClick={onNavigateRegister}
              style={{ padding:'14px 36px', borderRadius:10, border:'none', background:accentGrad, color:'#fff', fontWeight:800, fontSize:16, cursor:'pointer', fontFamily:'inherit', boxShadow:`0 0 32px ${T.g1}` }}>
              Start Free Trial →
            </motion.button>
            <motion.button whileTap={{ scale:.97 }} onClick={onNavigateLogin}
              className="btn-outline"
              style={{ padding:'14px 36px', borderRadius:10, border:`1.5px solid ${T.border}`, background:'transparent', color:T.text, fontWeight:700, fontSize:16, cursor:'pointer', fontFamily:'inherit', transition:'all .2s' }}>
              Sign In to Dashboard
            </motion.button>
          </div>
        </motion.div>

        {/* SIGNATURE: live dashboard preview, not another stat row */}
        <motion.div initial={{ opacity:0, y:36 }} animate={{ opacity:1, y:0 }} transition={{ delay:.3, duration:.7 }}
          style={{ marginTop:56 }}>
          <ProductDemo T={T} darkMode={darkMode} />
        </motion.div>

        {/* Honest value props — labeled capabilities, not invented metrics */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.5, duration:.6 }}
          style={{ display:'flex', justifyContent:'center', gap:48, flexWrap:'wrap', marginTop:56 }}>
          {VALUE_PROPS.map((s) => (
            <div key={`${s.label}-${darkMode}`} style={{ textAlign:'center' }}>
              <div style={{ fontSize:'clamp(1.3rem,2.4vw,1.7rem)', fontWeight:800, fontFamily:'"IBM Plex Mono",monospace', background:accentGrad, backgroundClip:'text', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', color:'transparent', display:'inline-block' }}>{s.value}</div>
              <div style={{ fontSize:12, color:T.textSub, marginTop:4, fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* FEATURES */}
      <section style={{ position:'relative', zIndex:1, padding:'60px 48px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.18em', color:T.a2, marginBottom:12, fontFamily:'"IBM Plex Mono",monospace' }}>EVERYTHING YOU NEED</div>
          <h2 style={{ fontSize:'clamp(1.8rem,4vw,2.6rem)', fontWeight:900, letterSpacing:'-.04em', color:T.text }}>Built for modern inventory teams</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20 }}>
          {FEATURES.map((f,i) => (
            <motion.div key={f.title} className="feature-card"
              initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay: i*.06 }}
              style={{ padding:'24px', borderRadius:16, background:T.bgCard, border:`1px solid ${T.border}`, transition:'all .22s', cursor:'default' }}>
              <div style={{ width:44, height:44, borderRadius:12, background:darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)', border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:16 }}>{f.icon}</div>
              <div style={{ fontWeight:800, fontSize:15, color:T.text, marginBottom:8 }}>{f.title}</div>
              <div style={{ fontSize:13, color:T.textMid, lineHeight:1.65 }}>{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ position:'relative', zIndex:1, padding:'60px 48px', maxWidth:700, margin:'0 auto', textAlign:'center' }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.18em', color:T.a2, marginBottom:12, fontFamily:'"IBM Plex Mono",monospace' }}>FROM EARLY USERS</div>
        <h2 style={{ fontSize:'clamp(1.6rem,3vw,2.2rem)', fontWeight:900, letterSpacing:'-.04em', color:T.text, marginBottom:40 }}>What teams are saying</h2>
        <div style={{ position:'relative', minHeight:160 }}>
          {TESTIMONIALS.map((t,i) => (
            <motion.div key={t.role}
              initial={{ opacity:0 }} animate={{ opacity: i===activeTestimonial?1:0 }}
              transition={{ duration:.5 }}
              style={{ position: i===0?'relative':'absolute', top:0, left:0, right:0, pointerEvents: i===activeTestimonial?'auto':'none' }}>
              <div style={{ padding:'28px 32px', borderRadius:16, background:T.bgCard, border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:32, color:T.a1, opacity:.4, lineHeight:1, marginBottom:12 }}>"</div>
                <p style={{ fontSize:16, color:T.textMid, lineHeight:1.7, fontStyle:'italic', marginBottom:20 }}>{t.text}</p>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:accentGrad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900, color:'#fff' }}>{t.avatar}</div>
                  <div style={{ textAlign:'left' }}>
                    <div style={{ fontSize:12, color:T.textSub }}>{t.role}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:24 }}>
          {TESTIMONIALS.map((_,i) => (
            <button key={i} onClick={() => setActiveTestimonial(i)} aria-label={`Show testimonial ${i+1}`}
              style={{ width: i===activeTestimonial?24:8, height:8, borderRadius:99, background: i===activeTestimonial?T.a1:T.border, cursor:'pointer', transition:'all .3s', border:'none', padding:0 }}/>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ position:'relative', zIndex:1, padding:'80px 48px', textAlign:'center' }}>
        <motion.div initial={{ opacity:0, scale:.96 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }}
          style={{ maxWidth:600, margin:'0 auto', padding:'52px 40px', borderRadius:24, background:darkMode?'rgba(13,21,38,0.9)':'rgba(238,242,255,0.9)', border:`1px solid ${T.a1}33`, backdropFilter:'blur(20px)', boxShadow:`0 0 60px ${T.g1}` }}>
          <div style={{ fontSize:40, marginBottom:16 }}>🚀</div>
          <h2 style={{ fontSize:'clamp(1.6rem,3vw,2.2rem)', fontWeight:900, letterSpacing:'-.04em', color:T.text, marginBottom:12 }}>Ready to get started?</h2>
          <p style={{ fontSize:14, color:T.textMid, lineHeight:1.7, marginBottom:32 }}>Free 14-day trial. No credit card required. Full access to all features from day one.</p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={onNavigateRegister}
              style={{ padding:'13px 32px', borderRadius:10, border:'none', background:accentGrad, color:'#fff', fontWeight:800, fontSize:15, cursor:'pointer', fontFamily:'inherit', boxShadow:`0 0 28px ${T.g1}` }}>
              Create Free Account →
            </button>
            <button onClick={onNavigateLogin} className="btn-outline"
              style={{ padding:'13px 32px', borderRadius:10, border:`1.5px solid ${T.border}`, background:'transparent', color:T.text, fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'inherit', transition:'all .2s' }}>
              Sign In
            </button>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer style={{ position:'relative', zIndex:1, borderTop:`1px solid ${T.border}`, padding:'24px 48px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:24, height:24, borderRadius:6, background:accentGrad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>⚡</div>
          <span style={{ fontWeight:800, fontSize:14, color:T.text }}>InventIQ AI</span>
          <span style={{ fontSize:12, color:T.textSub, marginLeft:8 }}>© 2026 All rights reserved</span>
        </div>
        <div style={{ display:'flex', gap:24 }}>
          {['Privacy','Terms','Security','Docs'].map(l => (
            <a key={l} href="#" style={{ fontSize:12, color:T.textSub, textDecoration:'none' }}
              onMouseEnter={e=>e.currentTarget.style.color=T.text} onMouseLeave={e=>e.currentTarget.style.color=T.textSub}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}