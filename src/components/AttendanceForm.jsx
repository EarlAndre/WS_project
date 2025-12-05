import React, { useState } from 'react';
import '../App.css';

/**
 * AttendanceForm Component
 * Displays a form for participants to enter their name, year, and section
 * before marking attendance via QR code scan.
 */
export default function AttendanceForm({ seminarId, onSubmit, onCancel, isLoading }) {
  const [name, setName] = useState(localStorage.getItem('participantName') || '');
  const [year, setYear] = useState(localStorage.getItem('participantYear') || '');
  const [section, setSection] = useState(localStorage.getItem('participantSection') || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !year.trim() || !section.trim()) {
      setError('Please fill in all fields (name, year, section).');
      return;
    }

    // Save to localStorage for future convenience
    localStorage.setItem('participantName', name);
    localStorage.setItem('participantYear', year);
    localStorage.setItem('participantSection', section);

    // Call the parent callback with form data
    onSubmit({ name, year, section });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{ margin: '0 0 30px 0', color: '#1a3a52', textAlign: 'center' }}>
          📋 Attendance Information
        </h2>
        <p style={{ margin: '0 0 25px 0', color: '#666', textAlign: 'center', fontSize: '0.95rem' }}>
          Please provide your information to mark attendance.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#ffe0e0',
              borderLeft: '4px solid #c41e3a',
              color: '#c41e3a',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#1a3a52' }}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Alice Johnson"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '1rem',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
              disabled={isLoading}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#1a3a52' }}>
              Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '1rem',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
              disabled={isLoading}
            >
              <option value="">-- Select Year --</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
              <option value="Graduate">Graduate</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#1a3a52' }}>
              Section / Class
            </label>
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="e.g., Section A or BSCS-1A"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '1rem',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
              disabled={isLoading}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              style={{
                padding: '10px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                color: '#666',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '10px',
                backgroundColor: '#c41e3a',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? 'Processing...' : 'Mark Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
