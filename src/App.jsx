import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Login from "./components/Login";
import Admin from "./components/Admin";
import Participant from "./components/Participant";
import CreateSeminar from "./components/CreateSeminar";

function App() {
  const navigate = useNavigate();

  const handleLogin = (username, password) => {
    if (username === "admin" && password === "admin123") {
      localStorage.setItem("userRole", "admin");
      navigate("/admin");
    } else if (username === "participant" && password === "part123") {
      localStorage.setItem("userRole", "participant");
      navigate("/participant");
    } else {
      alert("Invalid username or password!");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    navigate("/");
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Login onLogin={handleLogin} />} />
        <Route path="/admin" element={<Admin onLogout={handleLogout} />} />
        <Route
          path="/participant"
          element={<Participant onLogout={handleLogout} />}
        />
        <Route
          path="/create-seminar"
          element={<CreateSeminar onLogout={handleLogout} />}
        />
      </Routes>
      <footer className="footer">
        © 2025 VPAA Seminar Certificate Automation System
      </footer>
    </>
  );
}

export default App;
