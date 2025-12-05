import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { recordTimeIn, recordTimeOut } from '../lib/db';
import AttendanceForm from './AttendanceForm';

export default function QRRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing your attendance...');
  const [result, setResult] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [qrPayload, setQrPayload] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const processQRData = async () => {
      try {
        // Get the data from URL hash or query params
        const hash = location.hash.substring(1); // remove '#'
        const params = new URLSearchParams(location.search);
        
        let qrData = hash || params.get('data');
        
        if (!qrData) {
          setStatus('error');
          setMessage('❌ No QR data found. Please scan again.');
          return;
        }

        // Try to parse QR data
        let payload = null;
        try {
          payload = JSON.parse(decodeURIComponent(qrData));
        } catch (e) {
          // If not JSON, try pipe-separated format
          if (qrData.includes('|')) {
            const [seminar_id, participant_email] = qrData.split('|');
            payload = { seminar_id, participant_email };
          }
        }

        if (!payload || !payload.seminar_id || !payload.participant_email) {
          setStatus('error');
          setMessage('❌ Invalid QR code data. Please try again.');
          return;
        }

        // Store payload, open the Google Form in a new tab, and show the in-app confirm form
        setQrPayload(payload);
        // Open the published Google Form for participants to fill (opens in new tab)
        try {
          window.open('https://docs.google.com/forms/d/e/1FAIpQLSeAa-p2RtaTYmuohv1r1uKfYO8bGMlk7NIcPnqYiAi6l9GD-w/viewform?usp=pp_url', '_blank');
        } catch (e) {
          console.warn('Could not open Google Form in new tab:', e);
        }
        setShowForm(true);
        setStatus('form');
        setMessage('');
        return;
        
        if (inRes.error) {
          console.error('Time IN error:', inRes.error);
          setStatus('error');
          setMessage('❌ Error processing attendance. Please try again.');
          return;
        }

        // Check if time_in was just recorded (no time_out yet) - this is CHECK IN
        const hasTimeOut = Array.isArray(inRes.data) 
          ? !!inRes.data[0]?.time_out 
          : !!inRes.data?.time_out;
        const hasTimeIn = Array.isArray(inRes.data) 
          ? !!inRes.data[0]?.time_in 
          : !!inRes.data?.time_in;

        if (hasTimeIn && !hasTimeOut) {
          // Just checked in
          const checkInTime = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          });
          setStatus('success');
          setMessage(`✅ Checked IN`);
          setResult({
            type: 'in',
            email: payload.participant_email,
            time: checkInTime,
            seminarId: payload.seminar_id
          });
          return;
        }

        // If already has time_in and no time_out, record time OUT - this is TIME OUT
        const outRes = await recordTimeOut(payload.seminar_id, payload.participant_email);
        
        if (outRes.error) {
          console.error('Time OUT error:', outRes.error);
          setStatus('error');
          setMessage('❌ Error recording time out. Please try again.');
          return;
        }

        const timeOutTime = new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        });
        setStatus('success');
        setMessage(`✅ Time OUT`);
        setResult({
          type: 'out',
          email: payload.participant_email,
          time: timeOutTime,
          seminarId: payload.seminar_id
        });

      } catch (err) {
        console.error('Unexpected error:', err);
        setStatus('error');
        setMessage('❌ Unexpected error. Please try again.');
      }
    };

    processQRData();
  }, [location]);

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      setMessage(`Processing attendance for ${qrPayload.participant_email}...`);

      // Try to record time IN first
      const inRes = await recordTimeIn(qrPayload.seminar_id, qrPayload.participant_email, formData);
      
      if (inRes.error) {
        console.error('Time IN error:', inRes.error);
        setStatus('error');
        setMessage('❌ Error processing attendance. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Check if time_in was just recorded (no time_out yet) - this is CHECK IN
      const hasTimeOut = Array.isArray(inRes.data) 
        ? !!inRes.data[0]?.time_out 
        : !!inRes.data?.time_out;
      const hasTimeIn = Array.isArray(inRes.data) 
        ? !!inRes.data[0]?.time_in 
        : !!inRes.data?.time_in;

      if (hasTimeIn && !hasTimeOut) {
        // Just checked in
        const checkInTime = new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        });
        setStatus('success');
        setMessage(`✅ Checked IN`);
        setResult({
          type: 'in',
          email: qrPayload.participant_email,
          time: checkInTime,
          seminarId: qrPayload.seminar_id,
          ...formData
        });
        setIsSubmitting(false);
        return;
      }

      // If already has time_in and no time_out, record time OUT - this is TIME OUT
      const outRes = await recordTimeOut(qrPayload.seminar_id, qrPayload.participant_email);
      
      if (outRes.error) {
        console.error('Time OUT error:', outRes.error);
        setStatus('error');
        setMessage('❌ Error recording time out. Please try again.');
        setIsSubmitting(false);
        return;
      }

      const timeOutTime = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
      setStatus('success');
      setMessage(`✅ Time OUT`);
      setResult({
        type: 'out',
        email: qrPayload.participant_email,
        time: timeOutTime,
        seminarId: qrPayload.seminar_id,
        ...formData
      });
      setIsSubmitting(false);

    } catch (err) {
      console.error('Unexpected error:', err);
      setStatus('error');
      setMessage('❌ Unexpected error. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setQrPayload(null);
    navigate('/');
  };

  useEffect(() => {
    // Auto-redirect after 3 seconds if successful
    if (status === 'success') {
      const timer = setTimeout(() => {
        navigate('/'); // or wherever you want to redirect
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  // Show form modal if needed
  if (showForm && qrPayload) {
    return (
      <AttendanceForm
        seminarId={qrPayload.seminar_id}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
        isLoading={isSubmitting}
      />
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}>
        {status === 'processing' && (
          <>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px',
              animation: 'spin 1s linear infinite'
            }}>
              ⏳
            </div>
            <h2 style={{
              margin: '0 0 10px 0',
              color: '#1a3a52',
              fontSize: '24px',
              fontWeight: '700'
            }}>
              {message}
            </h2>
            <p style={{
              margin: 0,
              color: '#999',
              fontSize: '14px'
            }}>
              Please wait while we process your attendance...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              fontSize: '64px',
              marginBottom: '20px'
            }}>
              ✅
            </div>
            <h2 style={{
              margin: '0 0 10px 0',
              color: '#27ae60',
              fontSize: '24px',
              fontWeight: '700'
            }}>
              {message}
            </h2>
            {result && (
              <div style={{
                background: '#f0f9f7',
                border: '2px solid #27ae60',
                borderRadius: '12px',
                padding: '20px',
                marginTop: '20px',
                textAlign: 'left'
              }}>
                <p style={{
                  margin: '8px 0',
                  color: '#1a3a52',
                  fontSize: '14px'
                }}>
                  <strong>Status:</strong> {result.type === 'in' ? 'Checked IN' : 'Timed Out'}
                </p>
                <p style={{
                  margin: '8px 0',
                  color: '#1a3a52',
                  fontSize: '14px'
                }}>
                  <strong>Time:</strong> {result.time}
                </p>
                <p style={{
                  margin: '8px 0',
                  color: '#1a3a52',
                  fontSize: '14px'
                }}>
                  <strong>Email:</strong> {result.email}
                </p>
              </div>
            )}
            <p style={{
              margin: '20px 0 0 0',
              color: '#999',
              fontSize: '14px'
            }}>
              Redirecting in 3 seconds...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              fontSize: '64px',
              marginBottom: '20px'
            }}>
              ❌
            </div>
            <h2 style={{
              margin: '0 0 10px 0',
              color: '#e74c3c',
              fontSize: '24px',
              fontWeight: '700'
            }}>
              {message}
            </h2>
            <button
              onClick={() => navigate('/')}
              style={{
                marginTop: '20px',
                padding: '12px 24px',
                background: '#2e5266',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#1a3a52';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#2e5266';
              }}
            >
              Go Home
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
