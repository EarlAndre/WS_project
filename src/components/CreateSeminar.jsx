import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { createSeminar as dbCreateSeminar } from "../lib/db";

function CreateSeminar({ onLogout }) {
  const navigate = useNavigate();
  const [seminar, setSeminar] = useState({
    title: "",
    duration: "",
    speaker: "",
    participants: "",
  });

  // time fields: hour (1-12), minute, period (AM/PM)
  const [time, setTime] = useState({ hour: "9", minute: "00", period: "AM" });
  const [endTime, setEndTime] = useState({ hour: "11", minute: "00", period: "AM" });

  const handleChange = (e) => {
    setSeminar({ ...seminar, [e.target.name]: e.target.value });
  };

  const handleTimeChange = (e) => {
    setTime({ ...time, [e.target.name]: e.target.value });
  };
  const handleEndTimeChange = (e) => {
    setEndTime({ ...endTime, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!seminar.title || !seminar.duration || !seminar.speaker || !seminar.participants) {
      window.dispatchEvent(new CustomEvent('app-banner', { detail: "Please fill out all required fields (title, duration, speaker, participants)." }));
      return;
    }

    // validate date and time
    if (!seminar.date) {
      if (!confirm('No date selected. Continue without a date?')) return;
    }

    // ensure time fields are present and valid (start and end)
    const hourNum = parseInt(time.hour, 10);
    const endHourNum = parseInt(endTime.hour, 10);
    const validMinutes = ['00', '15', '30', '45'];
    if (!time.hour || !time.minute || !time.period || isNaN(hourNum) || hourNum < 1 || hourNum > 12 || !validMinutes.includes(time.minute) || !(time.period === 'AM' || time.period === 'PM')) {
      window.dispatchEvent(new CustomEvent('app-banner', { detail: 'Please select a valid start time (hour 1-12, minute 00/15/30/45, AM/PM).' }));
      return;
    }
    if (!endTime.hour || !endTime.minute || !endTime.period || isNaN(endHourNum) || endHourNum < 1 || endHourNum > 12 || !validMinutes.includes(endTime.minute) || !(endTime.period === 'AM' || endTime.period === 'PM')) {
      window.dispatchEvent(new CustomEvent('app-banner', { detail: 'Please select a valid end time (hour 1-12, minute 00/15/30/45, AM/PM).' }));
      return;
    }

    // convert to minutes since midnight for comparison
    const toMinutes = (t) => {
      let h = parseInt(t.hour, 10) % 12;
      if (t.period === 'PM') h += 12;
      return h * 60 + parseInt(t.minute, 10);
    };
    const startMinutes = toMinutes(time);
    const finishMinutes = toMinutes(endTime);
    if (finishMinutes <= startMinutes) {
      window.dispatchEvent(new CustomEvent('app-banner', { detail: 'End time must be after start time.' }));
      return;
    }
    // prepare strings for saving
    const startString = `${time.hour.padStart(2,'0')}:${time.minute} ${time.period}`;
    const endString = `${endTime.hour.padStart(2,'0')}:${endTime.minute} ${endTime.period}`;
    // Try to persist to Supabase first
    try {
      const { data, error } = await dbCreateSeminar({
        title: seminar.title,
        duration: seminar.duration,
        speaker: seminar.speaker,
        participants: seminar.participants,
        date: seminar.date || null,
        start_time: startString,
        end_time: endString,
      });

      if (error) {
        // fallback to localStorage
        const seminars = JSON.parse(localStorage.getItem("seminars")) || [];
        seminars.push({ ...seminar, start_time: startString, end_time: endString });
        localStorage.setItem("seminars", JSON.stringify(seminars));
        window.dispatchEvent(new CustomEvent('app-banner', { detail: "Seminar saved locally (supabase error)." }));
      } else {
        const created = Array.isArray(data) && data[0] ? data[0] : null;
        const seminars = JSON.parse(localStorage.getItem("seminars")) || [];
        seminars.push(created || { ...seminar, start_time: startString, end_time: endString });
        localStorage.setItem("seminars", JSON.stringify(seminars));
        window.dispatchEvent(new CustomEvent('app-banner', { detail: "✅ Seminar created successfully!" }));
      }
    } catch (err) {
      const seminars = JSON.parse(localStorage.getItem("seminars")) || [];
      seminars.push({ ...seminar, start_time: startString, end_time: endString });
      localStorage.setItem("seminars", JSON.stringify(seminars));
      window.dispatchEvent(new CustomEvent('app-banner', { detail: "Seminar saved locally (unexpected error)." }));
    }

    setSeminar({ title: "", duration: "", speaker: "", participants: "" });
    setTime({ hour: "9", minute: "00", period: "AM" });
    setEndTime({ hour: "11", minute: "00", period: "AM" });
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div>
                <label style={{ fontWeight: "600", color: "#1a3a52", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span>📅</span> Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={seminar.date || ""}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "0.95rem",
                    border: "2px solid #e0e0e0",
                    borderRadius: "10px",
                    fontSize: "1rem",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ fontWeight: "600", color: "#1a3a52", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span>🕒</span> Start Time
                </label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <select name="hour" value={time.hour} onChange={handleTimeChange} style={{ padding: "0.75rem", borderRadius: 8, border: "2px solid #e0e0e0", fontSize: "1rem", minWidth: 80 }}>
                    {Array.from({ length: 12 }, (_, i) => String(i + 1)).map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <select name="minute" value={time.minute} onChange={handleTimeChange} style={{ padding: "0.75rem", borderRadius: 8, border: "2px solid #e0e0e0", fontSize: "1rem", minWidth: 80 }}>
                    {['00','15','30','45'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select name="period" value={time.period} onChange={handleTimeChange} style={{ padding: "0.75rem", borderRadius: 8, border: "2px solid #e0e0e0", fontSize: "1rem", minWidth: 90 }}>
                    <option>AM</option>
                    <option>PM</option>
                  </select>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontWeight: "600", color: "#1a3a52", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <span>⏳</span> End Time
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <select name="hour" value={endTime.hour} onChange={handleEndTimeChange} style={{ padding: "0.75rem", borderRadius: 8, border: "2px solid #e0e0e0", fontSize: "1rem", minWidth: 80 }}>
                      {Array.from({ length: 12 }, (_, i) => String(i + 1)).map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <select name="minute" value={endTime.minute} onChange={handleEndTimeChange} style={{ padding: "0.75rem", borderRadius: 8, border: "2px solid #e0e0e0", fontSize: "1rem", minWidth: 80 }}>
                      {['00','15','30','45'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select name="period" value={endTime.period} onChange={handleEndTimeChange} style={{ padding: "0.75rem", borderRadius: 8, border: "2px solid #e0e0e0", fontSize: "1rem", minWidth: 90 }}>
                      <option>AM</option>
                      <option>PM</option>
                    </select>
                  </div>
                </div>
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
