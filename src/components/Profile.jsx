import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Profile() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail") || "";
    setEmail(storedEmail);
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    if (!name) {
      window.dispatchEvent(new CustomEvent('app-banner', { detail: "Please enter your name" }));
      return;
    }
    localStorage.setItem("participantName", name);
    // optional certificate background setting
    const certBg = (document.getElementById('certBg') || {}).value || null;
    if (certBg) localStorage.setItem('certificateBackground', certBg);
    // Optionally save minimal profile keyed by email
    if (email) {
      const key = `profile:${email}`;
      localStorage.setItem(key, JSON.stringify({ name, email }));
    }
    navigate("/participant");
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "1rem" }}>
      <form onSubmit={handleSave} style={{ width: "100%", maxWidth: 420, boxSizing: "border-box", padding: 24, borderRadius: 12, boxShadow: "0 6px 20px rgba(0,0,0,0.08)", background: "#fff" }}>
        <h2 style={{ marginTop: 0 }}>Complete Profile</h2>
        <p style={{ color: "#666" }}>Tell us your full name. We use this for certificates and attendance.</p>

        <label style={{ display: "block", fontWeight: 600, marginTop: 12 }}>Email</label>
        <input type="email" value={email} readOnly style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e0e0e0" }} />

        <label style={{ display: "block", fontWeight: 600, marginTop: 12 }}>Full Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e0e0e0" }} />

          <label style={{ display: "block", fontWeight: 600, marginTop: 12 }}>Certificate Background (color or image URL)</label>
          <input id="certBg" type="text" placeholder="#ffffff or https://..." style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e0e0e0" }} defaultValue={localStorage.getItem('certificateBackground') || ''} />

          <button type="submit" style={{ marginTop: 16, padding: 10, width: "100%", borderRadius: 8, background: "linear-gradient(135deg,#c41e3a,#a01831)", color: "#fff", border: "none" }}>Save Profile</button>
      </form>
    </div>
  );
}

export default Profile;
