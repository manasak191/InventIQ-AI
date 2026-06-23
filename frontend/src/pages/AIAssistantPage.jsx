import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '../api/inventoryService';

const INITIAL_MSG = { role:'ai', text:"Hi! I'm your InventIQ AI assistant. Ask me anything about your inventory — reorder advice, stockout risks, warehouse capacity, supplier performance, or monthly summaries. I answer from your live data." };

const QUICK_PROMPTS = [
  'What should I reorder today?',
  'Show me stockout risk items',
  'Summarize inventory this month',
  'Which warehouse has most space?',
  'Who is the best performing supplier?',
  'Forecast demand for next 30 days',
];

export default function AIAssistantPage({ T, darkMode, isAdmin }) {
  const [msgs, setMsgs]       = useState([INITIAL_MSG]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const chatRef               = useRef(null);

  const accentGrad = `linear-gradient(135deg,${T.a1},${T.a2})`;
  const card = { background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:22 };

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setError(null);
    setMsgs(prev => [...prev, { role:'user', text:msg }]);
    setLoading(true);

    const history = msgs.slice(-10).map(m => ({ role: m.role==='ai'?'assistant':'user', content: m.text }));
    const { data, error: err, status } = await aiService.chat(msg, history);

    if (err) {
      if (status === 403) {
        // Restricted topic — admin-only data. Distinct from a network/backend failure.
        setError('restricted');
        setMsgs(prev => [...prev, { role:'restricted', text: err || "Access denied: that information is restricted to admin accounts only." }]);
      } else {
        setError('network');
        setMsgs(prev => [...prev, { role:'ai', text:'⚠ Could not connect to backend. Please make sure the server is running at http://127.0.0.1:8000' }]);
      }
    } else {
      const reply = data?.response || data?.message || data?.reply || 'I could not generate a response. Please try again.';
      setMsgs(prev => [...prev, { role:'ai', text:reply }]);
    }
    setLoading(false);
  };

  const clearChat = () => { setMsgs([INITIAL_MSG]); setError(null); };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 130px)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <h1 style={{ fontSize:'1.4rem', fontWeight:900, color:T.text, letterSpacing:'-.03em' }}>AI Assistant</h1>
          <p style={{ fontSize:13, color:T.textSub }}>Answers from your live inventory data</p>
        </div>
        <button onClick={clearChat} style={{ padding:'7px 16px', borderRadius:8, border:`1px solid ${T.border}`, background:'transparent', cursor:'pointer', fontSize:12, color:T.textMid, fontFamily:'inherit' }}>🗑 Clear Chat</button>
      </div>

      <div style={{ flex:1, ...card, border:`1px solid ${T.a1}28`, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, paddingBottom:16, borderBottom:`1px solid ${T.border}`, marginBottom:16, flexShrink:0 }}>
          <div style={{ width:42, height:42, borderRadius:'50%', background:accentGrad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>✨</div>
          <div>
            <div style={{ fontWeight:800, fontSize:15, color:T.text }}>InventIQ AI {isAdmin?'— Admin Mode':''}</div>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:T.green, animation:'pulse 1.4s infinite' }} />
              <span style={{ fontSize:11, color:T.green, fontWeight:700 }}>Online · Connected to your inventory database</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={chatRef} style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:14, paddingRight:4, minHeight:0 }}>
          {msgs.map((m,i) => {
            const isRestricted = m.role === 'restricted';
            const isUser = m.role === 'user';
            const isAiSide = !isUser; // ai + restricted both render on the left, avatar side

            return (
              <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                style={{ display:'flex', justifyContent: isUser?'flex-end':'flex-start', gap:8 }}>
                {isAiSide && (
                  <div style={{
                    width:30, height:30, borderRadius:'50%',
                    background: isRestricted ? '#ef444422' : accentGrad,
                    border: isRestricted ? '1px solid #ef4444' : 'none',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0, alignSelf:'flex-end'
                  }}>
                    {isRestricted ? '🔒' : '✨'}
                  </div>
                )}
                <div style={{
                  maxWidth:'72%', padding:'12px 16px',
                  borderRadius: isUser?'18px 18px 4px 18px':'18px 18px 18px 4px',
                  background: isUser
                    ? `linear-gradient(135deg,${T.a1}22,${T.a2}18)`
                    : isRestricted
                      ? 'rgba(239,68,68,0.10)'
                      : (darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)'),
                  border: `1px solid ${isUser ? T.a1+'44' : isRestricted ? '#ef444466' : T.border}`,
                  fontSize:13, color: isRestricted ? '#ef4444' : T.text, fontWeight: isRestricted ? 600 : 400,
                  lineHeight:1.65, whiteSpace:'pre-wrap'
                }}>
                  {isRestricted && <span style={{ display:'block', fontSize:11, fontWeight:800, letterSpacing:'.04em', marginBottom:4, opacity:.85 }}>RESTRICTED — ADMIN ONLY</span>}
                  {m.text}
                </div>
                {isUser && (
                  <div style={{ width:30, height:30, borderRadius:'50%', background:`${T.a2}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0, alignSelf:'flex-end', border:`1px solid ${T.a2}44` }}>👤</div>
                )}
              </motion.div>
            );
          })}
          {loading && (
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <div style={{ width:30, height:30, borderRadius:'50%', background:accentGrad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>✨</div>
              <div style={{ padding:'12px 16px', borderRadius:'18px 18px 18px 4px', background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', border:`1px solid ${T.border}` }}>
                <div style={{ display:'flex', gap:4 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:T.a1, animation:`pulse 1.2s ${i*.2}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick prompts */}
        <div style={{ display:'flex', gap:8, marginTop:14, flexWrap:'wrap', flexShrink:0 }}>
          {QUICK_PROMPTS.map(p => (
            <button key={p} onClick={() => sendMessage(p)} disabled={loading}
              style={{ padding:'5px 12px', borderRadius:99, border:`1px solid ${T.a1}44`, background:`${T.a1}0E`, color:T.a1, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', opacity: loading?.5:1 }}>
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ display:'flex', gap:10, marginTop:12, flexShrink:0 }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==='Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask about inventory, reorders, forecasts, suppliers…" disabled={loading}
            style={{ flex:1, padding:'13px 16px', borderRadius:10, border:`1.5px solid ${T.border}`, background: darkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit' }} />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
            style={{ padding:'13px 22px', borderRadius:10, border:'none', background: (loading||!input.trim())?T.border:accentGrad, color:'#fff', fontWeight:700, fontSize:14, cursor:(loading||!input.trim())?'not-allowed':'pointer', flexShrink:0, transition:'all .2s' }}>
            Send ↑
          </button>
        </div>
      </div>
    </div>
  );
}