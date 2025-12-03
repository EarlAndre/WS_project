import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";


function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Seed default demo users if list is empty (first time setup)
      if (users.length === 0) {
        users = [
          { id: '1', email: 'admin@example.com', password: 'admin' },
          { id: '2', email: 'participant@example.com', password: 'participant' },
        ];
      }
      
      const exists = users.find(u => (u.email || '').toLowerCase() === (email || '').toLowerCase());
      if (exists) {
        window.dispatchEvent(new CustomEvent('app-banner', { detail: 'Account already exists' }));
        setIsLoading(false);
        return;
      }
      const user = { id: String(Date.now()), email: (email || '').toLowerCase(), password };
      users.push(user);
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userRole', user.email === 'admin@example.com' ? 'admin' : 'participant');
      navigate(user.email === 'admin@example.com' ? '/admin' : '/participant');
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('app-banner', { detail: 'Unexpected signup error' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleSubmit}>
        <div style={{ textAlign: "center", marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "2px solid #e0e0e0" }}>
          <h1 style={{ fontSize: "1.4rem", color: "#1a3a52", margin: 0 }}>Create Account</h1>
        </div>

        <label style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: "0.8rem", borderRadius: 8, border: "1px solid #e0e0e0" }} />

        <label style={{ fontWeight: 600, margin: "1rem 0 0.5rem 0" }}>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: "0.8rem", borderRadius: 8, border: "1px solid #e0e0e0" }} />

        <button type="submit" disabled={isLoading} style={{ marginTop: "1rem", padding: "0.9rem", borderRadius: 10, background: isLoading ? "#ccc" : "linear-gradient(135deg,#c41e3a,#a01831)", color: "white", border: "none" }}>
          {isLoading ? "Creating..." : "Create Account"}
        </button>

        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <small>Already have an account? <a href="/">Sign in</a></small>
        </div>
      </form>
    </div>
  );
}

export default Register;
