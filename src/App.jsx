import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Admin from "./components/Admin";
import Profile from "./components/Profile";
import Participant from "./components/Participant";
import CreateSeminar from "./components/CreateSeminar";
import EditSeminar from "./components/EditSeminar";
import QRRedirect from "./components/QRRedirect";


function App() {
  const navigate = useNavigate();
  const [globalMessage, setGlobalMessage] = useState(null);

  // Listen for global in-app banner events from other components
  React.useEffect(() => {
    const timeoutRef = { id: null };
    const handler = (e) => {
      const msg = e?.detail || String(e);
      setGlobalMessage(msg);
      if (timeoutRef.id) clearTimeout(timeoutRef.id);
      timeoutRef.id = setTimeout(() => {
        setGlobalMessage(null);
        timeoutRef.id = null;
      }, 8000);
    };
    window.addEventListener('app-banner', handler);
    return () => {
      window.removeEventListener('app-banner', handler);
      if (timeoutRef.id) clearTimeout(timeoutRef.id);
    };
  }, []);

  const handleLogin = async (username, password) => {
    // Simple local auth: support demo users or check localStorage
    const email = username.includes("@") ? username.toLowerCase() : `${username}@example.com`;
    
    // Define demo users for testing
    const demoUsers = [
      { id: '1', email: 'admin@example.com', password: 'admin' },
      { id: '2', email: 'participant@example.com', password: 'participant' },
    ];
    
    try {
      // Check demo users first
      let found = demoUsers.find(u => u.email === email && u.password === password);
      
      // If not demo user, check localStorage
      if (!found) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        found = users.find(u => (u.email || '').toLowerCase() === email && u.password === password);
      }
      
      if (!found) {
        setGlobalMessage('Authentication failed. Check your credentials. Try admin/admin or participant/participant');
        return;
      }

      const userEmail = email;
      const userId = found.id || String(Date.now());

      if (userEmail) localStorage.setItem('userEmail', userEmail);
      if (userId) localStorage.setItem('userId', userId);

      const adminEmailsRaw = import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.NEXT_PUBLIC_ADMIN_EMAILS || 'admin@example.com';
      const adminEmails = adminEmailsRaw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

      if (adminEmails.includes(userEmail)) {
        localStorage.setItem('userRole', 'admin');
        navigate('/admin');
      } else {
        localStorage.setItem('userRole', 'participant');
        const profileName = localStorage.getItem('participantName');
        if (!profileName) {
          navigate('/profile');
        } else {
          navigate('/participant');
        }
      }
    } catch (err) {
      console.error(err);
      setGlobalMessage('Login error. Check console for details.');
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    navigate('/');
  };

  return (
    <>
      {globalMessage && (
        <div className="app-banner" role="status">
          <div className="app-banner-inner">
            <span>{globalMessage}</span>
            <button className="app-banner-close" onClick={() => setGlobalMessage(null)} aria-label="Dismiss">×</button>
          </div>
        </div>
      )}
      <Routes>
        <Route path="/" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin onLogout={handleLogout} />} />
        <Route
          path="/participant"
          element={<Participant onLogout={handleLogout} />}
        />
        <Route
          path="/create-seminar"
          element={<CreateSeminar onLogout={handleLogout} />}
        />
        <Route
          path="/edit-seminar/:id"
          element={<EditSeminar onLogout={handleLogout} />}
        />
        <Route
          path="/qr"
          element={<QRRedirect />}
        />
      </Routes>
      <footer className="footer">
        © 2025 VPAA Seminar Certificate Automation System
      </footer>
    </>
  );
}

export default App;
