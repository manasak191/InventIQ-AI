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
    const pts = Array.from({ length: 60 }, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-.5)*.3, vy: (Math.random()-.5)*.3,
      r: Math.random()*1.4+.3, a: Math.random()*.35+.07,
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
        if(d<100){ctx.beginPath();ctx.strokeStyle=`rgba(${col},${.07*(1-d/100)})`;ctx.lineWidth=.5;ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.stroke();}
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

const FEATURES = [
  { icon:'📦', title:'Real-time Inventory', desc:'Track every SKU across all warehouses with live updates and automatic status flags.' },
  { icon:'🤖', title:'AI Assistant', desc:'Ask anything — reorder advice, demand forecasts, supplier ratings — in plain language.' },
  { icon:'📧', title:'Low Stock Alerts', desc:'Auto-email admin when products fall below reorder point. Never face a stockout again.' },
  { icon:'📊', title:'Analytics & Reports', desc:'Revenue trends, stock movement charts, warehouse utilization — all in one dashboard.' },
  { icon:'🤝', title:'Supplier Management', desc:'Track on-time delivery rates, ratings, and order history for every supplier.' },
  { icon:'🔄', title:'Transaction Log', desc:'Every stock IN/OUT/Transfer recorded, traceable, and automatically adjusts live stock.' },
];

const STATS = [
  { value:'98.2%', label:'Stock Accuracy' },
  { value:'2,000+', label:'Teams Using InventIQ' },
  { value:'<10 min', label:'Setup Time' },
  { value:'92%', label:'AI Forecast Accuracy' },
];

const TESTIMONIALS = [
  { name:'Priya Menon', role:'Head of Supply Chain · Zara IN', text:'Set up in under 10 minutes. Our whole team was onboarded the same day.', avatar:'P' },
  { name:'Rahul Gupta', role:'COO · BigBasket', text:'The AI assistant alone saved us 3 hours a week on reorder decisions.', avatar:'R' },
  { name:'Ananya Singh', role:'Warehouse Manager · Myntra', text:'Low stock alerts hit our inbox before we even notice anything is running low.', avatar:'A' },
];

export default function LandingPage({ darkMode, onToggleDarkMode, onNavigateLogin, onNavigateRegister }) {
  const T = darkMode ? DARK : LIGHT;
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(v => (v + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const accentGrad = `linear-gradient(135deg,${T.a1},${T.a2})`;

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:'"DM Sans","Inter",system-ui,sans-serif', overflowX:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        .feature-card:hover{border-color:${T.a1}55!important;transform:translateY(-4px);}
        .btn-outline:hover{background:${T.a1}14!important;border-color:${T.a1}!important;}
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
      <section style={{ position:'relative', zIndex:1, textAlign:'center', padding:'100px 24px 80px' }}>
        <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:.7 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:99, background:darkMode?'rgba(79,142,247,0.12)':'rgba(43,111,245,0.1)', border:`1px solid ${T.a1}44`, marginBottom:28 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:T.green, animation:'pulse 1.4s infinite' }}/>
            <span style={{ fontSize:12, color:T.a1, fontWeight:700 }}>Live — 2,000+ teams tracking inventory</span>
          </div>
          <h1 style={{ fontSize:'clamp(2.4rem,6vw,4.2rem)', fontWeight:900, letterSpacing:'-.05em', lineHeight:1.05, marginBottom:24, maxWidth:800, margin:'0 auto 24px' }}>
            The AI-Powered Way to<br />
            <span style={{ background:accentGrad, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
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

        {/* STATS ROW */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.4, duration:.6 }}
          style={{ display:'flex', justifyContent:'center', gap:48, flexWrap:'wrap', marginTop:72 }}>
          {STATS.map((s,i) => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:'clamp(1.6rem,3vw,2.2rem)', fontWeight:900, background:accentGrad, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{s.value}</div>
              <div style={{ fontSize:12, color:T.textSub, marginTop:4, fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* FEATURES */}
      <section style={{ position:'relative', zIndex:1, padding:'60px 48px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.18em', color:T.a2, marginBottom:12 }}>EVERYTHING YOU NEED</div>
          <h2 style={{ fontSize:'clamp(1.8rem,4vw,2.6rem)', fontWeight:900, letterSpacing:'-.04em', color:T.text }}>Built for modern inventory teams</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20 }}>
          {FEATURES.map((f,i) => (
            <motion.div key={f.title} className="feature-card"
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*.08 }}
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
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.18em', color:T.a2, marginBottom:12 }}>LOVED BY TEAMS</div>
        <h2 style={{ fontSize:'clamp(1.6rem,3vw,2.2rem)', fontWeight:900, letterSpacing:'-.04em', color:T.text, marginBottom:40 }}>What our users say</h2>
        <div style={{ position:'relative', minHeight:160 }}>
          {TESTIMONIALS.map((t,i) => (
            <motion.div key={t.name}
              initial={{ opacity:0 }} animate={{ opacity: i===activeTestimonial?1:0 }}
              transition={{ duration:.5 }}
              style={{ position: i===0?'relative':'absolute', top:0, left:0, right:0, pointerEvents: i===activeTestimonial?'auto':'none' }}>
              <div style={{ padding:'28px 32px', borderRadius:16, background:T.bgCard, border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:32, color:T.a1, opacity:.4, lineHeight:1, marginBottom:12 }}>"</div>
                <p style={{ fontSize:16, color:T.textMid, lineHeight:1.7, fontStyle:'italic', marginBottom:20 }}>{t.text}</p>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:accentGrad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900, color:'#fff' }}>{t.avatar}</div>
                  <div style={{ textAlign:'left' }}>
                    <div style={{ fontSize:13, fontWeight:800, color:T.text }}>{t.name}</div>
                    <div style={{ fontSize:11, color:T.textSub }}>{t.role}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:24 }}>
          {TESTIMONIALS.map((_,i) => (
            <div key={i} onClick={() => setActiveTestimonial(i)}
              style={{ width: i===activeTestimonial?24:8, height:8, borderRadius:99, background: i===activeTestimonial?T.a1:T.border, cursor:'pointer', transition:'all .3s' }}/>
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
