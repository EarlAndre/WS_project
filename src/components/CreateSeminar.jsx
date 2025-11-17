import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function CreateSeminar({ onLogout }) {
  const navigate = useNavigate();
  const [seminar, setSeminar] = useState({
    title: "",
    duration: "",
    speaker: "",
    participants: "",
  });

  const handleChange = (e) => {
    setSeminar({ ...seminar, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!seminar.title || !seminar.duration || !seminar.speaker || !seminar.participants) {
      alert("Please fill out all fields.");
      return;
    }
    const seminars = JSON.parse(localStorage.getItem("seminars")) || [];
    seminars.push(seminar);
    localStorage.setItem("seminars", JSON.stringify(seminars));
    alert("✅ Seminar created successfully!");
    setSeminar({ title: "", duration: "", speaker: "", participants: "" });
    navigate("/admin");
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>👨‍💼</div>
          <h2 className="logo" style={{ margin: 0, fontSize: "1.5rem", color: "#ffffff" }}>VPAA System</h2>
        </div>
        <ul>
          <li onClick={() => navigate("/admin")} style={{ cursor: "pointer" }}>📊 Dashboard</li>
          <li className="active" style={{ cursor: "pointer" }}>➕ Create Seminar</li>
          <li onClick={() => navigate("/admin")} style={{ cursor: "pointer" }}>📋 Seminar List</li>
        </ul>
        <button className="logout" onClick={onLogout}>🚪 Logout</button>
      </aside>

      {/* Main Content */}
      <main className="content">
        <header className="content-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ margin: 0 }}>➕ Create New Seminar</h1>
            <p style={{ margin: "0.5rem 0 0 0", color: "#666", fontSize: "0.95rem" }}>
              Add a new seminar to the system and manage registrations
            </p>
          </div>
          <div style={{ fontSize: "2.5rem" }}>🎯</div>
        </header>

        {/* Form Card */}
        <div className="card form-card" style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "2.5rem",
          boxShadow: "0 8px 25px rgba(0,0,0,0.08)"
        }}>
          <div style={{ marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "2px solid #e0e0e0" }}>
            <h3 style={{ margin: 0, color: "#1a3a52", fontSize: "1.3rem" }}>📋 Seminar Details</h3>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <label style={{ fontWeight: "600", color: "#1a3a52", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span>🎤</span> Seminar Title *
              </label>
              <input
                type="text"
                name="title"
                placeholder="e.g., Advanced React Development"
                value={seminar.title}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "0.95rem",
                  border: "2px solid #e0e0e0",
                  borderRadius: "10px",
                  fontSize: "1rem",
                  transition: "all 0.3s",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => e.target.style.borderColor = "#c41e3a"}
                onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div>
                <label style={{ fontWeight: "600", color: "#1a3a52", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span>⏱️</span> Duration (hours) *
                </label>
                <input
                  type="number"
                  name="duration"
                  placeholder="2"
                  value={seminar.duration}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "0.95rem",
                    border: "2px solid #e0e0e0",
                    borderRadius: "10px",
                    fontSize: "1rem",
                    transition: "all 0.3s",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#c41e3a"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                />
              </div>
              <div>
                <label style={{ fontWeight: "600", color: "#1a3a52", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span>👥</span> Max Participants *
                </label>
                <input
                  type="number"
                  name="participants"
                  placeholder="50"
                  value={seminar.participants}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "0.95rem",
                    border: "2px solid #e0e0e0",
                    borderRadius: "10px",
                    fontSize: "1rem",
                    transition: "all 0.3s",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#c41e3a"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                />
              </div>
            </div>

            <div>
              <label style={{ fontWeight: "600", color: "#1a3a52", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span>�‍🏫</span> Speaker / Trainer Name *
              </label>
              <input
                type="text"
                name="speaker"
                placeholder="e.g., Dr. John Doe"
                value={seminar.speaker}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "0.95rem",
                  border: "2px solid #e0e0e0",
                  borderRadius: "10px",
                  fontSize: "1rem",
                  transition: "all 0.3s",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => e.target.style.borderColor = "#c41e3a"}
                onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
              <button 
                type="submit"
                style={{
                  padding: "1rem",
                  background: "linear-gradient(135deg, #c41e3a, #a01831)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  boxShadow: "0 4px 15px rgba(196, 30, 58, 0.2)"
                }}
                onMouseOver={(e) => e.currentTarget.style.boxShadow = "0 6px 20px rgba(196, 30, 58, 0.3)"}
                onMouseOut={(e) => e.currentTarget.style.boxShadow = "0 4px 15px rgba(196, 30, 58, 0.2)"}
              >
                ✅ Create Seminar
              </button>
              <button 
                type="button"
                onClick={() => navigate("/admin")}
                style={{
                  padding: "1rem",
                  background: "#f5f5f5",
                  color: "#666",
                  border: "2px solid #e0e0e0",
                  borderRadius: "10px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#e0e0e0";
                  e.currentTarget.style.borderColor = "#999";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#f5f5f5";
                  e.currentTarget.style.borderColor = "#e0e0e0";
                }}
              >
                ← Back
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CreateSeminar;
