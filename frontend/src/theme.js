export const DARK = {
  bg:'#070B14', bgCard:'#0D1526', bgCard2:'#0A1020', bgCard3:'#111C30',
  border:'rgba(255,255,255,0.08)', text:'#EEF2FF', textMid:'#8A9BB8', textSub:'#4A6080',
  a1:'#4F8EF7', a2:'#9B6DFF', a3:'#00D4B4', a4:'#FF6B35',
  green:'#22D67A', red:'#FF4D6D', yellow:'#F59E0B',
  g1:'rgba(79,142,247,0.18)', g2:'rgba(155,109,255,0.15)',
};

export const LIGHT = {
  bg:'#F4F7FF', bgCard:'#FFFFFF', bgCard2:'#EEF2FF', bgCard3:'#E8EFFE',
  border:'rgba(0,0,0,0.09)', text:'#0D1526', textMid:'#334766', textSub:'#6B82A0',
  a1:'#2B6FF5', a2:'#7C3AED', a3:'#00A896', a4:'#E85D20',
  green:'#16A855', red:'#E62B4E', yellow:'#D97706',
  g1:'rgba(43,111,245,0.12)', g2:'rgba(124,58,237,0.10)',
};

export const globalStyles = (T, darkMode) => `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:"DM Sans","Inter",system-ui,sans-serif;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  @keyframes spin{to{transform:rotate(360deg)}}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:${T.a1}55;border-radius:99px}
  .nav-item:hover{background:${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}!important;}
  .row-hover:hover{background:${darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}!important;}
  input::placeholder{color:${T.textSub}}
`;
