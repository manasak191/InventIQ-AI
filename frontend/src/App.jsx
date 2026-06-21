import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import ResetPassword from "./pages/ResetPassword";

function AppInner() {
  const [page, setPage] = useState('landing');
  const [darkMode, setDarkMode] = useState(true);
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      setPage(user.role === 'admin' ? 'admin' : 'user');
    }
  }, [user, loading]);

  useEffect(() => {
  const path = window.location.pathname;

  if (path === "/reset-password") {
    setPage("reset-password");
  }
}, []);

  const handleLoginSuccess = (role) => {
    setPage(role === 'admin' ? 'admin' : 'user');
  };

  const handleLogout = () => {
    logout();
    setPage('landing');
  };

  const toggle = () => setDarkMode(v => !v);

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#070B14', color:'#EEF2FF', fontFamily:'sans-serif', fontSize:18, gap:12 }}>
      <div style={{ width:20, height:20, border:'3px solid #4F8EF7', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
      Loading…
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : '';

  return (
    <>
      <ToastContainer theme={darkMode ? 'dark' : 'light'} position="top-right" />
      {page === 'landing'  && <LandingPage  darkMode={darkMode} onToggleDarkMode={toggle} onNavigateLogin={() => setPage('login')} onNavigateRegister={() => setPage('register')} />}
      {page === 'login'    && <LoginPage    darkMode={darkMode} onToggleDarkMode={toggle} onNavigateRegister={() => setPage('register')} onNavigateLanding={() => setPage('landing')} onLoginSuccess={handleLoginSuccess} />}
      {page === 'register' && <RegisterPage darkMode={darkMode} onToggleDarkMode={toggle} onNavigateLogin={() => setPage('login')} onNavigateLanding={() => setPage('landing')} />}
      {page === 'admin'    && <AdminDashboard darkMode={darkMode} onToggleDarkMode={toggle} onLogout={handleLogout} adminName={userName} />}
      {page === 'user'     && <UserDashboard  darkMode={darkMode} onToggleDarkMode={toggle} onLogout={handleLogout} userName={userName} />}
      {page === "reset-password" && (
          <ResetPassword
              darkMode={darkMode}
              onToggleDarkMode={toggle}
              onNavigateLogin={() => setPage("login")}
              onNavigateLanding={() => setPage("landing")}
          />
       )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
