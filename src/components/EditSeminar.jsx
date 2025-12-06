import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../App.css";
import { fetchSeminars, upsertSeminar as dbUpsertSeminar } from "../lib/db";

const toISODateTime = (dateString, t) => {
  if (!dateString) return null;
  let hour = parseInt(t.hour, 10) % 12;
  if (String(t.period).toUpperCase() === 'PM') hour += 12;
  const minute = parseInt(t.minute, 10);
  const [year, month, day] = dateString.split('-').map(Number);
  const dt = new Date(year, month - 1, day, hour, minute, 0, 0);
  return dt.toISOString();
};

function EditSeminar({ onLogout }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [seminar, setSeminar] = useState({
    title: "",
    duration: "",
    speaker: "",
    participants: "",
    semester: "1",
    date: "",
  });

  const [time, setTime] = useState({ hour: "9", minute: "00", period: "AM" });
  const [endTime, setEndTime] = useState({ hour: "11", minute: "00", period: "AM" });

  // Load seminar data on mount
  useEffect(() => {
    async function loadSeminar() {
      if (!id) {
        navigate("/admin");
        return;
      }

      try {
        const { data, error } = await fetchSeminars();
        if (error || !data) {
          const storedSeminars = JSON.parse(localStorage.getItem("seminars")) || [];
          const foundSeminar = storedSeminars.find(s => String(s.id) === String(id));
          if (foundSeminar) {
            populateSeminar(foundSeminar);
            setLoading(false);
          } else {
            window.dispatchEvent(new CustomEvent('app-banner', { detail: "Seminar not found." }));
            navigate("/admin");
          }
        } else {
          const foundSeminar = data.find(s => String(s.id) === String(id));
          if (foundSeminar) {
            populateSeminar(foundSeminar);
            setLoading(false);
          } else {
            window.dispatchEvent(new CustomEvent('app-banner', { detail: "Seminar not found." }));
            navigate("/admin");
          }
        }
      } catch (err) {
        console.error('Error loading seminar:', err);
        const storedSeminars = JSON.parse(localStorage.getItem("seminars")) || [];
        const foundSeminar = storedSeminars.find(s => String(s.id) === String(id));
        if (foundSeminar) {
          populateSeminar(foundSeminar);
          setLoading(false);
        } else {
          window.dispatchEvent(new CustomEvent('app-banner', { detail: "Error loading seminar." }));
          navigate("/admin");
        }
      }
    }

    loadSeminar();
  }, [id, navigate]);

  const populateSeminar = (s) => {
    setSeminar({
      title: s.title || "",
      duration: s.duration || "",
      speaker: s.speaker || "",
      participants: s.participants || "",
      semester: s.semester || "1",
      date: s.date || "",
    });

    // Parse start_time and end_time if available
    if (s.start_time) {
      try {
        const parts = s.start_time.split(' ');
        if (parts.length === 2) {
          const [timeStr, period] = parts;
          const [hour, minute] = timeStr.split(':');
          setTime({ hour: hour || "9", minute: minute || "00", period: period || "AM" });
        }
      } catch (e) {
        console.warn('Error parsing start_time:', e);
      }
    }

    if (s.end_time) {
      try {
        const parts = s.end_time.split(' ');
        if (parts.length === 2) {
          const [timeStr, period] = parts;
          const [hour, minute] = timeStr.split(':');
          setEndTime({ hour: hour || "11", minute: minute || "00", period: period || "AM" });
        }
      } catch (e) {
        console.warn('Error parsing end_time:', e);
      }
    }
  };

  const handleChange = (e) => {
    let value = e.target.value;
    
    // Special handling for participants field - only allow positive whole numbers
    if (e.target.name === 'participants') {
      // Remove all non-digit characters (including -, ., etc)
      value = value.replace(/\D/g, '');
      // Ensure it's not empty when there's input
      if (value === '' && e.target.value !== '') {
        value = ''; // Clear if all non-digits were removed
      }
    }
    
    setSeminar({ ...seminar, [e.target.name]: value });
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
      window.dispatchEvent(new CustomEvent('app-banner', { detail: "Please fill out all required fields." }));
      return;
    }

    const hourNum = parseInt(time.hour, 10);
    const endHourNum = parseInt(endTime.hour, 10);
    const minuteNum = parseInt(time.minute, 10);
    const endMinuteNum = parseInt(endTime.minute, 10);

    if (!time.hour || !time.minute || !time.period || isNaN(hourNum) || hourNum < 1 || hourNum > 12 || isNaN(minuteNum) || minuteNum < 0 || minuteNum > 59) {
      window.dispatchEvent(new CustomEvent('app-banner', { detail: 'Please select a valid start time (hour 1-12, minute 0-59).' }));
      return;
    }

    if (!endTime.hour || !endTime.minute || !endTime.period || isNaN(endHourNum) || endHourNum < 1 || endHourNum > 12 || isNaN(endMinuteNum) || endMinuteNum < 0 || endMinuteNum > 59) {
      window.dispatchEvent(new CustomEvent('app-banner', { detail: 'Please select a valid end time (hour 1-12, minute 0-59).' }));
      return;
    }

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

    const startString = `${time.hour.padStart(2, '0')}:${time.minute} ${time.period}`;
    const endString = `${endTime.hour.padStart(2, '0')}:${endTime.minute} ${endTime.period}`;

    const start_datetime = seminar.date ? toISODateTime(seminar.date, time) : null;
    const end_datetime = seminar.date ? toISODateTime(seminar.date, endTime) : null;

    const payload = {
      title: seminar.title,
      duration: seminar.duration,
      speaker: seminar.speaker,
      participants: seminar.participants,
      date: seminar.date || null,
      semester: seminar.semester || "1",
      start_time: startString,
      end_time: endString,
      start_datetime,
      end_datetime,
      updated_at: new Date().toISOString(),
    };

    try {
      const updatePayload = {
        ...payload,
        id: id
      };
      const { data, error } = await dbUpsertSeminar(updatePayload);

      if (error) {
        const seminars = JSON.parse(localStorage.getItem("seminars")) || [];
        const idx = seminars.findIndex(s => String(s.id) === String(id));
        if (idx >= 0) {
          seminars[idx] = { ...seminars[idx], ...payload };
          localStorage.setItem("seminars", JSON.stringify(seminars));
        }
        window.dispatchEvent(new CustomEvent('app-banner', { detail: "Seminar updated locally." }));
      } else {
        const seminars = JSON.parse(localStorage.getItem("seminars")) || [];
        const idx = seminars.findIndex(s => String(s.id) === String(id));
        if (idx >= 0) {
          seminars[idx] = { ...seminars[idx], ...payload };
          localStorage.setItem("seminars", JSON.stringify(seminars));
        }
        window.dispatchEvent(new CustomEvent('app-banner', { detail: "✅ Seminar updated successfully!" }));
      }

      navigate("/admin");
    } catch (err) {
      console.error('Error updating seminar:', err);
      window.dispatchEvent(new CustomEvent('app-banner', { detail: "Error updating seminar." }));
    }
  };

  const handleCancel = () => {
    navigate("/admin");
  };

  if (loading) {
    return <div className="admin-dashboard"><div style={{ textAlign: "center", padding: "2rem" }}>Loading...</div></div>;
  }

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
          <li onClick={() => navigate("/create-seminar")} style={{ cursor: "pointer" }}>➕ Create Seminar</li>
          <li onClick={() => navigate("/admin")} style={{ cursor: "pointer" }}>📋 Seminar List</li>
        </ul>
        <button className="logout" onClick={onLogout}>🚪 Logout</button>
      </aside>

      {/* Main Content */}
      <main className="content">
        <header className="content-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ margin: 0 }}>✏️ Edit Seminar</h1>
            <p style={{ margin: "0.5rem 0 0 0", color: "#666", fontSize: "0.95rem" }}>
              Update seminar details and settings
            </p>
          </div>
          <div style={{ fontSize: "2.5rem" }}>📝</div>
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

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              {/* Title */}
              <div>
                <label style={{ fontWeight: "600", color: "#333", display: "block", marginBottom: "0.5rem" }}>Title <span style={{ color: "red" }}>*</span></label>
                <input
                  type="text"
                  name="title"
                  value={seminar.title}
                  onChange={handleChange}
                  placeholder="Enter seminar title"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "2px solid #e0e0e0",
                    fontSize: "1rem",
                    boxSizing: "border-box",
                    transition: "border-color 0.3s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#c41e3a"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                />
              </div>

              {/* Duration */}
              <div>
                <label style={{ fontWeight: "600", color: "#333", display: "block", marginBottom: "0.5rem" }}>Duration <span style={{ color: "red" }}>*</span></label>
                <input
                  type="text"
                  name="duration"
                  value={seminar.duration}
                  onChange={handleChange}
                  placeholder="e.g., 2 hours"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "2px solid #e0e0e0",
                    fontSize: "1rem",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#c41e3a"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                />
              </div>

              {/* Speaker */}
              <div>
                <label style={{ fontWeight: "600", color: "#333", display: "block", marginBottom: "0.5rem" }}>Speaker <span style={{ color: "red" }}>*</span></label>
                <input
                  type="text"
                  name="speaker"
                  value={seminar.speaker}
                  onChange={handleChange}
                  placeholder="Enter speaker name"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "2px solid #e0e0e0",
                    fontSize: "1rem",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#c41e3a"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                />
              </div>

              {/* Participants */}
              <div>
                <label style={{ fontWeight: "600", color: "#333", display: "block", marginBottom: "0.5rem" }}>Participants <span style={{ color: "red" }}>*</span></label>
                <input
                  type="text"
                  name="participants"
                  value={seminar.participants}
                  onChange={handleChange}
                  onInput={(e) => {
                    e.target.value = e.target.value.replace(/\D/g, '');
                  }}
                  placeholder="e.g., 50"
                  inputMode="numeric"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "2px solid #e0e0e0",
                    fontSize: "1rem",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#c41e3a"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                />
              </div>

              {/* Date */}
              <div>
                <label style={{ fontWeight: "600", color: "#333", display: "block", marginBottom: "0.5rem" }}>Date</label>
                <input
                  type="date"
                  name="date"
                  value={seminar.date}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "2px solid #e0e0e0",
                    fontSize: "1rem",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#c41e3a"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                />
              </div>

              {/* Semester */}
              <div>
                <label style={{ fontWeight: "600", color: "#333", display: "block", marginBottom: "0.5rem" }}>Semester</label>
                <select
                  name="semester"
                  value={seminar.semester}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "2px solid #e0e0e0",
                    fontSize: "1rem",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#c41e3a"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                >
                  <option value="1">Semester 1 (Jan - Jun)</option>
                  <option value="2">Semester 2 (Jul - Dec)</option>
                </select>
              </div>
            </div>

            {/* Time Section */}
            <div style={{ marginBottom: "1.5rem", padding: "1.5rem", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
              <h3 style={{ marginTop: 0, marginBottom: "1rem", color: "#333" }}>Time Details</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {/* Start Time */}
                <div>
                  <label style={{ fontWeight: "600", color: "#333", display: "block", marginBottom: "0.5rem" }}>Start Time</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                    <input
                      type="number"
                      name="hour"
                      value={time.hour}
                      onChange={handleTimeChange}
                      min="1"
                      max="12"
                      style={{
                        padding: "0.75rem",
                        borderRadius: "8px",
                        border: "2px solid #e0e0e0",
                        fontSize: "1rem",
                        textAlign: "center",
                      }}
                      placeholder="HH"
                    />
                    <input
                      type="text"
                      name="minute"
                      value={time.minute}
                      onChange={handleTimeChange}
                      style={{
                        padding: "0.75rem",
                        borderRadius: "8px",
                        border: "2px solid #e0e0e0",
                        fontSize: "1rem",
                        textAlign: "center",
                      }}
                      placeholder="MM"
                    />
                    <select
                      name="period"
                      value={time.period}
                      onChange={handleTimeChange}
                      style={{
                        padding: "0.75rem",
                        borderRadius: "8px",
                        border: "2px solid #e0e0e0",
                        fontSize: "1rem",
                      }}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>

                {/* End Time */}
                <div>
                  <label style={{ fontWeight: "600", color: "#333", display: "block", marginBottom: "0.5rem" }}>End Time</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                    <input
                      type="number"
                      name="hour"
                      value={endTime.hour}
                      onChange={handleEndTimeChange}
                      min="1"
                      max="12"
                      style={{
                        padding: "0.75rem",
                        borderRadius: "8px",
                        border: "2px solid #e0e0e0",
                        fontSize: "1rem",
                        textAlign: "center",
                      }}
                      placeholder="HH"
                    />
                    <input
                      type="text"
                      name="minute"
                      value={endTime.minute}
                      onChange={handleEndTimeChange}
                      style={{
                        padding: "0.75rem",
                        borderRadius: "8px",
                        border: "2px solid #e0e0e0",
                        fontSize: "1rem",
                        textAlign: "center",
                      }}
                      placeholder="MM"
                    />
                    <select
                      name="period"
                      value={endTime.period}
                      onChange={handleEndTimeChange}
                      style={{
                        padding: "0.75rem",
                        borderRadius: "8px",
                        border: "2px solid #e0e0e0",
                        fontSize: "1rem",
                      }}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "2rem" }}>
              <button
                type="submit"
                style={{
                  background: "linear-gradient(135deg, #c41e3a, #a01831)",
                  color: "white",
                  padding: "1rem",
                  borderRadius: "10px",
                  border: "none",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  boxShadow: "0 4px 15px rgba(196, 30, 58, 0.2)"
                }}
                onMouseOver={(e) => e.currentTarget.style.boxShadow = "0 6px 20px rgba(196, 30, 58, 0.3)"}
                onMouseOut={(e) => e.currentTarget.style.boxShadow = "0 4px 15px rgba(196, 30, 58, 0.2)"}
              >
                💾 Save Changes
              </button>

              <button
                type="button"
                onClick={handleCancel}
                style={{
                  background: "#f5f5f5",
                  color: "#666",
                  padding: "1rem",
                  borderRadius: "10px",
                  border: "2px solid #e0e0e0",
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
                Cancel
              </button>
            </div>
            </form>
        </div>
      </main>
    </div>
  );
}

export default EditSeminar;
